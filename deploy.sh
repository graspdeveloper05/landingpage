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

# When this run began, so the log summary at the end can tell errors caused by
# this deploy apart from ones that have been sitting in the file for hours.
DEPLOY_STARTED=$(date '+%Y-%m-%d %H:%M:%S')

# ── Layout ────────────────────────────────────────────────────────────────
FRONTEND_DIR="frontend"
BACKEND_DIR="backend"

# Per-server settings live OUTSIDE git, so the same commit deploys to staging
# and production without edits. Create ~/seri-negara-deploy.env on the server:
#
#     SPA_DOC_ROOT="$HOME/public_html"
#
DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-$HOME/seri-negara-deploy.env}"
# shellcheck source=/dev/null
[ -f "$DEPLOY_ENV_FILE" ] && . "$DEPLOY_ENV_FILE"

# The document root of the live domain. On cPanel the primary domain serves
# ~/public_html; an addon domain has its own directory.
SPA_DOC_ROOT="${SPA_DOC_ROOT:-$HOME/public_html}"

# ── One domain, one document root ─────────────────────────────────────────
# The built SPA is published INTO backend/public, and the document root is a
# symlink to that directory. So one domain serves both:
#
#     https://site/            index.html      (Apache, straight off disk)
#     https://site/assets/*    hashed chunks   (Apache, straight off disk)
#     https://site/speakers    index.html      (Laravel SpaController)
#     https://site/api/*       JSON            (Laravel)
#
# That means no API subdomain, no second certificate, and no CORS at all --
# the frontend calls /api/event as a relative path.
#
# SPA_MODE=laravel is that arrangement. SPA_MODE=static is the old one: copy
# the build into the document root and serve it with deploy/spa.htaccess, no
# PHP involved. Static still works and is the right choice if the backend is
# ever retired, but the API cannot be reached from the same domain in it.
SPA_MODE="${SPA_MODE:-laravel}"

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

# Point at a specific Composer when the search below picks the wrong one, or
# finds none:  COMPOSER_BIN=/path/to/composer bash deploy.sh
COMPOSER_BIN="${COMPOSER_BIN:-}"
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
# Matching the path is not enough: /opt/cpanel/ea-nodejs* also matches
# ea-nodejs16, and picking it gets us all the way to Vite's config resolve
# before dying with "crypto.getRandomValues is not a function" -- an error that
# says nothing about the real cause. So ASK each candidate its version and take
# the newest one that Vite actually supports.
NODE_MIN_MAJOR=18
NODE_BIN_DIR="${NODE_BIN_DIR:-}"
if [ -n "$NODE_BIN_DIR" ]; then
    export PATH="$NODE_BIN_DIR:$PATH"
    hash -r
fi
NODE_BIN_DIR=""
NODE_BEST_MAJOR=0
NODE_SEEN=""

for candidate in "$HOME"/.nvm/versions/node/*/bin /opt/cpanel/ea-nodejs*/bin /usr/local/bin /usr/bin; do
    [ -x "$candidate/node" ] || [ -f "$candidate/node" ] || continue
    # cPanel's Fix Permissions tool strips executable bits under $HOME.
    chmod +x "$candidate"/* 2>/dev/null
    [ -x "$candidate/node" ] || continue

    ver=$("$candidate/node" -v 2>/dev/null) || continue
    major=${ver#v}; major=${major%%.*}
    case "$major" in ''|*[!0-9]*) continue ;; esac

    NODE_SEEN="$NODE_SEEN    $ver  $candidate/node
"
    if [ "$major" -ge "$NODE_MIN_MAJOR" ] && [ "$major" -gt "$NODE_BEST_MAJOR" ]; then
        NODE_BEST_MAJOR=$major
        NODE_BIN_DIR="$candidate"
    fi
done

if [ -n "$NODE_BIN_DIR" ]; then
    export PATH="$NODE_BIN_DIR:$PATH"
    hash -r
fi

if ! command -v node >/dev/null 2>&1 || [ "$NODE_BEST_MAJOR" -lt "$NODE_MIN_MAJOR" ]; then
    echo "❌ No Node $NODE_MIN_MAJOR+ found — aborting before anything is touched."
    echo "   Vite 6 needs ^18 || >=20. Anything older fails at config resolve with"
    echo "   \"crypto.getRandomValues is not a function\", which looks unrelated."
    echo ""
    if [ -n "$NODE_SEEN" ]; then
        echo "   Node binaries found on this server:"
        printf "%s" "$NODE_SEEN"
    else
        echo "   No node binary found at all."
    fi
    echo ""
    echo "   Install a supported Node for this account:"
    echo "     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash"
    echo "     . ~/.nvm/nvm.sh && nvm install 20"
    echo "     bash deploy.sh"
    echo ""
    echo "   Or point at one directly:  NODE_BIN_DIR=/path/to/node/bin bash deploy.sh"
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
    echo ""
    # Guessing "memory limit" for every failure sends people to the wrong fix.
    # 137 is the kernel OOM-killing node; anything else usually is not.
    if [ $BUILD_STATUS -eq 137 ] || [ $BUILD_STATUS -eq 134 ]; then
        echo "   Exit $BUILD_STATUS means node was killed — almost always the account"
        echo "   memory limit. Retry with more headroom:"
        echo "     cd $(pwd) && NODE_OPTIONS=--max-old-space-size=2048 npm run build"
    else
        echo "   Read the error above; it is usually a TypeScript or import error."
        echo "   Reproduce it on its own with:"
        echo "     cd $(pwd) && npm run build"
        echo ""
        echo "   If it mentions crypto.getRandomValues, node is too old for Vite —"
        echo "   this script now refuses to build on anything below $NODE_MIN_MAJOR, so that"
        echo "   should not reach here. Running node: $(node -v 2>/dev/null)"
        echo ""
        echo "   If it is out of memory rather than a code error:"
        echo "     NODE_OPTIONS=--max-old-space-size=2048 npm run build"
    fi
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

if [ "$DEPLOY_BACKEND" != "1" ] && [ "$SPA_MODE" = "laravel" ]; then
    # In laravel mode the backend is not optional: it serves the website, not
    # just the API. Publishing the build without it leaves the domain pointing
    # at an application that cannot boot -- a 500 on every page, including the
    # ones that worked before. Refuse instead, and leave the site untouched.
    echo ""
    echo "❌ SPA_MODE=laravel needs the backend, and it is not being deployed."
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        echo "   There is no $BACKEND_DIR/.env on this server. Laravel cannot boot"
        echo "   without one, and in this mode that means the whole site is down."
        echo ""
        echo "   Create it from $BACKEND_DIR/.env.example — APP_KEY, database and"
        echo "   mail settings — then run this again."
    else
        echo "   DEPLOY_BACKEND=$DEPLOY_BACKEND was set explicitly."
    fi
    echo ""
    echo "   To publish the frontend alone, without PHP:"
    echo "     SPA_MODE=static bash deploy.sh"
    echo "   The RSVP form then has no API to post to."
    echo ""
    echo "   Deploy aborted — nothing was changed, the site is untouched."
    exit 1
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

# ── Find Composer ─────────────────────────────────────────────────────────
# cPanel ships one at /opt/cpanel/composer/bin/composer and does NOT put it on
# PATH, so `command -v composer` misses it and this script would go and
# download a second copy for no reason.
#
# The result is a full command rather than a path, because these are not the
# same kind of thing: a .phar has to be handed to PHP, while the cPanel binary
# is a wrapper that already knows which PHP to use.
COMPOSER_CMD=""
for candidate in "$COMPOSER_BIN" "$(command -v composer 2>/dev/null)" \
    /opt/cpanel/composer/bin/composer /usr/local/bin/composer /usr/bin/composer
do
    [ -n "$candidate" ] && [ -x "$candidate" ] || continue
    COMPOSER_CMD="$candidate"
    break
done

if [ -z "$COMPOSER_CMD" ] && [ -f "$HOME/composer.phar" ]; then
    COMPOSER_CMD="$PHP_BIN $HOME/composer.phar"
fi

# ── Install one if the account has none ───────────────────────────────────
if [ -z "$COMPOSER_CMD" ]; then
    echo "  No Composer on this account. Installing one to ~/composer.phar..."

    # allow_url_fopen is off in cPanel's CLI php.ini on many hosts and the
    # installer refuses to run without it -- which is exactly what aborted the
    # deploy that led to this. Passed for this one command rather than added
    # to php.ini: the setting is off for a reason, and turning it on
    # account-wide to fetch a single file is a poor trade.
    INSTALLER=$(mktemp)
    if curl -fsS https://getcomposer.org/installer -o "$INSTALLER" \
        && $PHP_BIN -d allow_url_fopen=1 -d detect_unicode=0 "$INSTALLER" \
            --install-dir="$HOME" --filename=composer.phar
    then
        COMPOSER_CMD="$PHP_BIN $HOME/composer.phar"
    fi
    # Downloaded to a file first rather than piped into PHP: a pipe hands
    # whatever arrived to the interpreter, including a proxy's HTML error
    # page, and the failure then reads as a PHP syntax error.
    rm -f "$INSTALLER"
fi

if [ -z "$COMPOSER_CMD" ]; then
    echo ""
    echo "❌ Composer is not available and could not be installed — deploy aborted."
    echo "   The frontend built fine and the site is untouched; only the API is affected."
    echo ""
    echo "   Look for one already on the server:"
    echo "     ls -l /opt/cpanel/composer/bin/composer"
    echo "   Then point this script at it:"
    echo "     COMPOSER_BIN=/opt/cpanel/composer/bin/composer bash deploy.sh"
    echo ""
    echo "   Or install one by hand, allowing the setting for that command only:"
    echo "     curl -fsS https://getcomposer.org/installer -o /tmp/ci.php"
    echo "     $PHP_BIN -d allow_url_fopen=1 /tmp/ci.php --install-dir=\$HOME --filename=composer.phar"
    exit 1
fi

echo "  Using $COMPOSER_CMD"

# COMPOSER_HOME set explicitly: without it Composer writes its cache under
# whatever HOME happens to be, and under a cPanel cron or hook that can be a
# directory the account cannot write to -- which fails as a permissions error
# that says nothing about a cache.
COMPOSER_HOME="${COMPOSER_HOME:-$HOME/.composer}" \
    $COMPOSER_CMD install --no-dev --optimize-autoloader --no-interaction --prefer-dist
COMPOSER_STATUS=$?

if [ $COMPOSER_STATUS -ne 0 ]; then
    echo ""
    echo "❌ composer install failed (exit $COMPOSER_STATUS) — deploy aborted."
    echo "   The site is still serving the previous build; nothing was changed."
    echo "   Reproduce it on its own with:"
    echo "     cd $(pwd) && $COMPOSER_CMD install --no-dev --optimize-autoloader"
    exit 1
fi

# ── APP_KEY ───────────────────────────────────────────────────────────────
# NOTE: everything from here to the end of the backend stage runs INSIDE
# backend/ -- the composer step cd'd there. So these say `.env` and `artisan`,
# not `$BACKEND_DIR/...`: prefixing them resolved to backend/backend/ and the
# check failed with "No such file or directory" on a server where the file was
# there all along.
# Checked before anything is published, because an empty key deploys a site
# that returns 500 on every page while every step above reports success.
#
# Migrations do not need it, so the deploy sails through them and only the
# first browser request fails -- with "No application encryption key has been
# specified", which arrives after the old site has already been replaced.
# .env.example ships APP_KEY empty, so anyone creating .env the documented way
# lands here exactly once.
if ! grep -qE '^APP_KEY=.+' .env; then
    echo "  🔑 APP_KEY is empty — generating one..."
    if $PHP_BIN artisan key:generate --force; then
        echo "  ✅ APP_KEY set"
    else
        echo ""
        echo "❌ Could not generate APP_KEY — deploy aborted before publishing."
        echo "   Without it Laravel cannot decrypt sessions and every page 500s."
        echo "   Set one by hand:"
        echo "     cd $(pwd) && $PHP_BIN artisan key:generate"
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

# ── Seed the shipped content, once ────────────────────────────────────────
# Speakers, the programme and the event details used to live in config files
# and now live in the database. On a server that has just been migrated those
# tables are empty, so the site would come up with no speakers and no
# timeline until someone typed them all in again.
#
# Guarded on the table being empty, and never a plain `db:seed`. The seeder
# uses updateOrCreate, so running it against a database the organising team
# has since edited would quietly restore every placeholder over their work --
# on every deploy, which is the kind of thing nobody notices for a week.
SPEAKER_COUNT=$($PHP_BIN artisan tinker --execute="echo App\Models\Speaker::count();" 2>/dev/null | tr -dc '0-9')

if [ "${SPEAKER_COUNT:-0}" = "0" ]; then
    echo "🌱 Seeding the shipped content (tables are empty)..."
    $PHP_BIN artisan db:seed --class=ContentSeeder --force \
        && echo "  ✅ Speakers, programme and event details seeded" \
        || echo "  ⚠️ Seeding failed — the site falls back to its bundled copy, but the admin panel will look empty."
else
    echo "🌱 Content already in the database ($SPEAKER_COUNT speakers) — not reseeding."
fi

echo "🧹 Rebuilding caches..."
$PHP_BIN artisan config:clear
$PHP_BIN artisan route:clear
$PHP_BIN artisan view:clear
$PHP_BIN artisan config:cache
$PHP_BIN artisan route:cache
$PHP_BIN artisan view:cache

cd ..
fi

# ── Publish ───────────────────────────────────────────────────────────────
# Copy-then-prune, never wipe-then-copy: if this step dies halfway, the old
# index.html and its assets are still on disk and the site keeps serving.
if [ "$SPA_MODE" = "laravel" ]; then
    PUBLISH_DIR="$BACKEND_DIR/public"
    echo "📤 Publishing SPA into $PUBLISH_DIR (Laravel serves it)..."
else
    PUBLISH_DIR="$SPA_DOC_ROOT"
    echo "📤 Publishing SPA to $SPA_DOC_ROOT (static)..."
    if [ ! -d "$SPA_DOC_ROOT" ]; then
        echo "❌ $SPA_DOC_ROOT does not exist. Create the domain in cPanel first,"
        echo "   or set SPA_DOC_ROOT in $DEPLOY_ENV_FILE."
        exit 1
    fi
fi

mkdir -p "$PUBLISH_DIR/assets"
cp -r "$FRONTEND_DIR/dist/." "$PUBLISH_DIR/" || {
    echo "❌ Could not copy the build into $PUBLISH_DIR — deploy aborted."
    exit 1
}

if [ "$SPA_MODE" = "laravel" ]; then
    # Laravel's own public/.htaccess stays. It already forwards anything that
    # is not a real file to index.php, which is exactly the SPA fallback --
    # copying deploy/spa.htaccess over it would delete the front controller
    # rule and take the API down with it.
    echo "  ✅ Build published; Laravel's public/.htaccess left in place"
else
    cp deploy/spa.htaccess "$PUBLISH_DIR/.htaccess"
    echo "  ✅ SPA published with deploy/spa.htaccess"
fi

# cPanel drops a placeholder index.php into a new document root, and Apache's
# DirectoryIndex prefers .php over .html -- so the site serves "welcome
# <domain>" while index.html sits right beside it, published and unreachable.
# Renamed rather than deleted, and only when it is small enough to be the stub;
# anything larger is somebody's real file and is left alone with a warning.
#
# Skipped in laravel mode: public/index.php there IS Laravel's front
# controller, and moving it aside would break every route on the site.
if [ "$SPA_MODE" != "laravel" ] && [ -f "$PUBLISH_DIR/index.php" ]; then
    PHP_SIZE=$(wc -c < "$PUBLISH_DIR/index.php" 2>/dev/null || echo 0)
    if [ "$PHP_SIZE" -lt 512 ]; then
        mv "$PUBLISH_DIR/index.php" "$PUBLISH_DIR/index.php.disabled-$(date +%Y%m%d%H%M%S)"
        echo "  ↪️ Moved cPanel's placeholder index.php aside — it was shadowing index.html."
    else
        echo "  ⚠️ $PUBLISH_DIR/index.php is ${PHP_SIZE} bytes and was left in place,"
        echo "     but Apache serves it before index.html. Move it if the site looks wrong."
    fi
fi

# Prune superseded hashed assets.
#
# The keep-list is the set of files this build just produced, NOT the files
# named in index.html. index.html names only the entry chunk and the
# stylesheet; every route chunk is imported dynamically from inside the entry
# JS and appears nowhere in the HTML. Scanning the HTML would keep two files
# and delete the rest, and every lazy route would 404 into the SPA catch-all,
# come back as text/html, and be refused as a module script — a blank page.
echo "🗑️ Pruning superseded assets (keeping the last ${PRUNE_KEEP_DAYS} days)..."
if [ -d "$PUBLISH_DIR/assets" ] && [ -d "$FRONTEND_DIR/dist/assets" ]; then
    KEEP=" $(cd "$FRONTEND_DIR/dist/assets" && ls -1 2>/dev/null | tr '
' ' ')"
    if [ -z "${KEEP// }" ]; then
        echo "  ⚠️ This build produced no assets — skipping prune rather than emptying the directory."
    else
        KEPT=0; REMOVED=0
        for f in "$PUBLISH_DIR"/assets/*; do
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

# ── Point the document root at Laravel's public/ ──────────────────────────
# A symlink, so Laravel's own public/.htaccess and index.php stay canonical in
# git rather than being copied and drifting -- and so the application itself
# stays OUTSIDE the document root. That is not tidiness: with the app inside
# it, backend/.env (database password, mail password, admin token) and .git
# are both downloadable by anyone who guesses the URL.
if [ "$SPA_MODE" = "laravel" ]; then
    echo "🔗 Pointing $SPA_DOC_ROOT at $BACKEND_DIR/public..."
    DOCROOT_TARGET="$(pwd)/$BACKEND_DIR/public"

    if [ -L "$SPA_DOC_ROOT" ]; then
        CURRENT=$(readlink "$SPA_DOC_ROOT")
        if [ "$CURRENT" = "$DOCROOT_TARGET" ]; then
            echo "  ✅ Already linked"
        else
            rm -f "$SPA_DOC_ROOT"
            ln -s "$DOCROOT_TARGET" "$SPA_DOC_ROOT" && echo "  ✅ Re-linked from $CURRENT"
        fi
    elif [ -d "$SPA_DOC_ROOT" ]; then
        # A real directory: either cPanel's freshly created docroot, or the
        # previous static deploy. Moved aside, never deleted -- if anything in
        # there was hand-placed, the account owner still has it.
        BACKUP="$SPA_DOC_ROOT.replaced-$(date +%Y%m%d%H%M%S)"
        if mv "$SPA_DOC_ROOT" "$BACKUP" && ln -s "$DOCROOT_TARGET" "$SPA_DOC_ROOT"; then
            echo "  ✅ $SPA_DOC_ROOT → $DOCROOT_TARGET"
            echo "     Previous contents kept at $BACKUP"
        else
            echo "❌ Could not replace $SPA_DOC_ROOT with a symlink."
            echo "   Set the domain's document root to $DOCROOT_TARGET in cPanel instead."
            exit 1
        fi
    else
        ln -s "$DOCROOT_TARGET" "$SPA_DOC_ROOT" && echo "  ✅ $SPA_DOC_ROOT → $DOCROOT_TARGET"
    fi
fi

rm -f /tmp/.sn-backend-env.backup

echo ""
echo "✅ Deployment completed!"
echo "🌐 Branch: $BRANCH"
echo ""
# ── Errors from THIS deploy ───────────────────────────────────────────────
# Previously a plain `tail -20` of laravel.log, which printed whatever was in
# the file. A stack trace from an error fixed an hour ago was the last thing
# on screen after a clean deploy, so a successful run looked like a failed one
# -- and the actual outcome was buried above it.
#
# Laravel writes "[2026-09-10 06:54:54] production.ERROR: ...", so entries can
# be compared as text against the timestamp recorded at the start of this run.
LOG_FILE="$BACKEND_DIR/storage/logs/laravel.log"

if [ ! -f "$LOG_FILE" ]; then
    echo "📜 No Laravel log yet — nothing has errored."
else
    NEW_ERRORS=$(awk -v since="$DEPLOY_STARTED" '
        /^\[[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}\]/ {
            stamp = substr($0, 2, 19)
            recent = (stamp >= since)
        }
        recent
    ' "$LOG_FILE" | head -40)

    if [ -n "$NEW_ERRORS" ]; then
        echo "📜 Laravel errors logged during this deploy:"
        printf '%s\n' "$NEW_ERRORS"
    else
        LAST=$(grep -oE '^\[[0-9-]{10} [0-9:]{8}\]' "$LOG_FILE" | tail -1 | tr -d '[]')
        if [ -n "$LAST" ]; then
            echo "📜 No new errors. The log's most recent entry is from $LAST, before this deploy."
        else
            echo "📜 No new errors."
        fi
    fi
fi
