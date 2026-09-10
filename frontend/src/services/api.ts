import { event, programme, speakers } from '@/data'
import type {
  EventDetails,
  ProgrammeItem,
  Registration,
  RegistrationRecord,
  Speaker,
} from '@/data/types'

/**
 * The only file that knows where data comes from.
 *
 * Right now everything is served from local data files, and registrations are
 * held in localStorage so the form genuinely works in the static build. When
 * the Laravel API is ready, set VITE_API_BASE_URL and the remote branches take
 * over — no component changes. See docs/API-CONTRACT.md for the endpoints.
 */

/*
 * Where the API lives.
 *
 * "/" means same origin -- Laravel serves both the built SPA and /api/* from
 * one domain, so the requests are plain relative paths and there is no CORS.
 * An absolute origin is also accepted, for the case where the API is ever
 * split onto its own host.
 *
 * The two constants exist separately because same origin resolves to an empty
 * base, and an empty string is falsy: a single `if (BASE)` check would read
 * "same origin" as "not configured" and quietly fall back to localStorage --
 * the form would look like it worked while nothing was ever sent.
 */
const RAW = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim()
const USE_API = RAW !== undefined && RAW !== ''
// Trailing slashes are stripped so `https://host/` and `https://host` both
// produce `https://host/api/event` rather than a double slash, which some
// hosts answer with a redirect that drops the POST body. "/" strips to "",
// which is exactly the relative-path base same origin needs.
const BASE = USE_API ? RAW!.replace(/\/+$/, '') : ''

/**
 * Re-exported for the admin panel, which talks to the same host. Sharing the
 * constants rather than re-reading the env var keeps one answer to "where is
 * the API" -- two copies drift the moment one of them gains a trailing-slash
 * fix the other does not.
 */
export const API_BASE = BASE
export const API_CONFIGURED = USE_API
const STORAGE_KEY = 'snd.registrations'

export class RegistrationError extends Error {
  constructor(
    message: string,
    readonly kind: 'validation' | 'full' | 'network',
    /**
     * Per-field messages from the server, keyed by the field name the form
     * uses. Laravel returns these on 422 and some of them cannot be derived
     * client-side at all -- "this email is already registered" is the one that
     * matters, since the API allows one seat per address per edition.
     */
    readonly fields?: Record<string, string>,
  ) {
    super(message)
    this.name = 'RegistrationError'
  }
}

/** Laravel's 422 body: { message, errors: { field: [msg, ...] } }. */
async function readValidationErrors(res: Response): Promise<Record<string, string>> {
  try {
    const body = (await res.json()) as { errors?: Record<string, string[]> }
    return Object.fromEntries(
      Object.entries(body.errors ?? {}).map(([field, messages]) => [field, messages[0]]),
    )
  } catch {
    return {}
  }
}

/* -------------------------------------------------------------------------- */
/* Local store                                                                */
/* -------------------------------------------------------------------------- */

function readLocal(): RegistrationRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as RegistrationRecord[]) : []
  } catch {
    return []
  }
}

function writeLocal(records: RegistrationRecord[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // Storage unavailable. The submission still succeeds for this session;
    // the real backend is the system of record once it is wired up.
  }
}

/** Human-readable and short enough to read aloud at the door. */
function makeReference(index: number) {
  return `SND26-${String(index + 1).padStart(4, '0')}`
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

/** Why registration is not accepting people. Null when it is open. */
export type ClosedReason = 'full' | 'closed' | 'past'

export interface EventStatus extends EventDetails {
  registered: number
  remaining: number
  isFull: boolean
  /**
   * Set by the server, which owns the decision: it knows the date in the
   * venue's timezone and whether the team has closed registration by hand.
   * A client-side date comparison would use the visitor's own clock, so a
   * phone set a day fast would close the form early for that one person.
   */
  closedReason: ClosedReason | null
}

export async function getEvent(): Promise<EventStatus> {
  if (USE_API) {
    const res = await fetch(`${BASE}/api/event`)
    if (!res.ok) throw new RegistrationError('Could not load event details', 'network')
    const data = (await res.json()) as EventDetails & {
      registered: number
      closedReason: ClosedReason | null
    }
    return {
      ...data,
      remaining: Math.max(0, data.capacity - data.registered),
      isFull: data.registered >= data.capacity,
      closedReason: data.closedReason ?? null,
    }
  }

  const registered = readLocal().length
  return {
    ...event,
    registered,
    remaining: Math.max(0, event.capacity - registered),
    isFull: registered >= event.capacity,
    // The local fallback has no server to ask, so it knows only about seats.
    closedReason: registered >= event.capacity ? 'full' : null,
  }
}

/*
 * Speakers and the programme come from the API once it is configured, because
 * the organising team edits them there (§7, §8) and a bundled copy would show
 * yesterday's line-up until the next deploy.
 *
 * Both fall back to the data files if the request fails. A speaker grid is not
 * worth a blank page: the bundled copy is stale but recognisable, where an
 * error state tells a visitor the site is broken. The RSVP form deliberately
 * does NOT do this -- a registration that silently goes nowhere is worse than
 * an error, so createRegistration lets its failure through.
 */
async function fetchOrFallback<T>(path: string, fallback: T): Promise<T> {
  if (!USE_API) return fallback
  try {
    const res = await fetch(`${BASE}${path}`)
    if (!res.ok) return fallback
    const data = (await res.json()) as T
    // An empty list usually means a half-seeded database rather than an event
    // with no speakers, and the bundled copy is the better answer either way.
    return Array.isArray(data) && data.length === 0 ? fallback : data
  } catch {
    return fallback
  }
}

export async function getSpeakers(): Promise<Speaker[]> {
  return fetchOrFallback('/api/speakers', speakers)
}

export async function getProgramme(): Promise<ProgrammeItem[]> {
  return fetchOrFallback('/api/programme', programme)
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                     */
/* -------------------------------------------------------------------------- */

export async function createRegistration(input: Registration): Promise<RegistrationRecord> {
  if (USE_API) {
    const res = await fetch(`${BASE}/api/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(input),
    })
    if (res.status === 409) throw new RegistrationError('Event is full', 'full')
    if (res.status === 422) {
      throw new RegistrationError(
        'Validation failed',
        'validation',
        await readValidationErrors(res),
      )
    }
    if (!res.ok) throw new RegistrationError('Registration failed', 'network')
    return (await res.json()) as RegistrationRecord
  }

  // §9 capacity control lives here, not in the component, so the rule
  // survives the move to Laravel.
  const records = readLocal()
  if (records.length >= event.capacity) {
    throw new RegistrationError('Event is full', 'full')
  }

  const record: RegistrationRecord = {
    ...input,
    reference: makeReference(records.length),
    submittedAt: new Date().toISOString(),
  }
  writeLocal([...records, record])

  // Mirrors the latency of a real submission so the pending state is visible.
  await new Promise((resolve) => setTimeout(resolve, 450))
  return record
}

/* -------------------------------------------------------------------------- */
/* Export (§9 CSV/Excel export, §12 registration data export)                 */
/* -------------------------------------------------------------------------- */

const CSV_COLUMNS = [
  'reference',
  'submittedAt',
  'fullName',
  'email',
  'mobile',
  'organisation',
  'designation',
  'dietary',
] as const

function escapeCsv(value: string) {
  // Guard against spreadsheet formula injection from user-entered fields.
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value
  return `"${guarded.replace(/"/g, '""')}"`
}

export function toCsv(records: RegistrationRecord[]) {
  const header = CSV_COLUMNS.join(',')
  const rows = records.map((r) => CSV_COLUMNS.map((c) => escapeCsv(String(r[c] ?? ''))).join(','))
  return [header, ...rows].join('\r\n')
}

export async function exportRegistrations(): Promise<string> {
  if (USE_API) {
    // The admin token is deliberately NOT shipped in the bundle -- every
    // VITE_ variable is compiled into public JavaScript, so putting it here
    // would publish the attendee list to anyone who opens devtools. This
    // branch therefore fails with 401 against the live API by design; the
    // real export runs from a terminal:
    //   curl -H "Authorization: Bearer $ADMIN_API_TOKEN"     //        https://serinegaradialogue.org/api/admin/registrations
    const res = await fetch(`${BASE}/api/admin/registrations`, { headers: { Accept: 'text/csv' } })
    if (!res.ok) throw new RegistrationError('Could not export registrations', 'network')
    return res.text()
  }
  return toCsv(readLocal())
}
