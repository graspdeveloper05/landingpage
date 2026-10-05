# Survey — design

Date: 2026-10-05 · Status: awaiting review

## Purpose

The client asked for survey questions during the conference (Slido-style) and,
later, a post-event survey. This spec covers the survey feature both will use.
Built into the existing site instead of using Slido. Mailgun is on hold, so
nothing here sends email.

## Scope

In: admin manages surveys and questions; attendees answer at `/survey` after
identifying with their registered email or mobile; admin sees results live
and exports them.

Out (later): anonymous / open-to-anyone surveys, Q&A and upvoting, word
clouds, big-screen display, QR check-in (separate feature).

## Data

### `surveys`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| title | json | `{en, ms, ta, zh}`; `en` required |
| description | json, nullable | same shape |
| status | string(10), default `draft` | `draft` / `open` / `closed` |
| timestamps | | |

### `survey_questions`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| survey_id | FK → surveys, cascade | |
| type | string(10) | `choice` / `rating` / `text` |
| question | json | `{en, ms, ta, zh}`; `en` required |
| options | json, nullable | `choice` only: list of `{en, ms, ta, zh}`, min 2 |
| status | string(10), default `draft` | `draft` / `open` / `closed` |
| display_order | unsigned int | |
| closed_at | timestamp, nullable | set when status becomes `closed` |
| timestamps | | |

### `survey_responses`
| Column | Type | Notes |
|---|---|---|
| id | bigint PK | |
| survey_question_id | FK → survey_questions, cascade | |
| registration_id | FK → registrations, cascade | |
| answer | text | `choice`: option index as string; `rating`: `1`–`5`; `text`: ≤1000 chars |
| timestamps | | |

Unique `(survey_question_id, registration_id)`.

Empty `ms`/`ta`/`zh` fall back to `en` on the public page.

## Behaviour

- A question is answerable only when it **and** its survey are `open`.
- The admin may open one question at a time (live, Slido-style) or several
  at once (form-style). The public page shows every open question of every
  open survey, in `display_order`. No extra display-mode setting.
- One answer per registration per question; a second submit is rejected
  (409), not overwritten.
- Closing a question keeps its responses. Editing a question's options or type
  is blocked once it has responses (prevents re-meaning old answers);
  wording/translation edits stay allowed.

## Identification (public)

- `POST /api/survey/identify` with `{ contact }` — an email or a mobile.
  - Email: case-insensitive match on `registrations.email`.
  - Mobile: digits-only compare, `+60…` and `0…` treated as equal.
  - No match → 422 "User not found." (translated on the page).
  - Match → `{ token, firstName }`. Token = encrypted registration id
    (Laravel `Crypt`), kept in the phone's localStorage. Never returns
    email/mobile.
- Throttled per IP at a level that tolerates shared venue Wi-Fi
  (e.g. 30/min identify, 120/min answers), unlike the 6/min registration limit.

## Public API

- `GET /api/survey` — open surveys with their open questions (no counts).
  With a token header, each question includes whether this person answered.
- `POST /api/survey/questions/{id}/answer` — `{ token, answer }`. Validates
  the token, open status, and the answer against the type.

## Admin API (`auth:sanctum`, `/api/admin`)

- `GET/POST /surveys`, `PUT/DELETE /surveys/{survey}`
- `POST /surveys/{survey}/questions`, `PUT/DELETE /survey-questions/{q}`,
  `POST /surveys/{survey}/questions/reorder`
- `GET /surveys/{survey}/results` — per question: counts per option / per
  star with average, or text answers with name + reference.
- `GET /surveys/{survey}/export` — CSV: reference, name, question, answer
  (option label in English), answered at. Formula-injection guarded like the
  registrations export.

## Admin UI

New "Survey" item in `Shell.tsx` NAV, route `survey` in `AdminApp.tsx`.

- List of surveys: title, status, question count, response count; create.
- Survey detail: edit title/description (4-language tabs, like Programme);
  survey Open/Close; questions list with type, status chip, Open/Close button,
  edit, delete, reorder; results panel (bars / average / text list) that
  refreshes every 5 s while the survey is open; CSV download; QR code and
  link for `/survey` to project on screen.

## Public page `/survey`

- No token: email-or-mobile field → identify → "Welcome, {firstName}".
- Shows open questions; answered ones show "Thank you". Polls `GET /api/survey`
  every 10 s so newly opened questions appear.
- Nothing open: "Please wait for the next question."
- All strings in the 4 locale files.
- Notice under the form: "Your responses are linked to your registration."

## Dependencies

- A small QR library for the admin panel (e.g. `qrcode` npm package).

## Testing

PHPUnit feature tests (in-memory sqlite, existing pattern):
identify by email / mobile variants / not found; answer accepted for each type;
invalid answer per type rejected; duplicate rejected; closed question or
closed survey rejected; bad token rejected; admin CRUD requires auth; results
counts correct; export columns. Frontend: `npm run typecheck` and `npm run build`,
then a manual pass in the browser locally.
