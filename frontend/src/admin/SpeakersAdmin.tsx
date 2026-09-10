import { useEffect, useRef, useState } from 'react'
import {
  adminApi,
  AdminError,
  EMPTY_LOCALIZED,
  reachable,
  type AdminSpeaker,
  type Locale,
} from './client'
import { AdminButton, AdminCard, AdminField, LocalizedFieldset, Notice } from './ui'

/** §7 — speakers and the moderator, editable by the organising team. */
export function SpeakersAdmin() {
  const [list, setList] = useState<AdminSpeaker[] | null>(null)
  const [editing, setEditing] = useState<AdminSpeaker | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  /*
   * `list` stays null only while a load is genuinely in flight. A failure
   * must clear it to [] as well as setting the error -- otherwise the page
   * shows the error and "Loading..." underneath it forever, which reads as
   * the request still running when it has already given up.
   */
  const load = () => {
    setError(null)
    return adminApi
      .get<AdminSpeaker[]>('/admin/speakers')
      .then(setList)
      .catch((e) => {
        setList([])
        setError(reachable(e))
      })
  }

  useEffect(() => {
    load()
  }, [])

  async function remove(speaker: AdminSpeaker) {
    if (!confirm(`Remove ${speaker.name}? This cannot be undone.`)) return
    try {
      await adminApi.del(`/admin/speakers/${speaker.id}`)
      setSaved(`${speaker.name} removed.`)
      load()
    } catch (e) {
      setError(e instanceof AdminError ? e.message : 'Could not remove that speaker.')
    }
  }

  async function move(index: number, direction: -1 | 1) {
    if (!list) return
    const next = [...list]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]

    // Shown moved before the server confirms: reordering is a series of small
    // adjustments, and a list that jumps back after each click is unusable.
    setList(next)
    try {
      await adminApi.post('/admin/speakers/reorder', { ids: next.map((s) => s.id) })
    } catch {
      setError('Could not save the new order.')
      load()
    }
  }

  if (editing) {
    return (
      <SpeakerForm
        speaker={editing === 'new' ? null : editing}
        onCancel={() => setEditing(null)}
        onSaved={(name) => {
          setEditing(null)
          setSaved(`${name} saved.`)
          load()
        }}
      />
    )
  }

  return (
    <>
      {/* No page title here: the shell's top bar already names the page,
          and repeating it costs a whole row of a working screen. */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.78rem] text-slate">
          {list ? `${list.length} in the line-up` : ' '}
        </p>
        <AdminButton onClick={() => setEditing('new')}>Add speaker</AdminButton>
      </div>

      {error && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Notice kind="error">{error}</Notice>
          <AdminButton variant="quiet" onClick={load}>
            Try again
          </AdminButton>
        </div>
      )}
      {saved && (
        <div className="mb-4">
          <Notice kind="success">{saved}</Notice>
        </div>
      )}

      {!list && <p className="text-small text-slate">Loading…</p>}

      {list && list.length === 0 && !error && (
        <AdminCard>
          <p className="text-small text-slate">
            No speakers yet. Add the first one and it appears on the site immediately.
          </p>
        </AdminCard>
      )}

      <div className="space-y-3">
        {list?.map((speaker, i) => (
          <AdminCard key={speaker.id}>
            <div className="flex flex-wrap items-center gap-4">
              <img
                src={speaker.portrait}
                alt=""
                className="h-16 w-[3.4rem] shrink-0 rounded-sm border border-hair object-cover"
              />

              <div className="min-w-[12rem] flex-1">
                <p className="text-[0.88rem] font-semibold text-navy-950">
                  {speaker.name}
                  {speaker.role === 'moderator' && (
                    <span className="ml-2 rounded-sm bg-gold-500 px-1.5 py-0.5 text-micro font-semibold uppercase tracking-[0.1em] text-navy-950">
                      Moderator
                    </span>
                  )}
                  {speaker.placeholder && (
                    <span className="ml-2 rounded-sm border border-red-300 px-1.5 py-0.5 text-micro font-semibold uppercase tracking-[0.1em] text-red-700">
                      Placeholder
                    </span>
                  )}
                </p>
                <p className="text-small text-slate">
                  {speaker.designation.en} · {speaker.organisation}
                </p>
                {!speaker.link && (
                  <p className="mt-0.5 text-micro text-red-700">No official link yet</p>
                )}
              </div>

              <div className="flex items-center gap-1">
                <ArrowButton label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                  ↑
                </ArrowButton>
                <ArrowButton
                  label="Move down"
                  disabled={i === list.length - 1}
                  onClick={() => move(i, 1)}
                >
                  ↓
                </ArrowButton>
                <AdminButton variant="quiet" onClick={() => setEditing(speaker)}>
                  Edit
                </AdminButton>
                <AdminButton variant="danger" onClick={() => remove(speaker)}>
                  Remove
                </AdminButton>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>
    </>
  )
}

function ArrowButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  label: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="h-10 w-8 rounded-sm border border-hair text-navy-800 transition-colors hover:border-gold-500 disabled:opacity-30"
    >
      {children}
    </button>
  )
}

/* -------------------------------------------------------------------------- */

const BLANK: AdminSpeaker = {
  id: '',
  name: '',
  designation: { ...EMPTY_LOCALIZED },
  organisation: '',
  portrait: '',
  bio: { ...EMPTY_LOCALIZED },
  link: null,
  role: 'speaker',
  placeholder: false,
  sort_order: 0,
}

function SpeakerForm({
  speaker,
  onCancel,
  onSaved,
}: {
  speaker: AdminSpeaker | null
  onCancel: () => void
  onSaved: (name: string) => void
}) {
  const isNew = speaker === null
  const [form, setForm] = useState<AdminSpeaker>(speaker ?? BLANK)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const set = <K extends keyof AdminSpeaker>(key: K, value: AdminSpeaker[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  /** Pulls "designation.ta" style keys out into { ta: message }. */
  const localeErrors = (prefix: string) =>
    Object.fromEntries(
      Object.entries(fieldErrors)
        .filter(([k]) => k.startsWith(`${prefix}.`))
        .map(([k, v]) => [k.slice(prefix.length + 1) as Locale, v]),
    ) as Partial<Record<Locale, string>>

  async function upload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const body = new FormData()
      body.append('portrait', file)
      const r = await adminApi.post<{ path: string }>('/admin/portraits', body)
      set('portrait', r.path)
    } catch (e) {
      setError(
        e instanceof AdminError ? (e.fields.portrait ?? e.message) : 'Could not upload that image.',
      )
    } finally {
      setUploading(false)
      // Clearing the input matters: without it, choosing the same file after a
      // failed upload fires no change event and looks like nothing happened.
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setFieldErrors({})
    try {
      const payload = { ...form, link: form.link?.url ? form.link : null }
      if (isNew) await adminApi.post('/admin/speakers', payload)
      else await adminApi.put(`/admin/speakers/${form.id}`, payload)
      onSaved(form.name)
    } catch (e) {
      if (e instanceof AdminError) {
        setFieldErrors(e.fields)
        setError(
          Object.keys(e.fields).length > 0
            ? 'Some fields need attention — see below.'
            : e.message,
        )
      } else {
        setError('Could not save.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save}>
      <div className="mb-4">
        <h2 className="text-[0.95rem] font-semibold text-navy-950">
          {isNew ? 'Add speaker' : `Edit ${speaker.name}`}
        </h2>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* self-start stops the card stretching to match the tall form beside
            it, which left a column of empty white under a thumbnail. */}
        <AdminCard className="self-start lg:col-span-1">
          <p className="text-[0.78rem] font-semibold text-navy-900">Photograph</p>
          <p className="mt-0.5 text-[0.7rem] leading-snug text-slate">
            Portrait shape, around 700 × 840. Head in the upper third.
          </p>

          {/* A thumbnail, not a proof. It is here to confirm the right person
              and a sensible crop; at full column width it was 340px tall and
              pushed the fields it belongs with off the screen. */}
          {form.portrait ? (
            <img
              src={form.portrait}
              alt=""
              className="mt-2.5 aspect-[5/6] w-32 rounded-sm border border-[#DDDCD8] object-cover"
            />
          ) : (
            <div className="mt-2.5 grid aspect-[5/6] w-32 place-items-center rounded-sm border border-dashed border-[#DDDCD8] text-center text-[0.7rem] text-slate">
              No photograph
            </div>
          )}

          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) upload(file)
            }}
            className="mt-3 block w-full text-[0.7rem] file:mr-2 file:rounded-sm file:border-0 file:bg-navy-900 file:px-2.5 file:py-1.5 file:text-[0.7rem] file:font-semibold file:text-cream"
          />
          {uploading && <p className="mt-2 text-[0.7rem] text-slate">Uploading…</p>}
          {fieldErrors.portrait && (
            <p className="mt-2 text-[0.7rem] text-red-600">{fieldErrors.portrait}</p>
          )}
        </AdminCard>

        <AdminCard className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField
              label="Full name"
              value={form.name}
              onChange={(v) => set('name', v)}
              error={fieldErrors.name}
              hint="Personal names are never translated."
            />
            <AdminField
              label="Organisation"
              value={form.organisation}
              onChange={(v) => set('organisation', v)}
              error={fieldErrors.organisation}
            />
            <AdminField
              label="Id"
              value={form.id}
              onChange={(v) => set('id', v)}
              error={fieldErrors.id}
              // Changing an existing id would orphan anything referring to it.
              disabled={!isNew}
              hint={isNew ? 'Lowercase, e.g. sp-09' : 'Fixed once saved.'}
              placeholder="sp-09"
            />
            <label className="block">
              <span className="block text-small font-semibold text-navy-900">Role</span>
              <select
                value={form.role}
                onChange={(e) => set('role', e.target.value as AdminSpeaker['role'])}
                className="mt-1.5 block w-full rounded-sm border border-hair bg-white px-3 py-2 text-body text-navy-950 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
              >
                <option value="speaker">Speaker</option>
                <option value="moderator">Moderator</option>
              </select>
            </label>
          </div>

          <LocalizedFieldset
            label="Designation"
            value={form.designation}
            onChange={(v) => set('designation', v)}
            errors={localeErrors('designation')}
          />

          <LocalizedFieldset
            label="Short biography"
            value={form.bio}
            onChange={(v) => set('bio', v)}
            errors={localeErrors('bio')}
            multiline
          />

          <fieldset className="rounded-sm border border-hair bg-cream-deep/40 p-3">
            <legend className="px-1 text-small font-semibold text-navy-900">
              Official external link
            </legend>
            <p className="mb-2 text-micro text-slate">
              Opens in a new tab. Leave both blank if there is none.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminField
                label="Label"
                value={form.link?.label ?? ''}
                onChange={(v) => set('link', { label: v, url: form.link?.url ?? '' })}
                error={fieldErrors['link.label']}
                placeholder="Profile at Universiti Malaya"
              />
              <AdminField
                label="Address"
                value={form.link?.url ?? ''}
                onChange={(v) => set('link', { label: form.link?.label ?? '', url: v })}
                error={fieldErrors['link.url']}
                placeholder="https://"
              />
            </div>
          </fieldset>

          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={form.placeholder}
              onChange={(e) => set('placeholder', e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#C9A227]"
            />
            <span className="text-small text-navy-800">
              Still a placeholder
              <span className="block text-micro text-slate">
                Tick while the details are unconfirmed. The pre-launch check lists these.
              </span>
            </span>
          </label>
        </AdminCard>
      </div>

      {/* Actions at the foot of the form, stuck to the bottom of the viewport.
          At the top they were out of sight by the time you had filled anything
          in. Messages sit beside the button that produced them, so a validation
          error is not announced somewhere you have to scroll back to find. */}
      <div className="sticky bottom-0 -mx-4 mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-[#DDDCD8] bg-[#F1F1EF]/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
        {error && <Notice kind="error">{error}</Notice>}
        <AdminButton variant="quiet" onClick={onCancel}>
          Cancel
        </AdminButton>
        <AdminButton type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </AdminButton>
      </div>
    </form>
  )
}
