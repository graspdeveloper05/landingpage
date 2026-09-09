#!/bin/bash

echo "🚀 Seri Negara Dialogue — deploy"

# ── Run from a copy of this script ────────────────────────────────────────
# Below, this script git-resets the very checkout it lives in, which can
# replace this file mid-run. bash does not load a script whole: it re-reads
# from disk at a saved byte offset after each command, so execution continues
# inside the NEW file at the OLD position -- running a mix of the two, or
# dying on a parse error partway through a deploy.
#
# A guard AFTER the reset cannot help -- by then bash is already reading the
# wrong file. So relaunch from a copy in /tmp first, while this file is still
# the one that was invoked. git may then rewrite the original freely.
#
# DEPLOY_SELF is the ORIGINAL path and is inherited by the copy, which must
# not recompute it from $0 -- $0 in the copy is /tmp, and both the working
# directory and the "did it change?" comparison below depend on the real one.
DEPLOY_SELF="${DEPLOY_SELF:-$(cd "$(dirname "$0")" && pwd)/$(basename "$0")}"

# This script lives at the REPO ROOT, beside frontend/ and backend/.
cd "$(dirname "$DEPLOY_SELF")" || exit 1

if [ "${DEPLOY_FROM_COPY:-}" != "1" ]; then
    DEPLOY_COPY=$(mktemp) || { echo "❌ Could not create a temp copy of deploy.sh."; exit 1; }
    cp "$DEPLOY_SELF" "$DEPLOY_COPY" || { rm -f "$DEPLOY_COPY"; exit 1; }
    DEPLOY_FROM_COPY=1 DEPLOY_SELF="$DEPLOY_SELF" bash "$DEPLOY_COPY" "$@"
    DEPLOY_RC=$?
    rm -f "$DEPLOY_COPY"
    exit $DEPLOY_RC
fi

# ── Layout ────────────────────────────────────────────────────────────────
FRONTEND_DIR="frontend"
BACKEND_DIR="backend"

# Phase 1 ships the SPA and the API as two independent things — the frontend
# does not call the backend yet. Set SERVE_SPA_FROM_LARAVEL=1 only once the
# backend has an SPA catch-all route to serve the built index.html.
SERVE_SPA_FROM_LARAVEL="${SERVE_SPA_FROM_LARAVEL:-0}"

# The cPanel PHP. Override for other hosts: PHP_BIN=/usr/bin/php bash deploy.sh
PHP_BIN="${PHP_BIN:-/opt/cpanel/ea-php82/root/usr/bin/php}"
if [ ! -x "$PHP_BIN" ]; then
    PHP_BIN="$(command -v php)" || true
fi
if [ -z "$PHP_BIN" ]; then
    echo "❌ No PHP binary found. Set PHP_BIN=/path/to/php and retry."
    exit 1
fi

for dir in "$FRONTEND_DIR" "$BACKEND_DIR"; do
    if [ ! -d "$dir" ]; then
        echo "❌ Expected $dir/ beside deploy.sh — is this the repo root?"
        exit 1
    fi
done

# ── Back up server-only files ─────────────────────────────────────────────
# .env never lives in git; it is per-server and must survive the reset below.
echo "💾 Backing up server-specific files..."
if [ -f "$BACKEND_DIR/.env" ]; then
    cp "$BACKEND_DIR/.env" /tmp/.sn-backend-env.backup
else
    echo "  ⚠️ No $BACKEND_DIR/.env on this server — Laravel will fail to boot until one exists."
fi

# NOTE: old assets are deliberately NOT deleted here. Wiping the built output
# up front means a failed build leaves the site serving an index.html that
# points at files which no longer exist — every asset 404s and the page is
# blank. The previous build stays on disk until a new one succeeds.

# ── Sync to origin ────────────────────────────────────────────────────────
echo "🔄 Resetting tracked files..."
git checkout -- "$FRONTEND_DIR/package-lock.json" 2>/dev/null

echo "📦 Stashing any remaining local changes..."
git stash --include-untracked 2>/dev/null

# This is a fetch-and-reset, not a pull. A pull is a merge, and a merge needs
# the two histories to be related; when a remote branch is rewritten, a merge
# dies with "Need to specify how to reconcile divergent branches" — fatal,
# easily ignored, and the deploy then rebuilds the OLD source and reports
# success. A deploy box has no work of its own to preserve.
echo "📥 Fetching latest code..."
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if ! git fetch origin "$BRANCH"; then
    echo "❌ git fetch failed — deploy aborted. Nothing was changed."
    exit 1
fi

# Commits here that origin has never seen. Resetting would destroy them, so
# stop and say so. Set ALLOW_DISCARD=1 once you have read the list.
AHEAD=$(git rev-list --count "origin/$BRANCH..HEAD")
if [ "$AHEAD" -gt 0 ] && [ "$ALLOW_DISCARD" != "1" ]; then
    echo "❌ This checkout has $AHEAD commit(s) that are NOT on origin/$BRANCH:"
    git log --oneline "origin/$BRANCH..HEAD" | sed 's/^/     /'
    echo ""
    echo "   Deploy aborted — nothing was changed, the site is untouched."
    echo "   Keep them:    push or cherry-pick them onto $BRANCH first."
    echo "   Discard them: ALLOW_DISCARD=1 bash deploy.sh"
    exit 1
fi
if [ "$AHEAD" -gt 0 ]; then
    echo "  ⚠️ Discarding $AHEAD local commit(s) — ALLOW_DISCARD=1 was set."
fi

if ! git reset --hard "origin/$BRANCH"; then
    echo "❌ git reset to origin/$BRANCH failed — deploy aborted."
    exit 1
fi
echo "  Now at $(git log --oneline -1)"

# The fetch may have brought a new deploy.sh. We are running a copy taken
# before it, so nothing is corrupted -- but the rest of THIS run would be the
# old logic. Start again with the new script, before any build or migration.
if [ -n "$DEPLOY_SELF" ] && ! cmp -s "$DEPLOY_SELF" "$0"; then
    if [ "${DEPLOY_REEXEC:-}" = "1" ]; then
        echo "  deploy.sh changed again on the second pass — continuing with this one."
    else
        echo "🔁 Restarting: this fetch updated deploy.sh..."
        git stash drop 2>/dev/null
        env -u DEPLOY_FROM_COPY DEPLOY_REEXEC=1 bash "$DEPLOY_SELF" "$@"
        exit $?
    fi
fi

git stash drop 2>/dev/null
chmod +x deploy.sh

echo "🔄 Restoring server-specific files..."
if [ -f /tmp/.sn-backend-env.backup ]; then
    cp /tmp/.sn-backend-env.backup "$BACKEND_DIR/.env"
fi

# ── Node ──────────────────────────────────────────────────────────────────
# Pin the Node runtime the same way PHP is pinned. A cPanel account's default
# node is often v16, which Vite rejects at config-resolve time with
# "crypto.getRandomValues is not a function" — so the build would quietly
# depend on nvm having been loaded by an interactive ~/.bashrc.
#
# The chmod is not paranoia: cPanel's Fix Permissions tool strips executable
# bits under $HOME. A non-executable node is invisible — PATH lookup falls
# through to the old system binary and fails much later as a confusing error.
NODE_BIN_DIR=""
for candidate in "$HOME"/.nvm/versions/node/v2[0-9]*/bin "$HOME"/.nvm/versions/node/v1[89]*/bin /opt/cpanel/ea-nodejs*/bin; do
    [ -f "$candidate/node" ] || continue
    chmod +x "$candidate"/* 2>/dev/null
    if [ -x "$candidate/node" ]; then
        NODE_BIN_DIR="$candidate"
        break
    fi
done
if [ -n "$NODE_BIN_DIR" ]; then
    export PATH="$NODE_BIN_DIR:$PATH"
    hash -r
fi
if ! command -v node >/dev/null 2>&1; then
    echo "❌ No node found — aborting before anything is touched."
    echo "   Vite 6 needs ^18 || >=20. Looked in ~/.nvm/versions/node/* and /opt/cpanel/ea-nodejs*/bin."
    exit 1
fi

# ── Build the frontend ────────────────────────────────────────────────────
echo "📦 Building frontend..."
echo "  Using node $(node -v) / npm $(npm -v)"
cd "$FRONTEND_DIR" || exit 1
npm ci 2>/dev/null || npm install
# Something on cPanel strips executable bits; vite has failed with exit 126
# "Permission denied" because of it. Cheap to restore, expensive to diagnose.
chmod +x node_modules/.bin/* 2>/dev/null
npm run build
BUILD_STATUS=$?

# A failed build must NOT be deployed. Because nothing was deleted up front,
# the previous bundle is still on disk and the site keeps serving it.
if [ $BUILD_STATUS -ne 0 ]; then
    echo ""
    echo "❌ Frontend build FAILED (exit $BUILD_STATUS) — deploy aborted."
    echo "   The site is still serving the previous build; nothing was broken."
    echo "   On cPanel this is usually the memory limit killing node. Retry with:"
    echo "     cd $(pwd) && NODE_OPTIONS=--max-old-space-size=2048 npm run build"
    exit 1
fi
cd ..
echo "  ✅ Frontend built to $FRONTEND_DIR/dist"

# ── Backend ───────────────────────────────────────────────────────────────
cd "$BACKEND_DIR" || exit 1

echo "🎼 Installing Laravel dependencies..."
if command -v composer >/dev/null 2>&1; then
    composer install --no-dev --optimize-autoloader
elif [ -f ~/composer.phar ]; then
    $PHP_BIN ~/composer.phar install --no-dev --optimize-autoloader
elif [ -f /usr/local/bin/composer ]; then
    $PHP_BIN /usr/local/bin/composer install --no-dev --optimize-autoloader
else
    echo "❌ Composer not found. Downloading..."
    curl -sS https://getcomposer.org/installer | $PHP_BIN -- --install-dir="$HOME" --filename=composer.phar
    if [ -f ~/composer.phar ]; then
        $PHP_BIN ~/composer.phar install --no-dev --optimize-autoloader
    else
        echo "❌ Could not install Composer — deploy aborted."
        exit 1
    fi
fi

echo "📁 Creating storage directories..."
mkdir -p storage/app/public
mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/logs
mkdir -p bootstrap/cache

echo "🔐 Setting permissions..."
chmod -R 775 storage bootstrap/cache

echo "🔗 Setting up storage symbolic link..."
if [ -L "public/storage" ]; then
    rm -f public/storage
elif [ -d "public/storage" ]; then
    rm -rf public/storage
fi
$PHP_BIN artisan storage:link
if [ -L "public/storage" ]; then
    echo "  ✅ Storage link created"
else
    echo "  ⚠️ artisan storage:link failed, linking manually..."
    (cd public && ln -sf ../storage/app/public storage)
    [ -L "public/storage" ] && echo "  ✅ Manual link created" || echo "  ❌ Could not create storage link"
fi

echo "📊 Running database migrations..."
$PHP_BIN artisan migrate --force

echo "🧹 Rebuilding caches..."
$PHP_BIN artisan config:clear
$PHP_BIN artisan route:clear
$PHP_BIN artisan view:clear
$PHP_BIN artisan config:cache
$PHP_BIN artisan route:cache
$PHP_BIN artisan view:cache

cd ..

# ── Optionally publish the SPA into Laravel's public/ ─────────────────────
# Off by default: Phase 1 runs them separately. Turning this on without an SPA
# catch-all route in the backend gives 404s on every route except "/".
if [ "$SERVE_SPA_FROM_LARAVEL" = "1" ]; then
    echo "📤 Publishing SPA into $BACKEND_DIR/public/..."
    mkdir -p "$BACKEND_DIR/public/assets"
    cp -r "$FRONTEND_DIR/dist/." "$BACKEND_DIR/public/"
    echo "  ✅ SPA published"
else
    echo "ℹ️ SPA left in $FRONTEND_DIR/dist (SERVE_SPA_FROM_LARAVEL=0)."
    echo "   Point the web root at $FRONTEND_DIR/dist, or set the flag once the"
    echo "   backend has an SPA catch-all route."
fi

rm -f /tmp/.sn-backend-env.backup

echo ""
echo "✅ Deployment completed!"
echo "🌐 Branch: $BRANCH"
echo ""
echo "📜 Recent Laravel errors (if any):"
tail -20 "$BACKEND_DIR/storage/logs/laravel.log" 2>/dev/null || echo "  No log file found"
