import { useEffect, useState } from 'react'
import { AdminError, adminApi, reachable } from './client'
import { AdminButton, AdminCard, AdminField } from './ui'
import { useToast } from './Toast'

interface Setting {
  url: string | null
  /** How many of the site's answers the server matched on the form. */
  matched: number
}

/**
 * The Google Form every registration is copied into.
 *
 * Saving reads the form from Google and checks the site can fill it in; if
 * not, the reason is shown against the link and nothing changes. So when the
 * organising team moves to a new form, or rebuilds a question on this one,
 * pasting the link here again is the whole fix.
 */
export function GoogleFormCard() {
  const toast = useToast()
  const [saved, setSaved] = useState<Setting | null>(null)
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    adminApi
      .get<Setting>('/admin/google-form')
      .then((s) => {
        setSaved(s)
        setUrl(s.url ?? '')
      })
      .catch((e) => setError(reachable(e)))
  }, [])

  async function save() {
    setBusy(true)
    setError(null)
    try {
      const s = await adminApi.put<Setting>('/admin/google-form', { url: url.trim() || null })
      setSaved(s)
      setUrl(s.url ?? '')
      toast.success(
        s.url
          ? 'Connected. New registrations are copied into this Google Form.'
          : 'Copying to Google Forms is off. Registrations are still saved here.',
      )
    } catch (e) {
      setError(e instanceof AdminError && e.fields.url ? e.fields.url : reachable(e))
    } finally {
      setBusy(false)
    }
  }

  const changed = saved !== null && url.trim() !== (saved.url ?? '')

  return (
    <AdminCard className="mb-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[16rem] flex-1">
          <AdminField
            label="Google Form"
            value={url}
            onChange={setUrl}
            error={error ?? undefined}
            placeholder="https://forms.gle/…"
            hint="Every registration is also copied into this form. Paste its responder link (Publish → copy link). If the form changes, paste the link again. Leave empty to stop copying."
            disabled={saved === null}
          />
        </div>
        <AdminButton onClick={save} disabled={busy || !changed}>
          {busy ? 'Checking the form…' : 'Save'}
        </AdminButton>
      </div>
      {saved && !changed && !error && (
        <p className="mt-2 text-[0.78rem] text-slate">
          {saved.url ? (
            <>
              <span className="font-semibold text-green-700">Connected</span> · all {saved.matched} questions matched
            </>
          ) : (
            'Not copying to Google Forms.'
          )}
        </p>
      )}
    </AdminCard>
  )
}
