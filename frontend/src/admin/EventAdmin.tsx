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
import { SkeletonForm } from './Loading'

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
  registrationOpen: boolean
}

type ClosedReason = 'full' | 'closed' | 'past'

/** What the site is currently telling visitors, in the team's words. */
const STATE: Record<string, { label: string; detail: string; tone: string }> = {
  open: {
    label: 'Open',
    detail: 'The form is accepting registrations.',
    tone: 'border-green-600 bg-green-50 text-green-900',
  },
  full: {
    label: 'Full',
    detail: 'Every seat is taken, so the form has closed itself.',
    tone: 'border-gold-600 bg-[#FAF6E8] text-navy-900',
  },
  closed: {
    label: 'Closed',
    detail: 'You have closed registration. Visitors are told so.',
    tone: 'border-navy-600 bg-[#EEF1F5] text-navy-900',
  },
  past: {
    label: 'Past',
    detail: 'The date has gone by. The form is closed and cannot be reopened without changing the date.',
    tone: 'border-[#DDDCD8] bg-[#F1F1EF] text-slate',
  },
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
  registrationOpen: true,
}

/** §6 and §9 — the date, time, venue and capacity the whole site shows. */
export function EventAdmin() {
  const [form, setForm] = useState<EventForm | null>(null)
  const [registered, setRegistered] = useState(0)
  const [closedReason, setClosedReason] = useState<ClosedReason | null>(null)
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
        closedReason: ClosedReason | null
      }>('/admin/event')
      .then((r) => {
        setForm(r.event ?? BLANK)
        setRegistered(r.registered)
        setEdition(r.edition)
        setClosedReason(r.closedReason ?? null)
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
      // The state may have changed with the save -- reopening registration, or
      // moving the date into the past. Re-read rather than guess.
      load()
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

  if (!form) return <SkeletonForm />

  return (
    <form onSubmit={save}>
      <div className="mb-4">
        <p className="text-[0.78rem] text-slate">
          Edition {edition ?? '—'} · shown in the hero, the event information section and the
          confirmation email.
        </p>
      </div>

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
            {/*
              type="time" gives the browser's own picker, which shows AM/PM
              when the machine is set to a 12-hour clock -- while the value it
              submits is always 24-hour "14:30", which is exactly what the API
              validates. Nobody has to think in 24-hour to fill it in, and
              nothing downstream has to parse "2.30 pm".
            */}
            <AdminField
              label="Start time"
              type="time"
              value={form.startTime}
              onChange={(v) => set('startTime', v)}
              error={fieldErrors.startTime}
              hint="Pick a time. Visitors see the wording you set below."
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
              Registration
            </p>

            {/* What the site is telling visitors right now, said plainly. The
                team should not have to work it out from a capacity number and
                a date. */}
            {(() => {
              const state = STATE[closedReason ?? 'open']
              return (
                <div className={`rounded-sm border-l-2 px-3 py-2 ${state.tone}`}>
                  <p className="text-[0.8rem] font-semibold">{state.label}</p>
                  <p className="mt-0.5 text-[0.7rem] leading-snug">{state.detail}</p>
                </div>
              )
            })()}

            <label className="flex items-start gap-2.5">
              <input
                type="checkbox"
                checked={form.registrationOpen}
                onChange={(e) => set('registrationOpen', e.target.checked)}
                // A past event cannot be reopened by ticking a box; the date
                // is what makes it past, so the date is where you change it.
                disabled={closedReason === 'past'}
                className="mt-0.5 h-4 w-4 accent-[#C9A227] disabled:opacity-40"
              />
              <span className="text-[0.8rem] text-navy-800">
                Accept registrations
                <span className="block text-[0.7rem] leading-snug text-slate">
                  Untick to close the form early — before a catering or security
                  deadline, say. Visitors see a closed notice instead.
                </span>
              </span>
            </label>

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

      {/*
        The save bar sits at the foot of the form and sticks to the bottom of
        the viewport.

        At the top it was above the fold and out of sight by the time you had
        filled anything in -- you finish at the bottom of a two-screen form and
        the button is a scroll away. Sticky rather than merely last, so it is
        reachable from wherever you are in the form without hunting for it.

        Messages live here too, beside the button that produced them. A
        validation error announced at the top of a long form is an error you
        have to go looking for.
      */}
      <div className="sticky bottom-0 -mx-4 -mb-4 mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-[#DDDCD8] bg-white px-4 py-3 shadow-[0_-6px_16px_-8px_rgba(11,33,64,0.25)] sm:-mx-6 sm:-mb-6 sm:px-6">
        {error && (
          <>
            <Notice kind="error">{error}</Notice>
            <AdminButton variant="quiet" onClick={load}>
              Try again
            </AdminButton>
          </>
        )}
        {saved && !error && (
          <Notice kind="success">Saved. The site shows the new details immediately.</Notice>
        )}
        <AdminButton type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </AdminButton>
      </div>
    </form>
  )
}
