import { useCallback, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { cn } from '@/lib/cn'
import { API_BASE } from '@/services/api'
import { adminApi, AdminError, reachable, type AttendancePage, type AttendanceRow } from './client'
import { AdminButton, AdminCard, CopyText, Notice } from './ui'
import { useToast } from './Toast'
import { SkeletonRows } from './Loading'

type Filter = 'all' | 'arrived' | 'waiting'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Everyone' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'waiting', label: 'Not arrived' },
]

const time = (iso: string) =>
  new Date(iso).toLocaleString('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })

/** Arrivals on the day: who is in, who is still expected, and the door controls. */
export function AttendanceAdmin() {
  const [page, setPage] = useState<AttendancePage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [pageNo, setPageNo] = useState(1)
  const toast = useToast()

  const load = useCallback(() => {
    const query = new URLSearchParams({ filter, page: String(pageNo) })
    if (search.trim()) query.set('search', search.trim())
    return adminApi
      .get<AttendancePage>(`/admin/attendance?${query}`)
      .then((p) => {
        setPage(p)
        setError(null)
      })
      .catch((e) => setError(reachable(e)))
  }, [filter, pageNo, search])

  // A short pause after typing, so a search is not sent per keystroke.
  useEffect(() => {
    const timer = window.setTimeout(load, search ? 300 : 0)
    return () => window.clearTimeout(timer)
  }, [load, search])

  // Every ten seconds while on screen, so the count moves as people arrive.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden) load()
    }, 10000)
    return () => window.clearInterval(timer)
  }, [load])

  async function mark(row: AttendanceRow) {
    try {
      if (row.checkedInAt) {
        if (!confirm(`Undo ${row.fullName}'s check-in?`)) return
        await adminApi.del(`/admin/attendance/${row.reference}`)
      } else {
        await adminApi.post(`/admin/attendance/${row.reference}`)
        toast.success(`${row.fullName} checked in.`)
      }
      load()
    } catch (e) {
      toast.error(e instanceof AdminError ? e.message : 'Could not update that guest.')
    }
  }

  const meta = page?.meta
  const percent = meta && meta.registered ? Math.round((meta.arrived / meta.registered) * 100) : 0

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Registered" value={meta?.registered} />
        <Stat label="Arrived" value={meta?.arrived} accent />
        <Stat label="Arrived (%)" value={meta ? `${percent}%` : undefined} />
      </div>

      <Poster />

      <ImportAttendees onImported={load} />

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPageNo(1)
          }}
          placeholder="Name, email, phone, organisation or reference"
          aria-label="Search guests"
          className="block w-full max-w-sm rounded-sm border border-[#DDDCD8] bg-white px-2.5 py-1.5 text-[0.85rem] focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/35"
        />
        <div role="tablist" className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={filter === f.value}
              onClick={() => {
                setFilter(f.value)
                setPageNo(1)
              }}
              className={cn(
                'rounded-sm border px-2.5 py-1.5 text-[0.75rem] font-semibold',
                filter === f.value
                  ? 'border-navy-900 bg-navy-900 text-cream'
                  : 'border-[#DDDCD8] bg-white text-navy-800 hover:border-gold-500',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {/* A plain link so the browser performs the download, as on Registrations. */}
        <a
          href={`${API_BASE}/api/admin/attendance/export`}
          className="ml-auto inline-flex min-h-[34px] items-center rounded-sm border border-[#DDDCD8] bg-white px-3 text-[0.78rem] font-semibold text-navy-900 hover:border-navy-600"
        >
          Download CSV
        </a>
      </div>

      {error && (
        <div className="flex flex-wrap items-center gap-3">
          <Notice kind="error">{error}</Notice>
          <AdminButton variant="quiet" onClick={load}>
            Try again
          </AdminButton>
        </div>
      )}
      {!page && !error && <SkeletonRows count={6} />}

      {page && page.data.length === 0 && (
        <AdminCard>
          <p className="text-small text-slate">No guests match.</p>
        </AdminCard>
      )}

      {page && page.data.length > 0 && (
        <div className="overflow-x-auto rounded-sm border border-[#DDDCD8] bg-white">
          <table className="w-full min-w-[44rem] text-left text-[0.82rem]">
            <thead className="border-b border-[#DDDCD8] bg-[#FAFAF8] text-micro text-slate">
              <tr>
                <th className="px-3 py-2 font-semibold">Guest</th>
                <th className="px-3 py-2 font-semibold">Reference</th>
                <th className="px-3 py-2 font-semibold">Contact</th>
                <th className="px-3 py-2 font-semibold">Arrival</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {page.data.map((r) => (
                <tr key={r.reference} className="border-b border-[#EEEDEA] last:border-0">
                  <td className="px-3 py-2.5">
                    <span className="font-semibold text-navy-950">{r.fullName}</span>
                    {r.category === 'ministry_staff' && (
                      <span className="ml-2 rounded-full border border-navy-200 bg-navy-50 px-1.5 py-0.5 align-middle text-micro font-semibold text-navy-800">
                        Ministry staff
                      </span>
                    )}
                    {r.source === 'import' && (
                      <span className="ml-2 rounded-full border border-[#DDDCD8] px-1.5 py-0.5 align-middle text-micro font-semibold text-slate">
                        Imported
                      </span>
                    )}
                    {r.organisation && (
                      <span className="block text-micro text-slate">{r.organisation}</span>
                    )}
                  </td>
                  <td className="tnum px-3 py-2.5 text-navy-800">
                    {r.reference && <CopyText text={r.reference} />}
                  </td>
                  <td className="px-3 py-2.5 text-slate">
                    {r.email}
                    {r.mobile && <span className="block">{r.mobile}</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    {r.checkedInAt ? (
                      <span className="text-green-800">
                        <span className="font-semibold">✓ {time(r.checkedInAt)}</span>
                        <span className="block text-micro text-slate">
                          {r.checkedInVia === 'staff' ? 'By staff' : 'QR poster'}
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate">Not arrived</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {r.checkedInAt ? (
                      <AdminButton variant="quiet" onClick={() => mark(r)}>
                        Undo
                      </AdminButton>
                    ) : (
                      <AdminButton variant="success" onClick={() => mark(r)}>
                        Mark arrived
                      </AdminButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.lastPage > 1 && (
        <div className="flex items-center justify-between gap-3 text-[0.78rem] text-slate">
          <span>
            Page {meta.page} of {meta.lastPage} · {meta.total} guests
          </span>
          <div className="flex gap-1">
            <AdminButton
              variant="quiet"
              disabled={meta.page <= 1}
              onClick={() => setPageNo(meta.page - 1)}
            >
              Previous
            </AdminButton>
            <AdminButton
              variant="quiet"
              disabled={meta.page >= meta.lastPage}
              onClick={() => setPageNo(meta.page + 1)}
            >
              Next
            </AdminButton>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value?: number | string
  accent?: boolean
}) {
  return (
    <AdminCard>
      <p className="text-micro text-slate">{label}</p>
      <p
        className={cn(
          'tnum mt-1 text-[1.6rem] font-semibold',
          accent ? 'text-green-800' : 'text-navy-950',
        )}
      >
        {value ?? '—'}
      </p>
    </AdminCard>
  )
}

/** The QR code for the poster at the entrance. */
function Poster() {
  const url = `${window.location.origin}/checkin`
  const [src, setSrc] = useState<string | null>(null)
  const toast = useToast()

  useEffect(() => {
    QRCode.toDataURL(url, { width: 960, margin: 1, color: { dark: '#0B2140', light: '#FFFFFF' } })
      .then(setSrc)
      .catch(() => setSrc(null))
  }, [url])

  return (
    <AdminCard className="flex flex-wrap items-center gap-4">
      {src && (
        <img
          src={src}
          alt={`QR code for ${url}`}
          className="h-32 w-32 rounded-sm border border-hair"
        />
      )}
      <div className="min-w-[12rem] flex-1 space-y-2">
        <p className="text-[0.85rem] font-semibold text-navy-950">Poster for the entrance</p>
        <p className="break-all text-small text-slate">{url}</p>
        <div className="flex flex-wrap gap-2">
          <AdminButton
            variant="quiet"
            onClick={() =>
              navigator.clipboard.writeText(url).then(
                () => toast.success('Link copied.'),
                () => toast.error('Could not copy. Select the link instead.'),
              )
            }
          >
            Copy link
          </AdminButton>
          {src && (
            <a
              href={src}
              download="checkin-qr.png"
              className="inline-flex min-h-[34px] items-center rounded-sm border border-[#DDDCD8] bg-white px-3 text-[0.78rem] font-semibold text-navy-900 hover:border-navy-600"
            >
              Download QR
            </a>
          )}
        </div>
      </div>
    </AdminCard>
  )
}

interface ImportResult {
  added: number
  skipped: number
  errors: { row: number; message: string }[]
}

/**
 * Bulk-adds attendees who did not register on the website (e.g. ministry
 * staff) from a CSV or Excel file. They are marked Imported, are not held to
 * the seat limit, and are not arrived unless the file says so.
 */
function ImportAttendees({ onImported }: { onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function upload() {
    if (!file) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const body = new FormData()
      body.append('file', file)
      setResult(await adminApi.post<ImportResult>('/admin/attendance/import', body))
      onImported()
    } catch (e) {
      setError(
        e instanceof AdminError ? (e.fields.file ?? e.message) : 'Could not upload that file.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminCard className="space-y-3">
      <div>
        <p className="text-[0.85rem] font-semibold text-navy-950">Import attendees</p>
        <p className="text-micro text-slate">
          Add people who did not register on the website from a CSV or Excel (.xlsx) file, with the
          columns name, email, mobile, organisation and designation. An optional “category” column
          takes Participant (the default) or Ministry staff. An optional “arrived” column set to yes
          marks them arrived; otherwise they are not. Emails already registered are skipped.{' '}
          <a href="/samples/attendees-import.csv" download className="font-semibold underline">
            Download sample CSV
          </a>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null)
            setResult(null)
            setError(null)
          }}
          className="text-[0.8rem] file:mr-3 file:rounded-sm file:border file:border-[#DDDCD8] file:bg-white file:px-3 file:py-1.5 file:text-[0.78rem] file:font-semibold file:text-navy-900"
        />
        <AdminButton onClick={upload} disabled={!file || busy}>
          {busy ? 'Importing…' : 'Import'}
        </AdminButton>
      </div>

      {error && <Notice kind="error">{error}</Notice>}

      {result && (
        <div className="space-y-2">
          <Notice kind="success">
            Added {result.added}. Skipped {result.skipped} already registered.
            {result.errors.length > 0 && ` ${result.errors.length} rows need fixing.`}
          </Notice>
          {result.errors.length > 0 && (
            <ul className="max-h-48 space-y-1 overflow-y-auto text-micro text-red-700">
              {result.errors.map((e) => (
                <li key={e.row}>
                  Row {e.row}: {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </AdminCard>
  )
}
