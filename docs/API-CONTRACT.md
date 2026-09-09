# API contract — what the Laravel backend must implement

The React app talks to exactly one module: `src/services/api.ts`. Set
`VITE_API_BASE_URL` and it switches from local data to these endpoints. No
component changes are required.

```
VITE_API_BASE_URL=https://api.serinegaradialogue.org
```

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
Must be behind authentication. Escape leading `= + - @` in user-entered fields
to prevent spreadsheet formula injection — `toCsv()` in `api.ts` shows the rule.
