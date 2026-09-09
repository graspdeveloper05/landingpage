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

const BASE = import.meta.env.VITE_API_BASE_URL as string | undefined
const STORAGE_KEY = 'snd.registrations'

export class RegistrationError extends Error {
  constructor(
    message: string,
    readonly kind: 'validation' | 'full' | 'network',
  ) {
    super(message)
    this.name = 'RegistrationError'
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

export async function getSpeakers(): Promise<Speaker[]> {
  if (BASE) {
    const res = await fetch(`${BASE}/api/speakers`)
    if (!res.ok) throw new RegistrationError('Could not load speakers', 'network')
    return (await res.json()) as Speaker[]
  }
  return speakers
}

export async function getProgramme(): Promise<ProgrammeItem[]> {
  if (BASE) {
    const res = await fetch(`${BASE}/api/programme`)
    if (!res.ok) throw new RegistrationError('Could not load programme', 'network')
    return (await res.json()) as ProgrammeItem[]
  }
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
    if (res.status === 422) throw new RegistrationError('Validation failed', 'validation')
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
    const res = await fetch(`${BASE}/api/admin/registrations`, { headers: { Accept: 'text/csv' } })
    if (!res.ok) throw new RegistrationError('Could not export registrations', 'network')
    return res.text()
  }
  return toCsv(readLocal())
}
