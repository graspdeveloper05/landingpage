import { useEffect, useRef, useState } from 'react'
import { API_BASE } from '@/services/api'
import { adminApi, reachable } from './client'
import { AdminButton, AdminCard, AdminField, Notice } from './ui'
import { SkeletonRows } from './Loading'

interface Row {
  reference: string
  fullName: string
  email: string
  mobile: string
  organisation: string
  designation: string
  dietary: string | null
  submittedAt: string | null
  confirmationSent: boolean
}

interface Edition {
  edition: number
  date: string | null
  venue: string | null
  registrations: number
  isPast: boolean
}

interface Page {
  data: Row[]
  meta: {
    total: number
    page: number
    lastPage: number
    capacity: number
    edition: number
    editions: Edition[]
    editionTotal: number
    timezone: string
  }
}

/**
 * How one edition reads in the filter.
 *
 * The year alone does not say which of two entries is the one that has
 * already happened, so the date carries that, and "past" is stated rather
 * than left to be worked out from it. The count is there because the most
 * common reason to open this filter is to find where the attendees are.
 */
/** One end of the date range. Narrow, because a date input needs no more. */
function DateBound({
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
    <label className="block">
      <span className="block text-[0.78rem] font-semibold text-navy-900">{label}</span>
      <input
        type="date"
        value={value}
        // The browser enforces the ordering in its own picker, so an
        // impossible range is hard to enter rather than merely rejected
        // afterwards by the API.
        min={min || undefined}
        max={max || undefined}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block rounded-sm border border-[#DDDCD8] bg-white px-2.5 py-1.5 text-[0.85rem] text-navy-950 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/35"
      />
    </label>
  )
}

function editionLabel(e: Edition): string {
  const when = e.date
    ? new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : `${e.edition}`
  const seats = e.registrations === 1 ? '1 registration' : `${e.registrations} registrations`
  return `${e.edition} — ${when} · ${seats}${e.isPast ? ' · past' : ''}`
}

/** §9 — the participant list, and the CSV the team files it with. */
export function RegistrationsAdmin() {
  const [page, setPage] = useState<Page | null>(null)
  const [search, setSearch] = useState('')
  const [current, setCurrent] = useState(1)
  // null until the first response says which edition the server chose. Held
  // separately from meta.edition so the dropdown does not snap back to the
  // old value for the moment a slower response is still in flight.
  const [edition, setEdition] = useState<number | null>(null)
  // Registered-between, as Y-m-d. Empty string means "no bound", which is
  // also what an emptied <input type="date"> reports.
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  // Bumped by "Try again" to re-run the effect without changing the query.
  const [reloads, setReloads] = useState(0)
  const [error, setError] = useState<string | null>(null)
  // Sequence number for in-flight requests; see the note in the effect.
  const latest = useRef(0)

  useEffect(() => {
    // Debounced: typing a name would otherwise fire a query per keystroke.
    // Debouncing thins them out but does not order them -- two requests that
    // do go out can still answer in either order -- so each one takes a
    // number below and only the newest may write to state.
    const timer = setTimeout(() => {
      const ticket = ++latest.current
      const params = new URLSearchParams({ page: String(current) })
      if (search.trim()) params.set('search', search.trim())
      if (edition !== null) params.set('edition', String(edition))
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      setError(null)
      adminApi
        .get<Page>(`/admin/registrations/list?${params}`)
        .then((result) => {
          if (ticket !== latest.current) return
          setPage(result)
          // Adopt whatever the server settled on, so the dropdown shows the
          // edition actually being listed rather than one that was asked for
          // and quietly refused.
          setEdition(result.meta.edition)
        })
        .catch((e) => {
          if (ticket !== latest.current) return
          // Show an empty result rather than leaving `page` null, which would
          // sit on "Loading..." underneath the error indefinitely. The
          // editions already loaded are kept, so the filter does not vanish
          // and strand somebody on a year they cannot navigate out of.
          setPage((prev) => ({
            data: [],
            meta: {
              total: 0,
              page: 1,
              lastPage: 1,
              capacity: 0,
              edition: edition ?? 0,
              editions: prev?.meta.editions ?? [],
              editionTotal: 0,
              timezone: prev?.meta.timezone ?? 'UTC',
            },
          }))
          setError(reachable(e))
        })
    }, 250)
    return () => clearTimeout(timer)
  }, [search, current, reloads, edition, from, to])

  const meta = page?.meta
  // Search is deliberately not counted: it is a lookup, not a filter, and
  // "2 shown" while typing a name is noise rather than information.
  const filtered = Boolean(from || to)

  const exportQuery = new URLSearchParams({
    ...(edition !== null ? { edition: String(edition) } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  }).toString()

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          {/*
            Hidden while a load has failed. The error path substitutes an empty
            result, and rendering its zeroes announced "0 of 0 seats taken --
            registration is closed" on a page that simply could not reach the
            server. Saying nothing about seats is the honest answer there.
          */}
          {meta && !error && (
            <p className="mt-1 text-small text-slate">
              {filtered ? (
                /* While a range is applied, "3 of 200 seats taken" would be
                   read as the seat count for the whole event, which it is
                   not. Say how many the filter matched instead, and keep the
                   edition's real total beside it. */
                <>
                  <strong className="text-navy-900">{meta.total}</strong> shown
                  <span className="text-slate"> · {meta.editionTotal} in {meta.edition}</span>
                </>
              ) : (
                <>
                  <strong className="text-navy-900">{meta.total}</strong> of {meta.capacity} seats
                  taken
                  {meta.total >= meta.capacity && (
                    <span className="ml-2 font-semibold text-red-700">
                      — registration is closed
                    </span>
                  )}
                </>
              )}
            </p>
          )}
        </div>

        {/*
          A plain link, not a fetch-and-blob: the browser handles the download,
          the Content-Disposition filename survives, and a 200-row CSV never
          passes through JavaScript memory. The session cookie authenticates it.
        */}
        {/* The export follows the filter. A dropdown that changes the list on
            screen but not the file that downloads from beside it is how the
            wrong year's attendee list gets emailed to a caterer. */}
        <a
          href={`${API_BASE}/api/admin/registrations?${exportQuery}`}
          // Styled to match AdminButton rather than reusing it: this has to
          // stay an <a> so the browser performs the download itself.
          className="inline-flex min-h-[34px] items-center rounded-sm bg-navy-900 px-3 text-[0.78rem] font-semibold text-cream transition-colors hover:bg-navy-800"
        >
          Download CSV{edition !== null && ` (${edition})`}
          {filtered && <span className="ml-1 font-normal opacity-80">· filtered</span>}
        </a>
      </div>

      {error && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Notice kind="error">{error}</Notice>
          <AdminButton variant="quiet" onClick={() => setReloads((n) => n + 1)}>
            Try again
          </AdminButton>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        {/*
          Shown only once there is more than one edition to choose between.
          In 2026 there is exactly one, and a dropdown with a single option is
          a control that asks a question with no second answer.
        */}
        {meta && meta.editions.length > 1 && (
          <label className="block">
            <span className="block text-[0.78rem] font-semibold text-navy-900">Event</span>
            <select
              value={edition ?? meta.edition}
              onChange={(e) => {
                setEdition(Number(e.target.value))
                // Page 4 of last year's list is not page 4 of this year's.
                setCurrent(1)
              }}
              className="mt-1 block w-full rounded-sm border border-[#DDDCD8] bg-white px-2.5 py-1.5 text-[0.85rem] text-navy-950 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/35"
            >
              {meta.editions.map((e) => (
                <option key={e.edition} value={e.edition}>
                  {editionLabel(e)}
                </option>
              ))}
            </select>
          </label>
        )}

        <DateBound
          label="Registered from"
          value={from}
          // Bounded by each other, so the picker cannot offer a range that
          // ends before it begins.
          max={to}
          onChange={(v) => {
            setFrom(v)
            setCurrent(1)
          }}
        />
        <DateBound
          label="to"
          value={to}
          min={from}
          onChange={(v) => {
            setTo(v)
            setCurrent(1)
          }}
        />

        {filtered && (
          <AdminButton
            variant="quiet"
            onClick={() => {
              setFrom('')
              setTo('')
              setCurrent(1)
            }}
          >
            Clear dates
          </AdminButton>
        )}

        <div className="min-w-[16rem] max-w-sm grow">
          <AdminField
            label="Search"
            value={search}
            onChange={(v) => {
              setSearch(v)
              // Staying on page 4 of a narrower result set shows nothing.
              setCurrent(1)
            }}
            placeholder="Name, email, organisation or reference"
          />
        </div>
      </div>

      {!page && <SkeletonRows count={5} />}

      {page && page.data.length === 0 && !error && (
        <AdminCard>
          <p className="text-small text-slate">
            {search
              ? 'Nobody matches that search.'
              : filtered
                ? /* An edition with people in it but none in the chosen
                     range is a different answer from an edition nobody has
                     signed up for, and the fix is different too. */
                  `No registrations between those dates. ${meta?.editionTotal ?? 0} in ${meta?.edition ?? ''} altogether.`
                : /* Names the year, so an empty list reads as "nobody has
                     registered for 2027 yet" rather than as a list that has
                     failed to load. */
                  `No registrations for ${meta?.edition ?? ''} yet.`}
          </p>
        </AdminCard>
      )}

      {page && page.data.length > 0 && (
        <div className="overflow-x-auto rounded-sm border border-hair bg-white">
          <table className="w-full min-w-[46rem] text-left text-small">
            <thead className="border-b border-hair bg-cream-deep">
              <tr className="text-micro uppercase tracking-[0.1em] text-slate">
                <th className="px-3 py-2 font-semibold">Reference</th>
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Contact</th>
                <th className="px-3 py-2 font-semibold">Organisation</th>
                <th className="px-3 py-2 font-semibold">Dietary</th>
                <th className="px-3 py-2 font-semibold">Registered</th>
              </tr>
            </thead>
            <tbody>
              {page.data.map((row) => (
                <tr key={row.reference} className="border-b border-hair last:border-0">
                  <td className="tnum whitespace-nowrap px-3 py-2 font-semibold text-navy-900">
                    {row.reference}
                    {!row.confirmationSent && (
                      <span
                        title="The confirmation email did not send"
                        className="ml-1.5 text-red-600"
                      >
                        !
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-navy-900">
                    {row.fullName}
                    <span className="block text-micro text-slate">{row.designation}</span>
                  </td>
                  <td className="px-3 py-2 text-navy-800">
                    <a href={`mailto:${row.email}`} className="underline decoration-hair">
                      {row.email}
                    </a>
                    <span className="block text-micro text-slate">{row.mobile}</span>
                  </td>
                  <td className="px-3 py-2 text-navy-800">{row.organisation}</td>
                  <td className="px-3 py-2 text-navy-800">{row.dietary ?? '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate">
                    {row.submittedAt
                      ? new Date(row.submittedAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          // The venue's zone, not the viewer's. Without this a
                          // registration made at 00:30 in Kuala Lumpur shows
                          // as the previous day to anyone abroad, while the
                          // date filter beside it says otherwise.
                          timeZone: meta?.timezone,
                        })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.lastPage > 1 && (
        <div className="mt-4 flex items-center gap-3">
          <AdminButton variant="quiet" disabled={current <= 1} onClick={() => setCurrent(current - 1)}>
            Previous
          </AdminButton>
          <span className="text-small text-slate">
            Page {meta.page} of {meta.lastPage}
          </span>
          <AdminButton
            variant="quiet"
            disabled={current >= meta.lastPage}
            onClick={() => setCurrent(current + 1)}
          >
            Next
          </AdminButton>
        </div>
      )}

      <p className="mt-6 text-micro text-slate">
        This list is personal data under the PDPA. Export it only when you need to, and delete
        copies once the event is over.
      </p>
    </>
  )
}
