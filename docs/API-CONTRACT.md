# API contract — what the Laravel backend must implement

The React app talks to exactly one module: `src/services/api.ts`. Set
`VITE_API_BASE_URL` and it switches from local data to these endpoints. No
component changes are required.

```
VITE_API_BASE_URL=/
```

`/` means **same origin**. The React build is published into
`backend/public`, the document root points there, and Laravel serves both the
site and `/api/*` from one domain — so the requests go out as relative paths
and there is no CORS, no subdomain and no second certificate. An absolute
origin also works if the API is ever split onto its own host.

This is committed in `frontend/.env.production`, so `npm run build` — and
therefore `deploy.sh` — always produces a bundle pointed at the API.
`npm run dev` has no `.env`, so local development keeps running against the
data files without needing PHP.

**Connected as of 10 September 2026.** Verified end to end against the real
Laravel app, serving the site and the API from one origin: `/` and `/speakers`
returned the SPA, `/api/event` returned JSON, `/api/nope` returned a JSON 404
rather than the website, a browser form submission stored a row and returned
`SND26-0001`, a duplicate email came back 422 and appeared inline on the email
field, and the CSV export returned the row.

## Routing

Laravel owns every URL that is not a file on disk:

| Path | Handler |
|---|---|
| `/api/*` | `routes/api.php` |
| unknown `/api/*` | JSON `404` — never the website |
| everything else | `SpaController` returns `public/index.html` |

The web catch-all excludes `api` explicitly. Fallback routes register last
whatever file they live in, so a catch-all matching `.*` would otherwise claim
`/api/anything` before the API's own fallback saw it, and a mistyped endpoint
would answer `200` with HTML.

## What stays local on purpose

`getSpeakers()` and `getProgramme()` do **not** call the API even when it is
connected. Speakers and the programme are content the organising team edits in
`src/data/editions/2026/` (see HANDOVER.md); routing them through Laravel would
create a second source of truth to keep in step by hand, and would blank the
grid and timeline whenever the API is down. Both endpoints exist and are
documented below, so this is one commit to reverse if the team ever wants to
edit speakers from the server.

## Origins

Same origin, so CORS does not apply to the live site at all.
`backend/config/cors.php` is kept for the case where a build is pointed at
this API from somewhere else — a staging host, or a local `npm run dev`. It
allows the two production hostnames and nothing else; Laravel's default of
`*` is wrong here, because `/api/admin/registrations` returns every attendee's
name, email and mobile. Add origins with `CORS_ALLOWED_ORIGINS` in
`backend/.env`.

## GET /api/event

```json
{
  "edition": 2026,
  "date": "2026-10-08",
  "startTime": "14:30",
  "venue": "Muzium Negara",
  "venueAddress": "Jalan Damansara, 50566 Kuala Lumpur, Malaysia",
  "mapsUrl": "https://maps.google.com/?q=Muzium+Negara+Kuala+Lumpur",
  "mapEmbedUrl": "https://www.google.com/maps?q=...&output=embed",
  "capacity": 200,
  "registered": 37
}
```

The client derives `remaining` and `isFull` from `capacity` and `registered`.

## GET /api/speakers

An array of `Speaker` (see `src/data/types.ts`). `designation` and `bio` are
objects keyed by locale — `{ "en": "...", "ms": "...", "zh": "...", "ta": "..." }`.
`role` is `"speaker"` or `"moderator"`.

## GET /api/programme

An array of `ProgrammeItem`. `time` is 24-hour `"HH:MM"`; the client formats it
for the visitor's locale. `title` and `detail` are locale-keyed.

## POST /api/registrations

Request body:

```json
{
  "fullName": "...",
  "email": "...",
  "mobile": "...",
  "organisation": "...",
  "designation": "...",
  "dietary": "",
  "pdpaAccepted": true
}
```

Responses the client already handles:

| Status | Meaning | Client behaviour |
|---|---|---|
| `201` | Created — returns the full record including `reference` and `submittedAt` | Shows the confirmation panel |
| `422` | Validation failed | Shows the generic error above the form |
| `409` | Capacity reached | Switches to the "registration is closed" state |
| other | Network or server error | Shows the generic error |

`reference` should stay short and readable aloud at the door. The local
implementation uses `SND26-0001`.

Server-side work still needed beyond these endpoints:
- Enforce capacity atomically, so two simultaneous submissions cannot exceed 200.
- Send the confirmation email (§9 "automated confirmation").
- Rate-limit and spam-protect the endpoint (§12).

## GET /api/admin/registrations

Returns `text/csv` with the columns
`reference, submittedAt, fullName, email, mobile, organisation, designation, dietary`.
Escapes leading `= + - @` in user-entered fields to prevent spreadsheet formula
injection, and opens with a UTF-8 BOM so Excel reads Malay, Chinese and Tamil
names correctly.

Authenticated with a **bearer token**, compared in constant time against
`ADMIN_API_TOKEN`:

```bash
curl -H "Authorization: Bearer $ADMIN_API_TOKEN"      -H "Accept: text/csv"      https://serinegaradialogue.org/api/admin/registrations      -o registrations.csv
```

Run it from a terminal, not from the site. The token is deliberately absent
from the frontend: every `VITE_` variable is compiled into public JavaScript,
so shipping it would publish the attendee list to anyone who opens devtools.
`exportRegistrations()` therefore returns 401 against the live API by design.
