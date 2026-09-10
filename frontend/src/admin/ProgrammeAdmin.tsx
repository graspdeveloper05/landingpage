import { useEffect, useState } from 'react'
import {
  adminApi,
  AdminError,
  EMPTY_LOCALIZED,
  reachable,
  type AdminProgrammeItem,
  type Locale,
  type Localized,
} from './client'
import { AdminButton, AdminCard, AdminField, LocalizedFieldset, Notice } from './ui'

/** §8 — "the organising team must be able to update timings directly." */
export function ProgrammeAdmin() {
  const [list, setList] = useState<AdminProgrammeItem[] | null>(null)
  const [editing, setEditing] = useState<AdminProgrammeItem | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  // A failure clears `list` to [] as well as setting the error: leaving it
  // null shows the error with "Loading..." under it forever.
  const load = () => {
    setError(null)
    return adminApi
      .get<AdminProgrammeItem[]>('/admin/programme')
      .then(setList)
      .catch((e) => {
        setList([])
        setError(reachable(e))
      })
  }

  useEffect(() => {
    load()
  }, [])

  async function remove(item: AdminProgrammeItem) {
    if (!confirm(`Remove "${item.title.en}" from the programme?`)) return
    try {
      await adminApi.del(`/admin/programme/${item.id}`)
      setSaved('Session removed.')
      load()
    } catch (e) {
      setError(e instanceof AdminError ? e.message : 'Could not remove that session.')
    }
  }

  async function move(index: number, direction: -1 | 1) {
    if (!list) return
    const next = [...list]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setList(next)
    try {
      await adminApi.post('/admin/programme/reorder', { ids: next.map((s) => s.id) })
    } catch {
      setError('Could not save the new order.')
      load()
    }
  }

  if (editing) {
    return (
      <ProgrammeForm
        item={editing === 'new' ? null : editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          setSaved('Session saved.')
          load()
        }}
      />
    )
  }

  /*
   * Times out of sequence are a warning, not an error.
   *
   * The running order is whatever the team dragged it into, and a session that
   * starts before the one above it is usually a typo -- but not always, and
   * refusing to save would block a legitimate correction halfway through a
   * reshuffle. Flag it and let them decide.
   */
  const outOfOrder = new Set<string>()
  list?.forEach((item, i) => {
    if (i > 0 && item.time < list[i - 1].time) outOfOrder.add(item.id)
  })

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.78rem] text-slate">
          Times are 24-hour. Visitors see them in their own language.
        </p>
        <AdminButton onClick={() => setEditing('new')}>Add session</AdminButton>
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
          <p className="text-small text-slate">No sessions yet. Add the first one.</p>
        </AdminCard>
      )}

      <div className="space-y-2">
        {list?.map((item, i) => (
          <AdminCard key={item.id}>
            <div className="flex flex-wrap items-center gap-4">
              <p className="tnum w-14 shrink-0 text-[0.88rem] font-semibold text-gold-700">
                {item.time}
              </p>

              <div className="min-w-[12rem] flex-1">
                <p className="text-[0.88rem] font-semibold text-navy-950">{item.title.en}</p>
                {item.detail?.en && (
                  <p className="text-small italic text-slate">{item.detail.en}</p>
                )}
                {outOfOrder.has(item.id) && (
                  <p className="mt-0.5 text-micro text-red-700">
                    Starts before the session above it.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  className="h-10 w-8 rounded-sm border border-hair text-navy-800 hover:border-gold-500 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={i === list.length - 1}
                  onClick={() => move(i, 1)}
                  className="h-10 w-8 rounded-sm border border-hair text-navy-800 hover:border-gold-500 disabled:opacity-30"
                >
                  ↓
                </button>
                <AdminButton variant="quiet" onClick={() => setEditing(item)}>
                  Edit
                </AdminButton>
                <AdminButton variant="danger" onClick={() => remove(item)}>
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

/* -------------------------------------------------------------------------- */

const BLANK: AdminProgrammeItem = {
  id: '',
  time: '',
  title: { ...EMPTY_LOCALIZED },
  detail: null,
  placeholder: false,
  sort_order: 0,
}

function ProgrammeForm({
  item,
  onCancel,
  onSaved,
}: {
  item: AdminProgrammeItem | null
  onCancel: () => void
  onSaved: () => void
}) {
  const isNew = item === null
  const [form, setForm] = useState<AdminProgrammeItem>(item ?? BLANK)
  const [hasDetail, setHasDetail] = useState(Boolean(item?.detail))
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const localeErrors = (prefix: string) =>
    Object.fromEntries(
      Object.entries(fieldErrors)
        .filter(([k]) => k.startsWith(`${prefix}.`))
        .map(([k, v]) => [k.slice(prefix.length + 1) as Locale, v]),
    ) as Partial<Record<Locale, string>>

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setFieldErrors({})
    try {
      const payload = { ...form, detail: hasDetail ? form.detail : null }
      if (isNew) await adminApi.post('/admin/programme', payload)
      else await adminApi.put(`/admin/programme/${form.id}`, payload)
      onSaved()
    } catch (e) {
      if (e instanceof AdminError) {
        setFieldErrors(e.fields)
        setError(
          Object.keys(e.fields).length > 0 ? 'Some fields need attention — see below.' : e.message,
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
          {isNew ? 'Add session' : 'Edit session'}
        </h2>
      </div>

      <AdminCard className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Browser time picker: AM/PM on a 12-hour machine, and the value
              it submits is the 24-hour "14:30" the API expects. */}
          <AdminField
            label="Start time"
            type="time"
            value={form.time}
            onChange={(v) => setForm((f) => ({ ...f, time: v }))}
            error={fieldErrors.time}
            hint="Visitors see it formatted for their own language."
          />
          <AdminField
            label="Id"
            value={form.id}
            onChange={(v) => setForm((f) => ({ ...f, id: v }))}
            error={fieldErrors.id}
            disabled={!isNew}
            hint={isNew ? 'Lowercase, e.g. pr-09' : 'Fixed once saved.'}
            placeholder="pr-09"
          />
        </div>

        <LocalizedFieldset
          label="Session title"
          value={form.title}
          onChange={(v) => setForm((f) => ({ ...f, title: v }))}
          errors={localeErrors('title')}
        />

        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={hasDetail}
            onChange={(e) => {
              setHasDetail(e.target.checked)
              if (e.target.checked && !form.detail) {
                setForm((f) => ({ ...f, detail: { ...EMPTY_LOCALIZED } }))
              }
            }}
            className="mt-0.5 h-4 w-4 accent-[#C9A227]"
          />
          <span className="text-small text-navy-800">
            Add a subtitle
            <span className="block text-micro text-slate">
              For example a panel's topic. Needed in all four languages, or none.
            </span>
          </span>
        </label>

        {hasDetail && (
          <LocalizedFieldset
            label="Subtitle"
            value={form.detail ?? ({ ...EMPTY_LOCALIZED } as Localized)}
            onChange={(v) => setForm((f) => ({ ...f, detail: v }))}
            errors={localeErrors('detail')}
          />
        )}
      </AdminCard>

      {/* Actions at the foot of the form, stuck to the bottom of the viewport.
          At the top they were out of sight by the time you had filled anything
          in. Messages sit beside the button that produced them, so a validation
          error is not announced somewhere you have to scroll back to find. */}
      <div className="sticky bottom-0 -mx-4 -mb-4 mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-[#DDDCD8] bg-white px-4 py-3 shadow-[0_-6px_16px_-8px_rgba(11,33,64,0.25)] sm:-mx-6 sm:-mb-6 sm:px-6">
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
