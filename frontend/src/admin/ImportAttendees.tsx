import { useState } from 'react'
import { adminApi, AdminError } from './client'
import { AdminButton, AdminCard, Notice } from './ui'

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
export function ImportAttendees({ onImported }: { onImported: () => void }) {
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
          columns name, email, mobile, organisation and designation. Optional columns:
          chevening_scholar (Yes/No), chevening_cohort, chevening_university, cam_member (Yes/No),
          and arrived (yes marks them arrived; otherwise they are not). Emails already registered are
          skipped.
        </p>
        {/* Blank templates to fill in, and one filled in to show the shape. */}
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href="/samples/attendees-template.xlsx"
            download
            className="inline-flex min-h-[34px] items-center rounded-sm border border-[#DDDCD8] bg-white px-3 text-[0.78rem] font-semibold text-navy-900 hover:border-navy-600"
          >
            Download Excel template
          </a>
          <a
            href="/samples/attendees-template.csv"
            download
            className="inline-flex min-h-[34px] items-center rounded-sm border border-[#DDDCD8] bg-white px-3 text-[0.78rem] font-semibold text-navy-900 hover:border-navy-600"
          >
            Download CSV template
          </a>
          <a
            href="/samples/attendees-import.csv"
            download
            className="inline-flex min-h-[34px] items-center px-1 text-[0.78rem] font-semibold text-slate underline underline-offset-4 hover:text-navy-900"
          >
            See an example
          </a>
        </div>
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
