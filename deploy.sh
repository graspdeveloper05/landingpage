#!/bin/bash

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

echo "🚀 Seri Negara Dialogue — deploy"

# ── Layout ────────────────────────────────────────────────────────────────
FRONTEND_DIR="frontend"
BACKEND_DIR="backend"

# Per-server settings live OUTSIDE git, so the same commit deploys to staging
# and production without edits. Create ~/seri-negara-deploy.env on the server:
#
#     SPA_DOC_ROOT="$HOME/public_html"
#     API_DOC_ROOT="$HOME/api.example.com"     # blank = do not publish the API
#
DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-$HOME/seri-negara-deploy.env}"
# shellcheck source=/dev/null
[ -f "$DEPLOY_ENV_FILE" ] && . "$DEPLOY_ENV_FILE"

# Where the built SPA is published. On cPanel the primary domain serves
# ~/public_html; an addon domain or subdomain has its own directory.
SPA_DOC_ROOT="${SPA_DOC_ROOT:-$HOME/public_html}"

# Document root for the API subdomain, pointed at backend/public. Leave empty
# to skip publishing it — useful while only the SPA is going live.
API_DOC_ROOT="${API_DOC_ROOT:-}"

# Phase 1 puts only the SPA in front of visitors — the frontend does not call
# the API yet. So the backend stage (composer, migrations, caches) is opt-in:
# running it without a backend/.env and a database would abort a deploy whose
# frontend half was perfectly fine. Set DEPLOY_BACKEND=1 once the two are
# wired together, or leave it unset and it turns itself on as soon as a
# backend/.env appears on the server.
DEPLOY_BACKEND="${DEPLOY_BACKEND:-auto}"

# cPanel's own Git Version Control has already checked out the commit being
# deployed before .cpanel.yml runs, so the fetch-and-reset below would be a
# no-op at best and a fight at worst. .cpanel.yml sets this to 1.
SKIP_GIT_SYNC="${SKIP_GIT_SYNC:-0}"

# Hashed assets from recent builds are kept alongside the current ones. A tab
# left open across a deploy still asks for the chunks it loaded with, and
# keeping a few days of them means it keeps working instead of white-screening.
PRUNE_KEEP_DAYS="${PRUNE_KEEP_DAYS:-3}"

# The cPanel PHP. Override for other hosts: PHP_BIN=/usr/bin/php bash deploy.sh
PHP_BIN="${PHP_BIN:-/opt/cpanel/ea-php82/root/usr/bin/php}"
if [ ! -x "$PHP_BIN" ]; then
    PHP_BIN="$(command -v php)" || true
fi
# Not fatal on its own — a frontend-only deploy never touches PHP. The backend
# stage below checks again before it needs it.
if [ -z "$PHP_BIN" ]; then
    echo "  ⚠️ No PHP binary found. Set PHP_BIN=/path/to/php if the backend is deploying."
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
if [ "$SKIP_GIT_SYNC" = "1" ]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    echo "⏭️ Skipping git sync — cPanel already checked out $(git log --oneline -1 2>/dev/null)"
else
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
fi

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
if [ "$DEPLOY_BACKEND" = "auto" ]; then
    if [ -f "$BACKEND_DIR/.env" ]; then
        DEPLOY_BACKEND=1
    else
        DEPLOY_BACKEND=0
    fi
fi

if [ "$DEPLOY_BACKEND" != "1" ]; then
    if [ -f "$BACKEND_DIR/.env" ]; then
        echo "⏭️ Skipping the backend — DEPLOY_BACKEND=$DEPLOY_BACKEND."
    else
        echo "⏭️ Skipping the backend — no $BACKEND_DIR/.env on this server."
        echo "   To bring the API up: add $BACKEND_DIR/.env, then re-run."
    fi
    echo "   The SPA deploys on its own; nothing below depends on the API."
else
if [ -z "$PHP_BIN" ]; then
    echo "❌ The backend needs PHP and none was found. Set PHP_BIN=/path/to/php."
    exit 1
fi
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
fi

# ── Publish the SPA into its cPanel document root ─────────────────────────
# Copy-then-prune, never wipe-then-copy: if this step dies halfway, the old
# index.html and its assets are still on disk and the site keeps serving.
echo "📤 Publishing SPA to $SPA_DOC_ROOT..."
if [ ! -d "$SPA_DOC_ROOT" ]; then
    echo "❌ $SPA_DOC_ROOT does not exist. Create the domain in cPanel first,"
    echo "   or set SPA_DOC_ROOT in $DEPLOY_ENV_FILE."
    exit 1
fi

mkdir -p "$SPA_DOC_ROOT/assets"
cp -r "$FRONTEND_DIR/dist/." "$SPA_DOC_ROOT/" || {
    echo "❌ Could not copy the build into $SPA_DOC_ROOT — deploy aborted."
    exit 1
}
cp deploy/spa.htaccess "$SPA_DOC_ROOT/.htaccess"
echo "  ✅ SPA published"

# Prune superseded hashed assets.
#
# The keep-list is the set of files this build just produced, NOT the files
# named in index.html. index.html names only the entry chunk and the
# stylesheet; every route chunk is imported dynamically from inside the entry
# JS and appears nowhere in the HTML. Scanning the HTML would keep two files
# and delete the rest, and every lazy route would 404 into the SPA catch-all,
# come back as text/html, and be refused as a module script — a blank page.
echo "🗑️ Pruning superseded assets (keeping the last ${PRUNE_KEEP_DAYS} days)..."
if [ -d "$SPA_DOC_ROOT/assets" ] && [ -d "$FRONTEND_DIR/dist/assets" ]; then
    KEEP=" $(cd "$FRONTEND_DIR/dist/assets" && ls -1 2>/dev/null | tr '
' ' ')"
    if [ -z "${KEEP// }" ]; then
        echo "  ⚠️ This build produced no assets — skipping prune rather than emptying the directory."
    else
        KEPT=0; REMOVED=0
        for f in "$SPA_DOC_ROOT"/assets/*; do
            [ -f "$f" ] || continue
            base=$(basename "$f")
            case "$KEEP " in
                *" $base "*) KEPT=$((KEPT+1)); continue ;;
            esac
            # Not in this build, but keep it while it is recent so tabs opened
            # before this deploy can still load their chunks.
            if [ -n "$(find "$f" -mtime -"$PRUNE_KEEP_DAYS" 2>/dev/null)" ]; then
                KEPT=$((KEPT+1))
            else
                rm -f "$f"; REMOVED=$((REMOVED+1))
            fi
        done
        echo "  Kept $KEPT, removed $REMOVED."
    fi
else
    echo "  ⚠️ No assets directory — skipping prune."
fi

# ── Point the API document root at Laravel's public/ ──────────────────────
# A symlink, so Laravel's own public/.htaccess and index.php stay canonical in
# git rather than being copied and drifting.
if [ -n "$API_DOC_ROOT" ]; then
    echo "🔗 Publishing API at $API_DOC_ROOT..."
    API_TARGET="$(pwd)/$BACKEND_DIR/public"
    if [ -L "$API_DOC_ROOT" ]; then
        rm -f "$API_DOC_ROOT"
    elif [ -d "$API_DOC_ROOT" ]; then
        # A real directory here is cPanel's auto-created docroot. Move it aside
        # once rather than deleting anything the account may still want.
        mv "$API_DOC_ROOT" "$API_DOC_ROOT.replaced-$(date +%Y%m%d%H%M%S)"
    fi
    if ln -s "$API_TARGET" "$API_DOC_ROOT"; then
        echo "  ✅ $API_DOC_ROOT → $API_TARGET"
    else
        echo "  ⚠️ Could not symlink. Set the subdomain's document root to:"
        echo "     $API_TARGET"
    fi
else
    echo "ℹ️ API_DOC_ROOT is unset — the API was built but not published."
    echo "   Set it in $DEPLOY_ENV_FILE once the subdomain exists."
fi

rm -f /tmp/.sn-backend-env.backup

echo ""
echo "✅ Deployment completed!"
echo "🌐 Branch: $BRANCH"
echo ""
echo "📜 Recent Laravel errors (if any):"
tail -20 "$BACKEND_DIR/storage/logs/laravel.log" 2>/dev/null || echo "  No log file found"
