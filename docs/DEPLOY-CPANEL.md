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

```
/home/serinegaradialog/
├── public_html/              ← serinegaradialogue.org  (FRONTEND)
│   ├── index.html
│   ├── .htaccess
│   ├── assets/
│   ├── hero/  portraits/  scenes/
│   ├── crest-gold.svg  crest-navy.svg  favicon.svg  og-image.svg
│   └── robots.txt  sitemap.xml
│
└── api/                      ← BACKEND, deliberately OUTSIDE public_html
    ├── app/  config/  routes/  vendor/  storage/  database/
    ├── .env                  ← never web-reachable from here
    └── public/               ← docroot for api.serinegaradialogue.org
```

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

Once it is valid and `https://serinegaradialogue.org` loads clean, uncomment
the two `RewriteCond`/`RewriteRule` HTTPS lines at the top of `.htaccess`.
Doing it before the certificate is valid sends everyone into the warning.

## 3 — Backend

The Laravel app must **not** sit in `public_html`. Everything above `public/` —
`.env`, the database credentials, the whole application — would be
downloadable over the web.

1. cPanel → **Domains** → *Create A New Domain* → `api.serinegaradialogue.org`,
   and untick "share document root". Set the document root to
   `/home/serinegaradialog/api/public`.
2. Upload the backend to `/home/serinegaradialog/api/` (everything except
   `vendor/`, `node_modules/`, `.env`, `database/*.sqlite`).
3. cPanel → **MultiPHP Manager** → set that domain to **PHP 8.2 or newer**.
   Laravel 12 will not boot on anything older.
4. Terminal (or SSH):

```bash
cd ~/api
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
php artisan migrate --force
php artisan config:cache && php artisan route:cache
chmod -R 775 storage bootstrap/cache
```

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

8. Run AutoSSL for the API subdomain too.

## 4 — Connecting the two

**Done in the code.** `frontend/.env.production` holds
`VITE_API_BASE_URL=https://api.serinegaradialogue.org`, so every
`npm run build` — and therefore every `deploy.sh` run — produces a bundle that
talks to the API. `backend/config/cors.php` already allows the site's origin.

Verified end to end on 10 September 2026 against the real Laravel app: a
browser form submission stored a row and returned `SND26-0001`, a duplicate
email came back 422 and surfaced inline on the email field, and the CSV export
returned the row.

What is left is server-side only. Until these steps are done the live form
posts to a hostname that does not resolve, so **do not deploy the frontend
before the API answers**:

1. **Create the subdomain.** cPanel → *Domains* → Create A Domain →
   `api.serinegaradialogue.org`, document root `~/api` — cPanel will offer
   `public_html/api`, which is wrong; type the path yourself.

2. **Point it at Laravel's front controller, not the app.** `deploy.sh` does
   this for you once you tell it where:

```bash
# ~/seri-negara-deploy.env  (outside git, per-server)
SPA_DOC_ROOT="$HOME/public_html"
API_DOC_ROOT="$HOME/api"
```

   It replaces `~/api` with a symlink to `backend/public`. The Laravel app
   itself stays in `~/landingpage/backend`, outside any document root — which
   is the whole point. If `.env` and `.git` sit under a document root they are
   downloadable by anyone who guesses the URL, and that `.env` holds the
   database password, the mail password and the admin token.

3. **Set PHP 8.2** for the subdomain in MultiPHP Manager.

4. **Create `backend/.env`** on the server from `.env.example` — see §3 above
   for the database, mail and token settings. `deploy.sh` backs this file up
   and restores it around every git reset, so it survives deploys.

5. **Run the backend stage.** It turns itself on as soon as `backend/.env`
   exists; force it with `DEPLOY_BACKEND=1 bash deploy.sh`. It runs composer,
   migrations and the config/route caches.

6. **Run AutoSSL** for the subdomain. The frontend calls `https://`, so
   without a certificate every request fails in the browser with a TLS error
   and no useful message.

7. **Prove it before trusting it:**

```bash
curl https://api.serinegaradialogue.org/api/event
curl -H "Authorization: Bearer $ADMIN_API_TOKEN"      https://api.serinegaradialogue.org/api/admin/registrations
```

   Then submit one real registration through the live form and confirm it
   appears in the export and that the confirmation email arrives.

Until step 7 passes, the RSVP form is not collecting anything.

## Checklist

- [ ] `dist/` **contents** in `public_html`, not the folder
- [ ] Default `index.php` deleted
- [ ] `.htaccess` present (check hidden files) — test by refreshing `/speakers`
- [ ] AutoSSL run; HTTPS redirect uncommented afterwards
- [ ] `api.serinegaradialogue.org` created, docroot `~/api`
- [ ] Laravel app outside `public_html`; `~/api` symlinked to `backend/public`
- [ ] `API_DOC_ROOT` set in `~/seri-negara-deploy.env`
- [ ] PHP 8.2+ selected for the API domain
- [ ] MySQL database created, migrations run
- [ ] SMTP configured, SPF/DKIM set, a test confirmation received
- [ ] `ADMIN_API_TOKEN` set; export tested with `Authorization: Bearer`
- [ ] `curl https://api.serinegaradialogue.org/api/event` answers before the frontend is deployed
- [ ] One real registration submitted through the live form and found in the export
- [ ] `APP_ENV=production`, `APP_DEBUG=false`
- [ ] Placeholder content replaced — `npm run check:placeholders` must pass
