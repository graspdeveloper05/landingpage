import { useEffect, useState } from 'react'
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

/** §12 — basic website analytics, first-party and cookieless. */
export function AnalyticsAdmin() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30)
  const [data, setData] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = (range: number) => {
    setError(null)
    return adminApi
      .get<Summary>(`/admin/analytics?days=${range}`)
      .then(setData)
      .catch((e) => setError(reachable(e)))
  }

  useEffect(() => {
    load(days)
  }, [days])

  if (error) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Notice kind="error">{error}</Notice>
        <AdminButton variant="quiet" onClick={() => load(days)}>
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
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setDays(r)}
              className={cn(
                'rounded-sm border px-2.5 py-1 text-[0.72rem] font-semibold transition-colors',
                days === r
                  ? 'border-navy-900 bg-navy-900 text-cream'
                  : 'border-[#DDDCD8] bg-white text-navy-800 hover:border-navy-600',
              )}
            >
              {r} days
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Visitors" value={data.visitors} hint="Counted once a day each" />
        <Stat label="Page views" value={data.views} />
        <Stat label="Registrations" value={data.registrations} hint={`In these ${data.days} days`} />
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
