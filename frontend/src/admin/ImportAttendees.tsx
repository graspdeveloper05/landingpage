import { useState } from 'react'
import { adminApi, AdminError } from './client'
import { AdminButton, AdminCard, Notice } from './ui'

/** The file's columns, in the templates' order: [column, required, what to enter]. */
const COLUMNS: [string, boolean, string][] = [
  ['name', true, 'Full name'],
  ['email', true, 'One registration per email; already registered emails are skipped'],
  ['mobile', true, 'Any format, e.g. +60 12 345 6789 or 012-345 6789'],
  ['organisation', true, 'Organisation or ministry'],
  ['designation', true, 'Job title'],
  ['chevening_scholar', false, 'Yes or No'],
  ['chevening_cohort', false, 'e.g. 2019/20'],
  ['chevening_university', false, 'University under the Chevening scholarship'],
  ['cam_member', false, 'Yes or No'],
  ['arrived', false, 'Yes marks them arrived now; leave blank otherwise'],
]

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
          Add people who did not register on the website, such as ministry staff, from an Excel or
          CSV file.
        </p>

        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[0.78rem] text-navy-900">
          <li>
            <span className="font-semibold">Download a template</span> below: Excel or CSV. The
            first row holds the column names; keep it as it is.
          </li>
          <li>
            <span className="font-semibold">Fill in one person per row</span> under the column
            names. Name, email, mobile, organisation and designation are required; the rest may be
            left blank (see the table).
          </li>
          <li>
            <span className="font-semibold">Save the file</span> as Excel (.xlsx) or CSV. Phone
            numbers that lose their leading 0 in Excel are fixed on import.
          </li>
          <li>
            <span className="font-semibold">Choose the file</span> with the button below, then click{' '}
            <span className="font-semibold">Import</span>.
          </li>
          <li>
            <span className="font-semibold">Check the summary:</span> how many were added, how many
            were skipped because their email is already registered, and any rows to fix. Fix those
            rows and import the file again; people already added are skipped, not duplicated.
          </li>
        </ol>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[30rem] text-left text-[0.74rem]">
            <thead className="text-slate">
              <tr className="border-b border-[#EEEDEA]">
                <th className="py-1 pr-3 font-semibold">Column</th>
                <th className="py-1 pr-3 font-semibold">Required</th>
                <th className="py-1 font-semibold">What to enter</th>
              </tr>
            </thead>
            <tbody className="text-navy-900">
              {COLUMNS.map(([column, required, help]) => (
                <tr key={column} className="border-b border-[#F4F3F0] last:border-0">
                  <td className="py-1 pr-3 font-mono">{column}</td>
                  <td className="py-1 pr-3">{required ? 'Yes' : 'Optional'}</td>
                  <td className="py-1 text-slate">{help}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Blank templates to fill in, and one filled in to show the shape. */}
        <div className="mt-3 flex flex-wrap gap-2">
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
