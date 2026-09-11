import { useEffect, useRef, useState } from 'react'
import { adminApi, reachable } from './client'
import { AdminButton, AdminCard, Notice } from './ui'
import { SkeletonForm } from './Loading'
import { cn } from '@/lib/cn'

interface Breakdown {
  label: string
  views: number
  visitors: number
}

interface Summary {
  days: number
  from: string
  to: string
  custom: boolean
  views: number
  visitors: number
  registrations: number
  conversion: number | null
  series: { date: string; views: number; visitors: number }[]
  pages: Breakdown[]
  referrers: Breakdown[]
  locales: Breakdown[]
}

const RANGES = [7, 30, 90] as const

const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  ms: 'Bahasa Malaysia',
  zh: '中文',
  ta: 'தமிழ்',
}

/** One end of the analytics range. Label sits beside it, not above: this row
 *  is chrome above a chart, and stacked labels would out-weigh it. */
function DayInput({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: string
  min?: string
  max?: string
  onChange: (v: string) => void
}) {
  return (
    <input
      type="date"
      aria-label={label}
      value={value}
      min={min || undefined}
      max={max || undefined}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-sm border border-[#DDDCD8] bg-white px-2 py-1 text-[0.72rem] text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/35"
    />
  )
}

function formatDay(iso: string): string {
  // Parsed as a plain date, so it is not shifted by the viewer's timezone the
  // way `new Date('2026-09-05')` would be west of Greenwich.
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** §12 — basic website analytics, first-party and cookieless. */
export function AnalyticsAdmin() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30)
  // An explicit range, as Y-m-d. Either end may stand alone: a `from` with no
  // `to` reads as "since", which is the usual way somebody asks about a
  // launch date.
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [data, setData] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const custom = Boolean(from || to)

  const query = custom
    ? new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString()
    : `days=${days}`

  /*
   * Guards against a stale answer winning.
   *
   * Picking a start and then an end fires two requests, and the first can
   * come back second. That was visible: setting a range whose ends were
   * briefly out of order produced a 422 that arrived after the good response
   * and left the page showing an error for a range that was perfectly valid.
   * Every request takes a number, and only the newest one is allowed to write
   * to state.
   */
  const latest = useRef(0)

  const load = () => {
    const ticket = ++latest.current
    setError(null)
    return adminApi
      .get<Summary>(`/admin/analytics?${query}`)
      .then((result) => {
        if (ticket === latest.current) setData(result)
      })
      .catch((e) => {
        if (ticket === latest.current) setError(reachable(e))
      })
  }

  useEffect(() => {
    // Debounced, like the registration search. A date input fires a change
    // per arrow-key press in the picker, and without this a week's worth of
    // queries goes out while somebody scrolls to the day they wanted.
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [query])

  if (error) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Notice kind="error">{error}</Notice>
        <AdminButton variant="quiet" onClick={() => load()}>
          Try again
        </AdminButton>
      </div>
    )
  }

  if (!data) return <SkeletonForm cards={2} />

  const peak = Math.max(1, ...data.series.map((d) => d.views))

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.78rem] text-slate">
          Counted on this server. No cookies, no third party, nothing
          identifying stored — which is why the site carries no cookie banner.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  // Choosing a preset clears the range, rather than leaving
                  // two controls on screen disagreeing about the window.
                  setFrom('')
                  setTo('')
                  setDays(r)
                }}
                className={cn(
                  'rounded-sm border px-2.5 py-1 text-[0.72rem] font-semibold transition-colors',
                  !custom && days === r
                    ? 'border-navy-900 bg-navy-900 text-cream'
                    : 'border-[#DDDCD8] bg-white text-navy-800 hover:border-navy-600',
                )}
              >
                {r} days
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <DayInput label="From" value={from} max={to} onChange={setFrom} />
            <span className="text-[0.72rem] text-slate">to</span>
            <DayInput label="To" value={to} min={from} onChange={setTo} />
            {custom && (
              <button
                type="button"
                onClick={() => {
                  setFrom('')
                  setTo('')
                }}
                className="rounded-sm border border-[#DDDCD8] bg-white px-2.5 py-1 text-[0.72rem] font-semibold text-navy-800 transition-colors hover:border-navy-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/*
        Named only for a custom range. For a preset the buttons already say
        which window is showing, and repeating it underneath is chrome.
      */}
      {data.custom && (
        <p className="mb-4 text-[0.72rem] text-slate">
          Showing {formatDay(data.from)} to {formatDay(data.to)} · {data.days}{' '}
          {data.days === 1 ? 'day' : 'days'}
        </p>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Visitors" value={data.visitors} hint="Counted once a day each" />
        <Stat label="Page views" value={data.views} />
        <Stat label="Registrations" value={data.registrations} hint={data.days === 1 ? 'On this day' : `In these ${data.days} days`} />
        <Stat
          label="Registered"
          value={data.conversion === null ? '—' : `${data.conversion}%`}
          hint="Of visitors who came"
        />
      </div>

      <AdminCard className="mb-5">
        <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate">
          Page views a day
        </p>
        {/*
          Bars rather than a line, and no charting library. Thirty daily
          totals do not need 60 KB of JavaScript to be legible, and a bar
          chart reads honestly at this size where a smoothed line invents
          movement between the points it was given.
        */}
        <div className="flex h-32 items-end gap-[2px]" role="img" aria-label="Page views per day">
          {data.series.map((d) => (
            <div
              key={d.date}
              title={`${d.date}: ${d.views} views, ${d.visitors} visitors`}
              className="flex-1 rounded-t-[1px] bg-navy-700 transition-colors hover:bg-gold-500"
              // A day with no traffic still gets 2px, so the gap is visible as
              // a quiet day rather than as a hole in the chart.
              style={{ height: `${Math.max(2, (d.views / peak) * 100)}%` }}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[0.68rem] text-slate">
          <span>{data.series[0]?.date}</span>
          <span>{data.series[data.series.length - 1]?.date}</span>
        </div>
      </AdminCard>

      <div className="grid gap-5 lg:grid-cols-3">
        <Table
          title="Pages"
          rows={data.pages}
          empty="No page views yet."
          format={(l) => (l === '/' ? 'Home' : l === 'other' ? 'Other' : l)}
        />
        <Table
          title="Where they came from"
          rows={data.referrers}
          empty="Nobody has arrived from another site yet — or they came from WhatsApp, which sends no referrer."
        />
        <Table
          title="Language"
          rows={data.locales}
          empty="No language recorded yet."
          format={(l) => LOCALE_NAMES[l] ?? l}
        />
      </div>
    </>
  )
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: number | string
  hint?: string
}) {
  return (
    <AdminCard>
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate">{label}</p>
      <p className="tnum mt-1 text-[1.5rem] font-semibold leading-none text-navy-950">{value}</p>
      {hint && <p className="mt-1 text-[0.68rem] text-slate">{hint}</p>}
    </AdminCard>
  )
}

function Table({
  title,
  rows,
  empty,
  format = (l) => l,
}: {
  title: string
  rows: Breakdown[]
  empty: string
  format?: (label: string) => string
}) {
  const top = Math.max(1, ...rows.map((r) => r.views))

  return (
    <AdminCard>
      <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate">
        {title}
      </p>

      {rows.length === 0 ? (
        <p className="text-[0.75rem] leading-snug text-slate">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {rows.map((row) => (
            <li key={row.label} className="relative">
              {/* The bar sits behind the row rather than beside it: a separate
                  column would cost width that the labels need more. */}
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 rounded-sm bg-[#EEF1F5]"
                style={{ width: `${(row.views / top) * 100}%` }}
              />
              <span className="relative flex items-center justify-between gap-3 px-1.5 py-1">
                <span className="truncate text-[0.78rem] text-navy-900">{format(row.label)}</span>
                <span className="tnum shrink-0 text-[0.75rem] font-semibold text-navy-950">
                  {row.views}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  )
}
