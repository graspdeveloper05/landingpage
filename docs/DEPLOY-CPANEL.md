# Deploying to cPanel — serinegaradialogue.org

Host: cPanel at `124.217.226.229`, user `serinegaradialog`, home
`/home/serinegaradialog`.

## Why there is no folder named after the domain

cPanel only creates a named folder for **addon** and **subdomains**. The
**primary** domain is served straight from `public_html`. So for
`serinegaradialogue.org`, `public_html` *is* the site root — don't create a
`serinegaradialogue.org` folder inside it, or the site ends up at
`serinegaradialogue.org/serinegaradialogue.org/`.

## Target layout

One domain serves everything. `public_html` is a **symlink** into the Laravel
application, which itself stays outside any document root.

```
/home/serinegaradialog/
├── public_html  ──▶ landingpage/backend/public      (a symlink, not a folder)
│
└── landingpage/                    ← the git checkout, NOT web-reachable
    ├── frontend/                   React source; dist/ is built here
    ├── deploy.sh
    └── backend/                    ← Laravel
        ├── app/  config/  routes/  vendor/  storage/  database/
        ├── .env                    ← DB password, mail password, admin token
        └── public/                 ← THE ONLY web-reachable directory
            ├── index.php           Laravel front controller
            ├── index.html          the React build   ┐ copied here
            ├── assets/             hashed chunks     │ by deploy.sh
            └── hero/ scenes/ brand/ portraits/       ┘
```

Nothing above `backend/public` can be requested over the web. That is what
keeps `.env` and `.git` from being downloadable.

## 1 — Frontend

Automatic deployment is **not available on this hosting plan**, so there is no
`.cpanel.yml`. Use one of the two routes below.

### Route A — build locally, upload the result (no server tooling needed)

```bash
cd frontend
npm ci
npm run build
```

Upload the **contents of `dist/`** into `public_html` — not the `dist` folder
itself. Via File Manager: select all inside `dist`, compress to a zip, upload,
Extract into `public_html`, delete the zip.

This is the reliable route. It needs nothing installed on the server, and the
build happens on a machine you control.

### Route B — pull in cPanel, build over SSH

Works only if the plan gives you Terminal or SSH access **and** Node.js.

1. cPanel → **Git Version Control** → *Create* with:
   - Clone URL `https://github.com/graspdeveloper05/landingpage.git`
   - Repository Path `landingpage` (i.e. `/home/serinegaradialog/landingpage`)
2. To take a later change: **Manage** → *Pull or Deploy* → **Update from Remote**
3. Then, in Terminal:

```bash
cd ~/landingpage
bash deploy.sh
```

`deploy.sh` builds the frontend and copies `dist/` into `public_html`. It
resolves its own directory, so the clone can sit anywhere outside the web root.

If Node is missing, cPanel → *Setup Node.js App* can provide it — or fall back
to Route A.

### Either way, afterwards



- **Delete the default `index.php`** (the 30-byte cPanel placeholder). Apache
  prefers `index.php` over `index.html`, so the site shows a blank page while
  it is there.
- **Confirm `.htaccess` uploaded.** File Manager hides dotfiles by default —
  Settings → *Show Hidden Files*. Without it, `/about`, `/speakers`,
  `/programme` and `/rsvp` return 404 on refresh or on a shared link, because
  Apache looks for real directories with those names. This is the single most
  likely thing to go wrong.

## 2 — SSL, before anything is announced

The certificate is currently **self-signed**, and cPanel is already warning
that the domain is at risk. Every visitor gets a full-page browser warning, and
§12 of the brief requires SSL/HTTPS.

cPanel → **SSL/TLS Status** → tick the domain → **Run AutoSSL**. It issues a
free Let's Encrypt certificate, usually within a few minutes.

Once it is valid and `https://serinegaradialogue.org` loads clean, force HTTPS.
Doing it before the certificate is valid sends everyone into the warning.

In the default `SPA_MODE=laravel` the served `.htaccess` is Laravel's own
(`backend/public/.htaccess`), which is tracked in git — so use cPanel's
**Domains → Force HTTPS Redirect** toggle rather than editing it, and the
setting survives every deploy. `deploy/spa.htaccess`, with its commented-out
HTTPS block, is only used in `SPA_MODE=static`.

## 3 — Backend

The Laravel app must **not** sit in `public_html`. Everything above `public/` —
`.env`, the database credentials, the whole application — would be
downloadable over the web.

No subdomain is needed: one domain serves the site and the API, and
`deploy.sh` points `public_html` at `backend/public` for you. See §4.

1. Nothing to create in cPanel — `deploy.sh` handles the document root.
2. The backend arrives with the git checkout; there is nothing to upload.
3. cPanel → **MultiPHP Manager** → set that domain to **PHP 8.2 or newer**.
   Laravel 12 will not boot on anything older.
4. **Create `.env`.** `deploy.sh` runs composer, migrations, the caches and
   the permissions itself, so the only thing it cannot do for you is write
   the file that holds your credentials:

```bash
cd ~/landingpage/backend
cp .env.example .env
/opt/cpanel/ea-php82/root/usr/bin/php artisan key:generate
```

   Fill in the database and mail settings below, then run `bash deploy.sh`
   from the repo root. It backs this file up and restores it around every git
   reset, so it survives deploys.

5. **Database.** cPanel → *MySQL Databases* → create a database and user, grant
   all privileges, then in `.env`:

```
DB_CONNECTION=mysql
DB_DATABASE=serinegaradialog_snd
DB_USERNAME=serinegaradialog_snd
DB_PASSWORD=...
```

   SQLite works, but MySQL is what cPanel's automated backups cover (§12).

6. **Email.** cPanel → *Email Accounts* → create `no-reply@serinegaradialogue.org`,
   then:

```
MAIL_MAILER=smtp
MAIL_HOST=mail.serinegaradialogue.org
MAIL_PORT=465
MAIL_ENCRYPTION=ssl
MAIL_USERNAME=no-reply@serinegaradialogue.org
MAIL_PASSWORD=...
MAIL_FROM_ADDRESS="no-reply@serinegaradialogue.org"
```

   Then set up SPF and DKIM under *Email Deliverability*, or confirmations will
   land in spam — which for a 200-seat event means people turning up without a
   reference, or not turning up at all.

7. **Admin token** for the participant export:

```bash
php artisan dialogue:token     # paste the result into .env
php artisan config:clear
```

8. No separate certificate is needed — the API is on the same domain, so
   the site's own AutoSSL certificate covers it (§2).

## 4 — One domain, front and back

The site and the API share a single domain. There is **no API subdomain**.

```
public_html  ──symlink──▶  landingpage/backend/public
                              ├── index.php      Laravel front controller
                              ├── index.html     the React build
                              └── assets/…       hashed chunks
```

| Request | Served by |
|---|---|
| `/` and `/assets/*` | Apache, straight off disk |
| `/speakers`, `/rsvp`, any client route | Laravel → `SpaController` → `index.html` |
| `/api/*` | Laravel |

Because it is one origin, the frontend calls `/api/event` as a **relative
path**. `frontend/.env.production` holds `VITE_API_BASE_URL=/`. So there is no
CORS to configure, no second certificate, and no subdomain to create.

Verified end to end on 10 September 2026 against the real Laravel app: `/` and
`/speakers` both returned the SPA, `/api/event` returned JSON, `/api/nope`
returned a JSON 404 rather than the website, and a registration submitted in
the browser stored a row and returned `SND26-0001`.

### What `deploy.sh` does

`SPA_MODE=laravel` is the default. In one run:

1. Builds the frontend into `frontend/dist`
2. Runs composer, migrations and the Laravel caches
3. Copies `dist/` **into `backend/public/`**
4. Replaces `public_html` with a **symlink** to `backend/public`

Step 4 moves an existing `public_html` directory aside to
`public_html.replaced-<timestamp>` rather than deleting it.

Laravel's own `public/.htaccess` is left in place. It already forwards
anything that is not a real file to `index.php`, which is exactly the SPA
fallback — `deploy/spa.htaccess` is **not** copied over it in this mode, since
that would delete the front controller rule and take the API down.

### Server setup, once

1. **`backend/.env`** — create it from `.env.example` (see §3 for database,
   mail and token settings). In this mode Laravel serves the website, so
   without it the whole site is down, not just the API. `deploy.sh` refuses to
   deploy rather than publishing a build behind an application that cannot
   boot.

2. **`~/seri-negara-deploy.env`**:

```bash
SPA_DOC_ROOT="$HOME/public_html"
```

3. **PHP 8.2** for the domain in MultiPHP Manager.

4. **`bash deploy.sh`** — both halves, one command.

5. **Check it:**

```bash
curl -I https://serinegaradialogue.org/speakers      # 200, text/html
curl https://serinegaradialogue.org/api/event        # JSON
```

   Then submit one real registration through the live form and confirm it
   appears in the export and that the confirmation email arrives.

### Why the app sits outside the document root

Only `backend/public` is reachable from the web. The application itself —
`backend/.env` with the database password, mail password and admin token, and
`.git` with the whole history — stays above it. Put the app inside
`public_html` and both are downloadable by anyone who guesses the URL.

### If you ever want the frontend without PHP

```bash
SPA_MODE=static bash deploy.sh
```

Copies the build into `public_html` with `deploy/spa.htaccess` and skips
Laravel entirely. The RSVP form then has no API to post to.

## Checklist

- [ ] `SPA_DOC_ROOT` set in `~/seri-negara-deploy.env`
- [ ] `public_html` is a **symlink** to `backend/public` (`ls -l ~/public_html`)
- [ ] Laravel app itself outside the document root
- [ ] `/speakers` survives a refresh — proves the SPA fallback works
- [ ] `/api/nope` returns JSON 404, not the website
- [ ] AutoSSL run; HTTPS redirect uncommented afterwards
- [ ] PHP 8.2+ selected for the domain
- [ ] MySQL database created, migrations run
- [ ] SMTP configured, SPF/DKIM set, a test confirmation received
- [ ] **Default admin password changed.** The panel ships with
      `admin@serineg.com` / `admin@123` so a fresh deploy can be signed into,
      and that pair is in the repository. It opens 200 attendees' names,
      emails and mobile numbers. Replace it before the site is announced:
      `php artisan dialogue:admin <real address>` — or set `ADMIN_PASSWORD`
      in `backend/.env` before the first deploy, and the default is never used
- [ ] `ADMIN_API_TOKEN` set; export tested with `Authorization: Bearer`
- [ ] `curl https://serinegaradialogue.org/api/event` returns JSON
- [ ] One real registration submitted through the live form and found in the export
- [ ] `APP_ENV=production`, `APP_DEBUG=false`
- [ ] Placeholder content replaced — `npm run check:placeholders` must pass
