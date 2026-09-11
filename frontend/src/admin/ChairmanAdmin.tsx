import { useEffect, useState } from 'react'
import {
  adminApi,
  AdminError,
  EMPTY_LOCALIZED,
  reachable,
  type Locale,
  type Localized,
} from './client'
import { AdminButton, AdminCard, AdminField, LocalizedFieldset, Notice } from './ui'
import { useToast } from './Toast'
import { SkeletonForm } from './Loading'
import { isPlaceholderPortrait, portraitSrc } from '@/lib/portrait'

interface ChairmanForm {
  name: string
  organisation: string
  designation: Localized
  message: Localized
  quote: Localized
  /** '' means no photograph yet; the site draws its own stand-in. */
  portrait: string
}

const BLANK: ChairmanForm = {
  name: '',
  organisation: '',
  designation: { ...EMPTY_LOCALIZED },
  message: { ...EMPTY_LOCALIZED },
  quote: { ...EMPTY_LOCALIZED },
  portrait: '',
}

/**
 * §6 item 03 — the Organising Chairman.
 *
 * His own section rather than a card on the Event page. He is a person with a
 * photograph and a letter, which is the shape of the Speakers screen and not
 * of a form about dates and seat counts — and sharing that form meant the
 * event could not be saved without also sending a whole chairman.
 */
export function ChairmanAdmin() {
  const [form, setForm] = useState<ChairmanForm | null>(null)
  const [edition, setEdition] = useState<number | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const load = () => {
    setError(null)
    return adminApi
      .get<{ chairman: ChairmanForm | null; edition: number }>('/admin/chairman')
      .then((r) => {
        // Null on an edition nobody has edited. The site falls back to the
        // bundled record then, and this form opens empty rather than showing
        // values that are not actually stored.
        setForm(r.chairman ?? BLANK)
        setEdition(r.edition)
      })
      .catch((e) => {
        setForm(BLANK)
        setError(reachable(e))
      })
  }

  useEffect(() => {
    load()
  }, [])

  const set = <K extends keyof ChairmanForm>(key: K, value: ChairmanForm[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f))

  const localeErrors = (prefix: string) =>
    Object.fromEntries(
      Object.entries(fieldErrors)
        .filter(([k]) => k.startsWith(`${prefix}.`))
        .map(([k, v]) => [k.slice(prefix.length + 1), v]),
    ) as Partial<Record<Locale, string>>

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setBusy(true)
    setError(null)
    setFieldErrors({})
    try {
      // Spread into a plain object: the transport takes an index-signature
      // Record, and a typed interface does not satisfy one.
      await adminApi.put('/admin/chairman', { ...form })
      toast.success('Saved. The site shows the new details immediately.')
      load()
    } catch (err) {
      if (err instanceof AdminError) {
        setFieldErrors(err.fields)
        setError(
          Object.keys(err.fields).length > 0
            ? 'Some fields need attention — see below.'
            : err.message,
        )
      } else {
        setError('Could not save.')
      }
    } finally {
      setBusy(false)
    }
  }

  if (!form) return <SkeletonForm />

  return (
    <form onSubmit={save}>
      {edition !== null && (
        <p className="mb-4 text-[0.72rem] text-slate">
          Edition <strong className="text-navy-900">{edition}</strong> · shown on the home page,
          between the theme and the speakers.
        </p>
      )}

      {error && (
        <div className="mb-4">
          <Notice kind="error">{error}</Notice>
        </div>
      )}

      {/*
        Columns that size to their own content. A stretched card makes every
        AdminField inside it push its input to the bottom — see the note in
        ui.tsx.
      */}
      <div className="grid items-start gap-5 lg:grid-cols-12">
        {/* The photograph gets its own column. It is the one thing here that
            is not typed, and it is what the team comes to this screen to
            change once the real chairman is confirmed. */}
        <AdminCard className="lg:col-span-4">
          <PortraitField
            value={form.portrait}
            onChange={(v) => set('portrait', v)}
            error={fieldErrors.portrait}
          />
        </AdminCard>

        <div className="space-y-5 lg:col-span-8">
          <AdminCard className="space-y-4">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate">
              Who he is
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField
                label="Name"
                value={form.name}
                onChange={(v) => set('name', v)}
                error={fieldErrors.name}
                placeholder="Dato’ Rahman bin Abdullah"
              />
              <AdminField
                label="Organisation"
                value={form.organisation}
                onChange={(v) => set('organisation', v)}
                error={fieldErrors.organisation}
                placeholder="Chevening Alumni Malaysia"
              />
            </div>

            <LocalizedFieldset
              label="Designation"
              value={form.designation}
              onChange={(v) => set('designation', v)}
              errors={localeErrors('designation')}
              hint="For example: Organising Chairman, Seri Negara Dialogue 2026"
            />
          </AdminCard>

          <AdminCard className="space-y-4">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate">
              What he says
            </p>

            <LocalizedFieldset
              label="Welcome message"
              value={form.message}
              onChange={(v) => set('message', v)}
              errors={localeErrors('message')}
              hint="The short letter beside the photograph. Two or three sentences."
              multiline
            />

            <LocalizedFieldset
              label="Pull quote"
              value={form.quote}
              onChange={(v) => set('quote', v)}
              errors={localeErrors('quote')}
              hint="Set large to the right of the letter. One sentence."
              multiline
            />
          </AdminCard>
        </div>
      </div>

      {/* Sticks to the foot, as on every other screen: this form is taller
          than the window, and a button below the fold is one nobody finds. */}
      <div className="sticky bottom-0 z-10 -mx-6 mt-5 flex items-center justify-end gap-3 border-t border-hair bg-white/95 px-6 py-3 backdrop-blur">
        <AdminButton type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </AdminButton>
      </div>
    </form>
  )
}

/**
 * The chairman's photograph.
 *
 * Uses the speakers' own upload endpoint and their 5:6 shape, so there is one
 * set of rules to explain rather than two, and one place where image handling
 * can be got wrong. Uploading happens immediately and Save stores the path,
 * so abandoning the form leaves an unused file rather than a changed site.
 */
function PortraitField({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  const [uploading, setUploading] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)
  const toast = useToast()

  async function upload(file: File) {
    setUploading(true)
    setFailed(null)
    try {
      const body = new FormData()
      body.append('portrait', file)
      const r = await adminApi.post<{ path: string }>('/admin/portraits', body)
      onChange(r.path)
      toast.success('Photograph uploaded. Save to put it on the site.')
    } catch (e) {
      // The field error names the actual dimension or format problem; the
      // generic message only says that something went wrong.
      setFailed(
        e instanceof AdminError ? (e.fields.portrait ?? e.message) : 'Could not upload that image.',
      )
    } finally {
      setUploading(false)
    }
  }

  const uploaded = Boolean(value) && !isPlaceholderPortrait(value)

  return (
    <div>
      <span className="block text-[0.78rem] font-semibold text-navy-900">Photograph</span>
      <span className="mt-0.5 block text-[0.7rem] leading-snug text-slate">
        Portrait shape, around 700 × 840. Head in the upper third.
      </span>

      {/* Shown at the shape the site uses, so a landscape crop or a face near
          the edge is obvious here rather than after saving. */}
      <img
        src={portraitSrc(value)}
        alt=""
        className="mt-3 aspect-[5/6] w-full max-w-[180px] rounded-sm border border-[#DDDCD8] object-cover"
      />

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0]
          // Cleared so the same file chosen twice after a failure still fires
          // a change event rather than looking inert.
          e.target.value = ''
          if (file) upload(file)
        }}
        className="mt-3 block w-full text-[0.78rem] text-navy-800 file:mr-3 file:cursor-pointer file:rounded-sm file:border-0 file:bg-navy-900 file:px-3 file:py-1.5 file:text-[0.75rem] file:font-semibold file:text-cream hover:file:bg-navy-800 disabled:cursor-not-allowed"
      />

      <p className="mt-1.5 text-[0.7rem] text-slate">
        {uploading
          ? 'Uploading…'
          : uploaded
            ? 'Using an uploaded photograph.'
            : 'No photograph yet — the site shows a stand-in.'}
      </p>

      {/* Offered only for a real photograph. The generated stand-in is nobody's
          likeness, so removing it would swap one placeholder for another. */}
      {uploaded && !uploading && (
        <AdminButton variant="quiet" className="mt-2" onClick={() => onChange('')}>
          Remove photograph
        </AdminButton>
      )}

      {(failed || error) && <p className="mt-1.5 text-[0.7rem] text-red-600">{failed ?? error}</p>}
    </div>
  )
}
