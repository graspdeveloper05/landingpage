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

// Trailing slashes are stripped so `https://host/` and `https://host` both
// produce `https://host/api/event` rather than a double slash, which some
// hosts answer with a redirect that drops the POST body.
const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '')
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

export interface EventStatus extends EventDetails {
  registered: number
  remaining: number
  isFull: boolean
}

export async function getEvent(): Promise<EventStatus> {
  if (BASE) {
    const res = await fetch(`${BASE}/api/event`)
    if (!res.ok) throw new RegistrationError('Could not load event details', 'network')
    const data = (await res.json()) as EventDetails & { registered: number }
    return {
      ...data,
      remaining: Math.max(0, data.capacity - data.registered),
      isFull: data.registered >= data.capacity,
    }
  }

  const registered = readLocal().length
  return {
    ...event,
    registered,
    remaining: Math.max(0, event.capacity - registered),
    isFull: registered >= event.capacity,
  }
}

/*
 * Speakers and the programme deliberately stay on the local data files even
 * when the API is connected.
 *
 * They are content, not state: HANDOVER.md tells the organising team to edit
 * src/data/editions/2026/, and the API would make a second source of truth
 * that has to be kept in step by hand. Serving them locally also means the
 * grid and the timeline still render if the API is down, and costs two fewer
 * round-trips on the page that matters most.
 *
 * The endpoints exist in Laravel and are documented, so this can be reversed
 * in one commit if the team ever wants to edit speakers from the server.
 */
export async function getSpeakers(): Promise<Speaker[]> {
  return speakers
}

export async function getProgramme(): Promise<ProgrammeItem[]> {
  return programme
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                     */
/* -------------------------------------------------------------------------- */

export async function createRegistration(input: Registration): Promise<RegistrationRecord> {
  if (BASE) {
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
  if (BASE) {
    // The admin token is deliberately NOT shipped in the bundle -- every
    // VITE_ variable is compiled into public JavaScript, so putting it here
    // would publish the attendee list to anyone who opens devtools. This
    // branch therefore fails with 401 against the live API by design; the
    // real export runs from a terminal:
    //   curl -H "Authorization: Bearer $ADMIN_API_TOKEN"     //        https://api.serinegaradialogue.org/api/admin/registrations
    const res = await fetch(`${BASE}/api/admin/registrations`, { headers: { Accept: 'text/csv' } })
    if (!res.ok) throw new RegistrationError('Could not export registrations', 'network')
    return res.text()
  }
  return toCsv(readLocal())
}
