import { useEffect, useState } from 'react'
import { AdminError, adminApi, reachable } from './client'
import { AdminButton, AdminCard, AdminField } from './ui'
import { useToast } from './Toast'

type Mode = 'site' | 'google'

interface Setting {
  url: string | null
  /** Which form the Register buttons open. */
  mode: Mode
  /** How many of the site's answers the server matched on the form. */
  matched: number
  /** The script's web app, which adds site registrations to the form. */
  webapp: string | null
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
  const [mode, setMode] = useState<Mode>('site')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [script, setScript] = useState<string | null>(null)
  const [webapp, setWebapp] = useState('')
  const [webappError, setWebappError] = useState<string | null>(null)
  const [webappBusy, setWebappBusy] = useState(false)

  async function saveWebapp() {
    setWebappBusy(true)
    setWebappError(null)
    try {
      // The web app link alone: sending the form's link too would re-read the
      // form from Google, which has nothing to do with this and can fail.
      const s = await adminApi.put<Setting>('/admin/google-form', {
        webapp: webapp.trim() || null,
      })
      setSaved(s)
      setWebapp(s.webapp ?? '')
      toast.success(
        s.webapp
          ? 'Saved. Registrations made here are now added to the Google Form.'
          : 'Saved. Registrations are no longer handed to the Google Form.',
      )
    } catch (e) {
      setWebappError(e instanceof AdminError && e.fields.webapp ? e.fields.webapp : reachable(e))
    } finally {
      setWebappBusy(false)
    }
  }
  const [scriptBusy, setScriptBusy] = useState(false)

  async function showScript(reissue = false) {
    if (script && !reissue) {
      setScript(null)

      return
    }

    setScriptBusy(true)
    try {
      const { script } = await adminApi.get<{ script: string }>(
        `/admin/google-form/script${reissue ? '?reissue=1' : ''}`,
      )
      setScript(script)
      if (reissue) toast.success('New key issued. The old script stops working.')
    } catch (e) {
      toast.error(reachable(e))
    } finally {
      setScriptBusy(false)
    }
  }

  useEffect(() => {
    adminApi
      .get<Setting>('/admin/google-form')
      .then((s) => {
        setSaved(s)
        setUrl(s.url ?? '')
        setMode(s.mode)
        setWebapp(s.webapp ?? '')
      })
      .catch((e) => setError(reachable(e)))
  }, [])

  async function save() {
    setBusy(true)
    setError(null)
    try {
      const s = await adminApi.put<Setting>('/admin/google-form', {
        url: url.trim() || null,
        mode,
      })
      setSaved(s)
      setUrl(s.url ?? '')
      setMode(s.mode)
      toast.success(
        s.mode === 'google'
          ? 'Saved. Register buttons now open the Google Form.'
          : s.url
            ? 'Saved. Registrations are taken here and copied into the Google Form.'
            : 'Saved. Registrations are taken here only.',
      )
    } catch (e) {
      const fields = e instanceof AdminError ? e.fields : {}
      setError(fields.url ?? fields.mode ?? reachable(e))
    } finally {
      setBusy(false)
    }
  }

  const changed = saved !== null && (url.trim() !== (saved.url ?? '') || mode !== saved.mode)

  return (
    <AdminCard className="mb-6">
      <fieldset className="mb-5">
        <legend className="text-[0.78rem] font-semibold text-navy-900">Where people register</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <ModeChoice
            checked={mode === 'site'}
            onSelect={() => setMode('site')}
            title="On this website"
            note="People fill in the site's own form. It is saved here, they get a confirmation email, and a copy goes into the Google Form below."
          />
          <ModeChoice
            checked={mode === 'google'}
            onSelect={() => setMode('google')}
            title="On the Google Form"
            note="Every Register button opens the Google Form instead. Choose this when the form asks something this site does not. Registrations then appear only in the form's own responses."
          />
        </div>
      </fieldset>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[16rem] flex-1">
          <AdminField
            label="Google Form"
            value={url}
            onChange={setUrl}
            error={error ?? undefined}
            placeholder="https://forms.gle/…"
            hint="Paste the form's responder link (Publish → copy link). Paste it again whenever the form's questions change. Leave empty to stop using it."
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
              <span className="font-semibold text-green-700">Connected</span> · all {saved.matched}{' '}
              questions matched ·{' '}
              {saved.mode === 'google'
                ? 'Register buttons open this form'
                : 'registrations here are copied into it'}
            </>
          ) : (
            'No Google Form. Registrations are taken on this website only.'
          )}
        </p>
      )}
      <div className="mt-5 border-t border-[#DDDCD8] pt-4">
        <p className="text-[0.78rem] font-semibold text-navy-900">
          Bring the form's own responses into this panel
        </p>
        <p className="mt-1 max-w-[46rem] text-[0.76rem] leading-snug text-slate">
          People who fill in the Google Form directly do not appear here. A short script on the
          form sends them over — the responses it already holds, and each new one as it arrives.
          Someone who can edit the form pastes it in once.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <AdminButton variant="quiet" onClick={() => showScript()} disabled={scriptBusy}>
            {scriptBusy ? 'Preparing…' : script ? 'Hide the script' : 'Show the script'}
          </AdminButton>
          {script && (
            <>
              <AdminButton
                variant="quiet"
                onClick={() => {
                  navigator.clipboard?.writeText(script)
                  toast.success('Script copied. Send it to whoever edits the form.')
                }}
              >
                Copy
              </AdminButton>
              <AdminButton variant="danger" onClick={() => showScript(true)} disabled={scriptBusy}>
                Issue a new key
              </AdminButton>
            </>
          )}
        </div>

        {script && (
          <>
            <ol className="mt-3 max-w-[46rem] list-decimal space-y-1 pl-5 text-[0.76rem] leading-snug text-slate">
              <li>Open the Google Form for editing, then ⋮ (top right) → Apps Script.</li>
              <li>Delete anything in the editor, paste this script, and click Save.</li>
              <li>
                Choose <strong>setup</strong> in the function list and click Run, then allow the
                permissions Google asks for.
              </li>
              <li>The log says “Ready”. Responses appear in this list within seconds.</li>
            </ol>
            <textarea
              readOnly
              value={script}
              onFocus={(e) => e.currentTarget.select()}
              className="mt-3 h-52 w-full rounded-sm border border-[#DDDCD8] bg-[#FBFAF8] p-3 font-mono text-[0.72rem] leading-snug text-navy-950"
            />
            <p className="mt-1 text-[0.72rem] text-slate">
              The key in this script lets the form add registrations here, so send it to the form's
              owner rather than posting it publicly. “Issue a new key” stops an old copy working.
            </p>
          </>
        )}

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[16rem] flex-1">
            <AdminField
              label="Web app link"
              value={webapp}
              onChange={setWebapp}
              error={webappError ?? undefined}
              placeholder="https://script.google.com/macros/s/…/exec"
              hint="From the script: Deploy → New deployment → Web app (Execute as: Me, Access: Anyone). With it, registrations made on this website are added to the Google Form."
              disabled={saved === null}
            />
          </div>
          <AdminButton
            onClick={saveWebapp}
            disabled={webappBusy || saved === null || webapp.trim() === (saved?.webapp ?? '')}
          >
            {webappBusy ? 'Saving…' : 'Save'}
          </AdminButton>
        </div>
        {saved?.webapp && webapp.trim() === saved.webapp && !webappError && (
          <p className="mt-2 text-[0.78rem] text-slate">
            <span className="font-semibold text-green-700">Connected</span> · registrations made here are
            added to the Google Form
          </p>
        )}
      </div>
    </AdminCard>
  )
}

/** One of the two places people can register. */
function ModeChoice({
  checked,
  onSelect,
  title,
  note,
}: {
  checked: boolean
  onSelect: () => void
  title: string
  note: string
}) {
  return (
    <label
      className={
        'flex cursor-pointer gap-3 rounded-sm border p-3 transition-colors ' +
        (checked ? 'border-gold-500 bg-gold-500/10' : 'border-[#DDDCD8] hover:border-navy-600/40')
      }
    >
      <input
        type="radio"
        name="registration-mode"
        checked={checked}
        onChange={onSelect}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#C9A227]"
      />
      <span>
        <span className="block text-[0.85rem] font-semibold text-navy-950">{title}</span>
        <span className="mt-0.5 block text-[0.76rem] leading-snug text-slate">{note}</span>
      </span>
    </label>
  )
}
