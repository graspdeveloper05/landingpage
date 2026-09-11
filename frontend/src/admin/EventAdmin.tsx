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
import { useToast } from './Toast'
import { SkeletonForm } from './Loading'

interface EventForm {
  date: string
  dateLabel: Localized
  startTime: string
  timeLabel: Localized
  eventName: Localized
  subtitle: Localized
  /** Base path of an uploaded hero, or null for the shipped photograph. */
  heroImage: string | null
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
  eventName: { ...EMPTY_LOCALIZED },
  subtitle: { ...EMPTY_LOCALIZED },
  heroImage: null,
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
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const load = () => {
    setError(null)
    return adminApi
      .get<{
        event:
          | (Omit<EventForm, 'eventName' | 'subtitle' | 'heroImage'> & {
              eventName: Localized | null
              subtitle: Localized | null
              heroImage: string | null
            })
          | null
        registered: number
        edition: number
        closedReason: ClosedReason | null
      }>('/admin/event')
      .then((r) => {
        // Normalised on the way in. These three are null on an edition saved
        // before the hero became editable, and a LocalizedFieldset handed
        // null renders four uncontrolled inputs that React then complains
        // about the moment somebody types.
        setForm(
          r.event
            ? {
                ...r.event,
                eventName: r.event.eventName ?? { ...EMPTY_LOCALIZED },
                subtitle: r.event.subtitle ?? { ...EMPTY_LOCALIZED },
                heroImage: r.event.heroImage ?? null,
              }
            : BLANK,
        )
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
    setFieldErrors({})
    try {
      await adminApi.put('/admin/event', { ...form, capacity: Number(form.capacity) })
      toast.success('Saved. The site shows the new details immediately.')
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

        <AdminCard className="space-y-4">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate">
            The hero
          </p>

          <LocalizedFieldset
            label="Event name"
            value={form.eventName}
            onChange={(v) => set('eventName', v)}
            errors={localeErrors('eventName')}
            hint="The line under the headline. For example: Seri Negara Dialogue 2026"
          />

          <LocalizedFieldset
            label="Subtitle"
            value={form.subtitle}
            onChange={(v) => set('subtitle', v)}
            errors={localeErrors('subtitle')}
            hint="For example: A National Conversation on Malaysia's Future"
          />

          <HeroImageField
            value={form.heroImage}
            onChange={(v) => set('heroImage', v)}
            error={fieldErrors.heroImage}
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
        <AdminButton type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </AdminButton>
      </div>
    </form>
  )
}

/**
 * The photograph behind the hero.
 *
 * Uploading happens immediately, before Save — the server has to resize the
 * file and hand back a path, and there is nothing useful to show in the
 * meantime otherwise. Save then stores that path. So an upload followed by
 * navigating away leaves four unused files on disk and the hero unchanged,
 * which is the harmless direction for that mistake to fall.
 */
function HeroImageField({
  value,
  onChange,
  error,
}: {
  value: string | null
  onChange: (v: string | null) => void
  error?: string
}) {
  const [uploading, setUploading] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)
  const toast = useToast()

  async function upload(file: File) {
    setUploading(true)
    setFailed(null)
    try {
      const body = new FormData()
      body.append('hero', file)
      const r = await adminApi.post<{ path: string }>('/admin/hero-image', body)
      onChange(r.path)
      toast.success('Image uploaded. Save to put it on the site.')
    } catch (e) {
      // The field error is the useful one here: it names the actual
      // dimension or format problem rather than saying the upload failed.
      setFailed(
        e instanceof AdminError ? (e.fields.hero ?? e.message) : 'Could not upload that image.',
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <span className="block text-[0.78rem] font-semibold text-navy-900">Background image</span>
      <span className="mt-0.5 block text-[0.7rem] leading-snug text-slate">
        At least 1600 × 600; around 2400 × 1000 is ideal. Keep the building and people in the
        right two-thirds — the headline covers the left third.
      </span>

      <div className="mt-2 flex flex-wrap items-start gap-3">
        {/*
          The preview is the uploaded file itself, at the shape it will be
          used in. A thumbnail in some other ratio would hide exactly the
          mistake this is here to catch -- a subject that falls under the
          headline.
        */}
        <div className="relative h-[76px] w-[180px] shrink-0 overflow-hidden rounded-sm border border-hair bg-cream-deep">
          <img
            src={value ? `${value}.jpg` : '/hero/hero-scene-960.jpg'}
            alt=""
            className="h-full w-full object-cover"
          />
          {/* Marks the left third the copy sits over, so it is obvious
              before saving whether a face has landed behind the text. */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 border-r border-dashed border-navy-900/40 bg-cream/55" />
        </div>

        <div className="min-w-[12rem] grow">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              // Cleared so choosing the same file twice after a failed
              // upload fires a change event rather than looking inert.
              e.target.value = ''
              if (file) upload(file)
            }}
            className="block w-full text-[0.78rem] text-navy-800 file:mr-3 file:cursor-pointer file:rounded-sm file:border-0 file:bg-navy-900 file:px-3 file:py-1.5 file:text-[0.75rem] file:font-semibold file:text-cream hover:file:bg-navy-800 disabled:cursor-not-allowed"
          />

          <p className="mt-1.5 text-[0.7rem] text-slate">
            {uploading
              ? 'Uploading and resizing…'
              : value
                ? 'Using an uploaded image.'
                : 'Using the image that came with the site.'}
          </p>

          {value && !uploading && (
            <AdminButton variant="quiet" onClick={() => onChange(null)}>
              Use the original again
            </AdminButton>
          )}

          {(failed || error) && (
            <p className="mt-1.5 text-[0.7rem] text-red-600">{failed ?? error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
