import { useEffect, useState } from 'react'
import { API_BASE } from '@/services/api'
import { adminApi, type AdminError } from './client'
import { AdminButton, AdminCard, AdminField, Notice } from './ui'

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

interface Page {
  data: Row[]
  meta: { total: number; page: number; lastPage: number; capacity: number }
}

/** §9 — the participant list, and the CSV the team files it with. */
export function RegistrationsAdmin() {
  const [page, setPage] = useState<Page | null>(null)
  const [search, setSearch] = useState('')
  const [current, setCurrent] = useState(1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Debounced: typing a name would otherwise fire a query per keystroke,
    // and the answers can arrive out of order and show the wrong list.
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ page: String(current) })
      if (search.trim()) params.set('search', search.trim())
      adminApi
        .get<Page>(`/admin/registrations/list?${params}`)
        .then(setPage)
        .catch((e: AdminError) => setError(e.message))
    }, 250)
    return () => clearTimeout(timer)
  }, [search, current])

  const meta = page?.meta

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-h3 font-semibold text-navy-900">Registrations</h1>
          {meta && (
            <p className="mt-1 text-small text-slate">
              <strong className="text-navy-900">{meta.total}</strong> of {meta.capacity} seats
              taken
              {meta.total >= meta.capacity && (
                <span className="ml-2 font-semibold text-red-700">— registration is closed</span>
              )}
            </p>
          )}
        </div>

        {/*
          A plain link, not a fetch-and-blob: the browser handles the download,
          the Content-Disposition filename survives, and a 200-row CSV never
          passes through JavaScript memory. The session cookie authenticates it.
        */}
        <a
          href={`${API_BASE}/api/admin/registrations`}
          className="inline-flex min-h-[40px] items-center rounded-sm bg-gold-500 px-4 text-small font-semibold uppercase tracking-[0.08em] text-navy-950 transition-colors hover:bg-gold-400"
        >
          Download CSV
        </a>
      </div>

      {error && (
        <div className="mb-4">
          <Notice kind="error">{error}</Notice>
        </div>
      )}

      <div className="mb-4 max-w-sm">
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

      {!page && <p className="text-small text-slate">Loading…</p>}

      {page && page.data.length === 0 && (
        <AdminCard>
          <p className="text-small text-slate">
            {search ? 'Nobody matches that search.' : 'No registrations yet.'}
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
