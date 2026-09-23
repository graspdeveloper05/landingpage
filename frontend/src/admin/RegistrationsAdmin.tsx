import { Fragment, useEffect, useRef, useState } from 'react'
import { API_BASE } from '@/services/api'
import { adminApi, reachable } from './client'
import { useToast } from './Toast'
import { AdminButton, AdminCard, AdminField, Notice } from './ui'
import { SkeletonRows } from './Loading'
import { GoogleFormCard } from './GoogleFormCard'

interface Row {
  reference: string
  fullName: string
  /** Null only if the Google Form ever stops collecting addresses. */
  email: string | null
  mobile: string
  organisation: string
  designation: string
  dietary: string | null
  submittedAt: string | null
  confirmationSent: boolean
  /** The Chevening questions, labelled, e.g. { 'Chevening scholar': 'Yes' }. */
  answers: Record<string, string> | null
  /** Where it came from: the site's own form, or the Google Form. */
  source: 'website' | 'google_form'
  /** Whether the Google Form has it. */
  inGoogleForm: boolean
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
    perPage: number
    capacity: number
    edition: number
    editions: Edition[]
    editionTotal: number
    timezone: string
    /** True when site registrations are handed to the Google Form. */
    handoff: boolean
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

/**
 * The page numbers to show: always the first and last, the current page with
 * one either side, and a gap (null) wherever a run is skipped. A gap that
 * would hide a single page shows that page instead, since "…" in its place
 * takes the same room and says less.
 */
function pageWindow(page: number, lastPage: number): (number | null)[] {
  const wanted = new Set([1, lastPage, page - 1, page, page + 1])
  const pages = [...wanted].filter((p) => p >= 1 && p <= lastPage).sort((a, b) => a - b)
  const out: (number | null)[] = []
  for (const p of pages) {
    const prev = out[out.length - 1]
    if (typeof prev === 'number') {
      if (p - prev === 2) out.push(prev + 1)
      else if (p - prev > 2) out.push(null)
    }
    out.push(p)
  }
  return out
}

function Pagination({
  page,
  lastPage,
  perPage,
  total,
  onChange,
}: {
  page: number
  lastPage: number
  perPage: number
  total: number
  onChange: (page: number) => void
}) {
  const first = (page - 1) * perPage + 1
  const last = Math.min(page * perPage, total)
  const step =
    'inline-flex min-h-[34px] min-w-[34px] items-center justify-center rounded-sm border px-2.5 text-[0.8rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40'
  const idle = 'border-hair bg-white text-navy-900 hover:border-gold-500 hover:text-gold-700'

  return (
    <nav
      aria-label="Registrations pages"
      className="mt-4 flex flex-wrap items-center justify-between gap-3"
    >
      <p className="tnum text-small text-slate">
        Showing <strong className="text-navy-900">{first}–{last}</strong> of {total}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className={`${step} ${idle}`}
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
        >
          ‹ Previous
        </button>
        {pageWindow(page, lastPage).map((p, i) =>
          p === null ? (
            <span key={`gap-${i}`} className="px-1 text-slate" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => p !== page && onChange(p)}
              className={`tnum ${step} ${
                p === page ? 'border-navy-900 bg-navy-900 text-cream' : idle
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className={`${step} ${idle}`}
          disabled={page >= lastPage}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
        >
          Next ›
        </button>
      </div>
    </nav>
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
  // One row open at a time; the reference of the row whose form answers show.
  const [expanded, setExpanded] = useState<string | null>(null)
  // The reference being sent to the Google Form again, so its button waits.
  const [resending, setResending] = useState<string | null>(null)
  const toast = useToast()
  // The reference whose full record is open, and the one being deleted.
  const [viewing, setViewing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function remove(row: Row) {
    const fromForm = row.source === 'google_form'
    const ok = window.confirm(
      `Delete ${row.fullName} (${row.reference}) from this list?` +
        (fromForm
          ? '\n\nThis only removes it here. It stays in the Google Form, and would come back if the form were told to send everything again — delete it there too to remove it for good.'
          : ''),
    )
    if (!ok) return
    setDeleting(row.reference)
    try {
      await adminApi.del(`/admin/registrations/${encodeURIComponent(row.reference)}`)
      toast.success(`${row.reference} deleted.`)
      setReloads((n) => n + 1)
    } catch (e) {
      toast.error(reachable(e))
    } finally {
      setDeleting(null)
    }
  }

  async function resend(reference: string) {
    setResending(reference)
    try {
      await adminApi.post(`/admin/registrations/${encodeURIComponent(reference)}/google`)
      toast.success(`${reference} is now in the Google Form.`)
    } catch (e) {
      toast.error(reachable(e))
    } finally {
      setResending(null)
      setReloads((n) => n + 1)
    }
  }
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
  // Where a page change scrolls back to: the top of the list, not the page.
  const listTop = useRef<HTMLDivElement>(null)

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
              perPage: prev?.meta.perPage ?? 25,
              capacity: 0,
              edition: edition ?? 0,
              editions: prev?.meta.editions ?? [],
              editionTotal: 0,
              timezone: prev?.meta.timezone ?? 'UTC',
              handoff: prev?.meta.handoff ?? false,
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
      <GoogleFormCard />
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
            placeholder="Name, email, phone, organisation or reference"
          />
        </div>
      </div>

      <div ref={listTop} className="scroll-mt-20" />
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
          <table className="w-full min-w-[54rem] text-left text-small">
            <thead className="border-b border-hair bg-cream-deep">
              <tr className="text-micro uppercase tracking-[0.1em] text-slate">
                <th className="px-3 py-2 font-semibold">Reference</th>
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Contact</th>
                <th className="px-3 py-2 font-semibold">Organisation</th>
                <th className="px-3 py-2 font-semibold">Dietary</th>
                <th className="px-3 py-2 font-semibold">Registered</th>
                <th className="px-3 py-2 font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {page.data.map((row) => {
                const answers = Object.entries(row.answers ?? {})
                const open = expanded === row.reference
                return (
                  <Fragment key={row.reference}>
                    <tr className={open ? 'border-b-0' : 'border-b border-hair last:border-0'}>
                      <td className="tnum whitespace-nowrap px-3 py-2 font-semibold text-navy-900">
                        {row.reference}
                        {row.source === 'website' && !row.confirmationSent && (
                          <span
                            title="The confirmation email did not send"
                            className="ml-1.5 text-red-600"
                          >
                            !
                          </span>
                        )}
                        {row.source === 'google_form' && (
                          <span className="mt-0.5 block text-micro font-normal text-slate">
                            Google Form
                          </span>
                        )}
                        {meta?.handoff && row.source === 'website' && !row.inGoogleForm && (
                          <span className="mt-1 block font-normal">
                            <span className="block text-micro text-red-700">Not in Google Form</span>
                            <button
                              type="button"
                              disabled={resending === row.reference}
                              onClick={() => resend(row.reference)}
                              className="text-micro font-semibold text-gold-700 underline decoration-gold-500/40 underline-offset-2 hover:text-navy-900 disabled:opacity-50"
                            >
                              {resending === row.reference ? 'Sending…' : 'Send again'}
                            </button>
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-navy-900">
                        {row.fullName}
                        <span className="block text-micro text-slate">{row.designation}</span>
                        {answers.length > 0 && (
                          <button
                            type="button"
                            aria-expanded={open}
                            onClick={() => setExpanded(open ? null : row.reference)}
                            className="mt-1 text-micro font-semibold text-gold-700 underline decoration-gold-500/40 underline-offset-2 hover:text-navy-900"
                          >
                            {open ? 'Hide answers' : 'Chevening details'}
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-2 text-navy-800">
                        {row.email ? (
                          <a href={`mailto:${row.email}`} className="underline decoration-hair">
                            {row.email}
                          </a>
                        ) : (
                          <span className="text-slate">No email</span>
                        )}
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
                      <td className="whitespace-nowrap px-3 py-2 text-right">
                        <div className="inline-flex gap-1">
                          <AdminButton variant="quiet" onClick={() => setViewing(row.reference)}>
                            View
                          </AdminButton>
                          <AdminButton
                            variant="danger"
                            disabled={deleting === row.reference}
                            onClick={() => remove(row)}
                          >
                            {deleting === row.reference ? 'Deleting…' : 'Delete'}
                          </AdminButton>
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-b border-hair bg-cream/60 last:border-0">
                        <td />
                        <td colSpan={6} className="px-3 pb-4 pt-1">
                          <dl className="grid max-w-3xl gap-x-6 gap-y-2 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
                            {answers.map(([question, answer]) => (
                              <Fragment key={question}>
                                <dt className="text-micro text-slate">{question}</dt>
                                <dd className="whitespace-pre-line text-navy-900">{answer}</dd>
                              </Fragment>
                            ))}
                          </dl>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.lastPage > 1 && (
        <Pagination
          page={meta.page}
          lastPage={meta.lastPage}
          perPage={meta.perPage}
          total={meta.total}
          onChange={(p) => {
            setCurrent(p)
            setExpanded(null)
            // The controls sit under a long table; without this the next page
            // opens at its last row.
            listTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
        />
      )}

      <p className="mt-6 text-micro text-slate">
        This list is personal data under the PDPA. Export it only when you need to, and delete
        copies once the event is over.
      </p>
      {viewing && (
        <RegistrationView
          reference={viewing}
          timezone={meta?.timezone}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  )
}

interface Detail {
  reference: string
  source: 'website' | 'google_form'
  fullName: string
  email: string | null
  mobile: string
  organisation: string
  designation: string
  dietary: string | null
  submittedAt: string | null
  confirmationSent: boolean
  pdpaAccepted: boolean | null
  inGoogleForm: boolean
  answers: Record<string, string> | null
}

/** One registration in full, over the list. Escape or the backdrop closes it. */
function RegistrationView({
  reference,
  timezone,
  onClose,
}: {
  reference: string
  timezone?: string
  onClose: () => void
}) {
  const [detail, setDetail] = useState<Detail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminApi
      .get<Detail>(`/admin/registrations/${encodeURIComponent(reference)}`)
      .then(setDetail)
      .catch((e) => setError(reachable(e)))
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [reference, onClose])

  const rows: [string, string][] = detail
    ? [
        ['Reference', detail.reference],
        ['Registered through', detail.source === 'google_form' ? 'Google Form' : 'This website'],
        [
          'Registered on',
          detail.submittedAt
            ? new Date(detail.submittedAt).toLocaleString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                timeZone: timezone,
              })
            : '—',
        ],
        ['Full name', detail.fullName || '—'],
        ['Email', detail.email || '—'],
        ['Mobile', detail.mobile || '—'],
        ['Organisation', detail.organisation || '—'],
        ['Designation', detail.designation || '—'],
        ['Dietary', detail.dietary || '—'],
        ...(detail.source === 'website'
          ? ([
              ['Confirmation email', detail.confirmationSent ? 'Sent' : 'Not sent'],
              ['PDPA consent', detail.pdpaAccepted ? 'Given' : '—'],
              ['In the Google Form', detail.inGoogleForm ? 'Yes' : 'No'],
            ] as [string, string][])
          : []),
        ...Object.entries(detail.answers ?? {}),
      ]
    : []

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Registration ${reference}`}
      className="fixed inset-0 z-50 grid place-items-center bg-navy-950/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-sm bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[1rem] font-semibold text-navy-950">
            {detail?.fullName || reference}
          </h2>
          <AdminButton variant="quiet" onClick={onClose}>
            Close
          </AdminButton>
        </div>

        {error && <p className="mt-4 text-small text-red-700">{error}</p>}
        {!detail && !error && <p className="mt-4 text-small text-slate">Loading…</p>}

        {detail && (
          <dl className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
            {rows.map(([label, value]) => (
              <Fragment key={label}>
                <dt className="text-[0.78rem] text-slate">{label}</dt>
                <dd className="whitespace-pre-line break-words text-[0.88rem] text-navy-950">{value}</dd>
              </Fragment>
            ))}
          </dl>
        )}
      </div>
    </div>
  )
}
