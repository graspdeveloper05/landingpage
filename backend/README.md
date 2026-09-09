# Seri Negara Dialogue — API

Laravel backend for the Seri Negara Dialogue 2026 website.

**This is not connected to the frontend.** The frontend still runs entirely on
local data and `localStorage`. Wiring it up is one environment variable — see
_Connecting the frontend_ at the bottom — but nothing has been switched over.

## Running it

```bash
composer install
cp .env.example .env          # if .env is missing
php artisan key:generate
php artisan migrate
php artisan serve --port=8001
```

SQLite by default (`database/database.sqlite`), so nothing else needs
installing. For MySQL in production, set `DB_CONNECTION=mysql` and the usual
credentials.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/event` | — | Date, venue, capacity, seats taken |
| `GET` | `/api/speakers` | — | Speakers and moderator (§7) |
| `GET` | `/api/programme` | — | Timeline (§8) |
| `POST` | `/api/registrations` | — | Register (§9) |
| `GET` | `/api/admin/registrations` | Bearer | CSV export (§9, §12) |

### POST /api/registrations

```json
{
  "fullName": "...", "email": "...", "mobile": "...",
  "organisation": "...", "designation": "...",
  "dietary": "", "pdpaAccepted": true
}
```

| Status | Meaning |
|---|---|
| `201` | Created — returns `reference`, e.g. `SND26-0001` |
| `422` | Validation failed, or the email is already registered |
| `409` | Capacity reached |
| `429` | Rate limited (6 per minute per IP) |

### GET /api/admin/registrations

```bash
php artisan dialogue:token          # generates ADMIN_API_TOKEN
curl -H "Authorization: Bearer $TOKEN" \
     http://127.0.0.1:8001/api/admin/registrations -o registrations.csv
```

## Things worth knowing

**Capacity is enforced atomically.** The count and the insert happen in one
transaction with `lockForUpdate()`. Counting outside a transaction lets two
simultaneous requests both read 199 and both insert — which for a 200-seat room
is a real problem, not a theoretical one. Verified: with capacity set to 3, the
fourth, fifth and sixth attempts all returned `409` and the table held exactly 3.

**One seat per email per edition**, enforced by a unique index as well as
validation, so a race cannot slip a duplicate through.

**A failed confirmation email does not fail the registration.** The seat is
already booked; the mail error is logged and the attendee still gets their
reference on screen.

**CSV export is streamed and chunked**, carries a UTF-8 BOM so Excel renders
Chinese and Tamil correctly, and prefixes any field starting `= + - @` with an
apostrophe so attendee input cannot execute as a spreadsheet formula.

**The admin token is a shared bearer token** — proportionate for one event and
a handful of organisers. If the Dialogue runs annually with changing staff,
replace it with real accounts so access can be revoked per person.

## Before production

- [ ] `MAIL_MAILER` is `log` for development — point it at a real SMTP service
- [ ] Set `APP_ENV=production`, `APP_DEBUG=false`, and a real `APP_URL`
- [ ] Set `ADMIN_API_TOKEN` (`php artisan dialogue:token`)
- [ ] Move to MySQL or Postgres if you want managed backups (§12)
- [ ] Add CORS for the site's origin — `config/cors.php`, `allowed_origins`
- [ ] Replace the placeholder speakers in `config/speakers.php`
- [ ] Confirm the retention period for `ip_address` / `user_agent` against the
      privacy notice; they exist for abuse investigation only
- [ ] Queue the confirmation mail (`QUEUE_CONNECTION=database`) so a slow SMTP
      server does not hold the request open

## Connecting the frontend

Not done, deliberately. When you want it:

```bash
# in the frontend .env
VITE_API_BASE_URL=http://127.0.0.1:8001
```

`src/services/api.ts` is the only file that reads it. Everything above it
already handles `201`, `409` and `422`. You will also need CORS configured for
the frontend origin.
