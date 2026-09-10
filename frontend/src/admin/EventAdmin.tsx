import { useEffect, useState } from 'react'
import {
  adminApi,
  AdminError,
  EMPTY_LOCALIZED,
  reachable,
  type Locale,
  type Localized,
} from './client'
import { AdminButton, AdminCard, AdminField, LocalizedFieldset, Notice } from './ui'

interface EventForm {
  date: string
  dateLabel: Localized
  startTime: string
  timeLabel: Localized
  venue: string
  venueAddress: string
  mapsUrl: string
  mapEmbedUrl: string
  capacity: number
}

const BLANK: EventForm = {
  date: '',
  dateLabel: { ...EMPTY_LOCALIZED },
  startTime: '',
  timeLabel: { ...EMPTY_LOCALIZED },
  venue: '',
  venueAddress: '',
  mapsUrl: '',
  mapEmbedUrl: '',
  capacity: 200,
}

/** §6 and §9 — the date, time, venue and capacity the whole site shows. */
export function EventAdmin() {
  const [form, setForm] = useState<EventForm | null>(null)
  const [registered, setRegistered] = useState(0)
  const [edition, setEdition] = useState<number | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = () => {
    setError(null)
    return adminApi
      .get<{
        event: EventForm | null
        registered: number
        edition: number
      }>('/admin/event')
      .then((r) => {
        setForm(r.event ?? BLANK)
        setRegistered(r.registered)
        setEdition(r.edition)
      })
      .catch((e) => {
        setForm(BLANK)
        setError(reachable(e))
      })
  }

  useEffect(() => {
    load()
  }, [])

  const set = <K extends keyof EventForm>(key: K, value: EventForm[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f))

  const localeErrors = (prefix: string) =>
    Object.fromEntries(
      Object.entries(fieldErrors)
        .filter(([k]) => k.startsWith(`${prefix}.`))
        .map(([k, v]) => [k.slice(prefix.length + 1) as Locale, v]),
    ) as Partial<Record<Locale, string>>

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setBusy(true)
    setError(null)
    setSaved(false)
    setFieldErrors({})
    try {
      await adminApi.put('/admin/event', { ...form, capacity: Number(form.capacity) })
      setSaved(true)
    } catch (err) {
      if (err instanceof AdminError) {
        setFieldErrors(err.fields)
        setError(
          Object.keys(err.fields).length > 0
            ? 'Some fields need attention — see below.'
            : err.message,
        )
      } else {
        setError('Could not save.')
      }
    } finally {
      setBusy(false)
    }
  }

  if (!form) return <p className="text-small text-slate">Loading…</p>

  return (
    <form onSubmit={save}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.78rem] text-slate">
          Edition {edition ?? '—'} · shown in the hero, the event information section and the
          confirmation email.
        </p>
        <AdminButton type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </AdminButton>
      </div>

      {error && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Notice kind="error">{error}</Notice>
          <AdminButton variant="quiet" onClick={load}>
            Try again
          </AdminButton>
        </div>
      )}
      {saved && (
        <div className="mb-4">
          <Notice kind="success">Saved. The site shows the new details immediately.</Notice>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminCard className="space-y-4">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate">When</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField
              label="Date"
              type="date"
              value={form.date}
              onChange={(v) => set('date', v)}
              error={fieldErrors.date}
              hint="Used by search engines and the calendar."
            />
            <AdminField
              label="Start time"
              value={form.startTime}
              onChange={(v) => set('startTime', v)}
              error={fieldErrors.startTime}
              hint="24-hour, e.g. 14:30"
              placeholder="14:30"
            />
          </div>

          {/*
            The written date is separate from the date above on purpose. The
            picker gives a machine an unambiguous 2026-10-08; these are what a
            visitor reads, and rendering a Malaysian date in Tamil is a
            translation rather than something to generate from a format string.
          */}
          <LocalizedFieldset
            label="Date, as written"
            value={form.dateLabel}
            onChange={(v) => set('dateLabel', v)}
            errors={localeErrors('dateLabel')}
            hint="For example: 8 October 2026"
          />

          <LocalizedFieldset
            label="Time, as written"
            value={form.timeLabel}
            onChange={(v) => set('timeLabel', v)}
            errors={localeErrors('timeLabel')}
            hint="For example: 2.30 PM onwards"
          />
        </AdminCard>

        <div className="space-y-5">
          <AdminCard className="space-y-4">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate">Where</p>

            <AdminField
              label="Venue"
              value={form.venue}
              onChange={(v) => set('venue', v)}
              error={fieldErrors.venue}
            />
            <AdminField
              label="Address"
              value={form.venueAddress}
              onChange={(v) => set('venueAddress', v)}
              error={fieldErrors.venueAddress}
            />
            <AdminField
              label="Google Maps link"
              value={form.mapsUrl}
              onChange={(v) => set('mapsUrl', v)}
              error={fieldErrors.mapsUrl}
              hint="The “Open in Google Maps” button."
            />
            <AdminField
              label="Google Maps embed link"
              value={form.mapEmbedUrl}
              onChange={(v) => set('mapEmbedUrl', v)}
              error={fieldErrors.mapEmbedUrl}
              hint="The map shown on the page. Ends with &output=embed."
            />
          </AdminCard>

          <AdminCard className="space-y-3">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate">
              Capacity
            </p>
            <AdminField
              label="Seats"
              type="number"
              value={String(form.capacity)}
              onChange={(v) => set('capacity', Number(v))}
              error={fieldErrors.capacity}
            />
            <p className="text-micro text-slate">
              <strong className="text-navy-900">{registered}</strong> registered so far.
              Registration closes on its own when the seats are gone.
              {registered > 0 && ' Capacity cannot be set below that number.'}
            </p>
          </AdminCard>
        </div>
      </div>
    </form>
  )
}
