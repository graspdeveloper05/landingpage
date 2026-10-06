import { useEffect, useRef, useState } from 'react'
import { AdminError, adminApi, reachable } from './client'
import { AdminButton, AdminCard, AdminField, Notice } from './ui'
import { SkeletonRows } from './Loading'
import { useToast } from './Toast'

interface Sponsor {
  id: number
  name: string
  /** The key of its group. */
  tier: string
  logo: string
  /** Their website; the logo on the site opens it. */
  link?: string | null
  width?: number | null
  height?: number | null
}

type GroupName = { en: string; ms: string; zh: string; ta: string }

/** A group of the band ("Our Gold Sponsors"), named in four languages. */
interface Group {
  id: number
  key: string
  name: GroupName
  sponsors_count: number
}

const GROUP_LANGUAGES: { lang: keyof GroupName; label: string }[] = [
  { lang: 'en', label: 'English' },
  { lang: 'ms', label: 'Bahasa Malaysia' },
  { lang: 'zh', label: '中文' },
  { lang: 'ta', label: 'தமிழ்' },
]

const EMPTY_NAME: GroupName = { en: '', ms: '', zh: '', ta: '' }

/** The server no longer has it: deleted in another tab, or by someone else. */
const gone = (e: unknown) => e instanceof AdminError && e.status === 404

/**
 * §10 — the partners and sponsors band.
 *
 * Logos arrive one at a time as the event is put together, so they are edited
 * here rather than written into the site. So are the groups they sit in: the
 * team adds a group ("Media Partners"), names it in each language, and puts
 * it where it belongs in the band. A group nobody is in does not appear on
 * the site, which is why an empty one needs no attention.
 */
export function SponsorsAdmin() {
  const toast = useToast()
  const [list, setList] = useState<Sponsor[] | null>(null)
  const [groups, setGroups] = useState<Group[] | null>(null)
  const [editing, setEditing] = useState<Sponsor | { new: true; tier: string } | null>(null)
  // The group being named: a new one, or an existing one being renamed.
  const [naming, setNaming] = useState<Group | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)

  function load() {
    setError(null)
    Promise.all([
      adminApi.get<Sponsor[]>('/admin/sponsors'),
      adminApi.get<Group[]>('/admin/sponsor-tiers'),
    ])
      .then(([sponsors, tiers]) => {
        setList(sponsors)
        setGroups(tiers)
      })
      .catch((e) => setError(reachable(e)))
  }

  useEffect(load, [])

  async function remove(sponsor: Sponsor) {
    if (!window.confirm(`Remove ${sponsor.name} from the site?`)) return
    try {
      await adminApi.del(`/admin/sponsors/${sponsor.id}`)
      toast.success(`${sponsor.name} removed.`)
      load()
    } catch (e) {
      toast.error(reachable(e))
      if (gone(e)) load()
    }
  }

  async function move(index: number, direction: -1 | 1) {
    if (!list) return
    const next = [...list]
    const to = index + direction
    if (to < 0 || to >= next.length) return
    ;[next[index], next[to]] = [next[to], next[index]]
    // Shown moved before the server confirms: reordering is a series of small
    // steps, and a list that waits for each one is unusable.
    setList(next)
    try {
      await adminApi.post('/admin/sponsors/reorder', { ids: next.map((s) => s.id) })
    } catch (e) {
      toast.error(reachable(e))
      load()
    }
  }

  async function moveGroup(index: number, direction: -1 | 1) {
    if (!groups) return
    const next = [...groups]
    const to = index + direction
    if (to < 0 || to >= next.length) return
    ;[next[index], next[to]] = [next[to], next[index]]
    setGroups(next)
    try {
      await adminApi.post('/admin/sponsor-tiers/reorder', { ids: next.map((g) => g.id) })
    } catch (e) {
      toast.error(reachable(e))
      load()
    }
  }

  async function removeGroup(group: Group) {
    if (!window.confirm(`Delete the group “${group.name.en}”?`)) return
    try {
      await adminApi.del(`/admin/sponsor-tiers/${group.id}`)
      toast.success(`“${group.name.en}” deleted.`)
      load()
    } catch (e) {
      toast.error(e instanceof AdminError && e.fields.tier ? e.fields.tier : reachable(e))
      if (gone(e)) load()
    }
  }

  if (editing && groups) {
    return (
      <SponsorForm
        sponsor={'new' in editing ? null : editing}
        groups={groups}
        defaultTier={editing.tier}
        onCancel={() => setEditing(null)}
        onSaved={(name) => {
          setEditing(null)
          toast.success(`${name} saved.`)
          load()
        }}
      />
    )
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.78rem] text-slate">
          {list && groups
            ? `${list.length} on the site, in ${groups.length} ${groups.length === 1 ? 'group' : 'groups'}`
            : ' '}
        </p>
        <div className="flex gap-2">
          <AdminButton variant="quiet" onClick={() => setNaming('new')} disabled={!groups}>
            + Add group
          </AdminButton>
          <AdminButton
            onClick={() => groups?.[0] && setEditing({ new: true, tier: groups[0].key })}
            disabled={!groups?.length}
          >
            Add sponsor
          </AdminButton>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Notice kind="error">{error}</Notice>
          <AdminButton variant="quiet" onClick={load}>
            Try again
          </AdminButton>
        </div>
      )}
      {!list && !error && <SkeletonRows count={3} thumb />}

      {naming === 'new' && (
        <GroupForm
          group={null}
          onCancel={() => setNaming(null)}
          onSaved={(group) => {
            setNaming(null)
            toast.success(`“${group.name.en}” added. Add its sponsors with “+ Add sponsor here”.`)
            load()
          }}
        />
      )}

      {/* A grid of cards rather than a list of rows: these are logos, and a
          band of them is what the site shows. Grouped under their group, in
          the order the site reads them. Every group is listed, empty ones
          too, so a new group can be given its first sponsor. */}
      <div className="space-y-7">
        {list &&
          groups?.map((group, gi) => {
            const members = list.filter((sponsor) => sponsor.tier === group.key)
            return (
              <section key={group.id}>
                {naming !== 'new' && naming?.id === group.id ? (
                  <GroupForm
                    group={group}
                    onCancel={() => setNaming(null)}
                    onSaved={(saved) => {
                      setNaming(null)
                      toast.success(`Renamed to “${saved.name.en}”.`)
                      load()
                    }}
                    onGone={(message) => {
                      setNaming(null)
                      toast.error(message)
                      load()
                    }}
                  />
                ) : (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#E6E5E1] pb-2">
                    <h2 className="text-[0.74rem] font-semibold uppercase tracking-[0.12em] text-navy-900">
                      {group.name.en}
                    </h2>
                    <span className="rounded-full bg-[#EEEDEA] px-2 py-px text-[0.68rem] font-semibold text-slate">
                      {members.length}
                    </span>
                    <div className="ml-auto flex flex-wrap items-center gap-1">
                      <ArrowButton
                        label={`Move the group “${group.name.en}” up`}
                        disabled={gi === 0}
                        onClick={() => moveGroup(gi, -1)}
                      >
                        ↑
                      </ArrowButton>
                      <ArrowButton
                        label={`Move the group “${group.name.en}” down`}
                        disabled={gi === groups.length - 1}
                        onClick={() => moveGroup(gi, 1)}
                      >
                        ↓
                      </ArrowButton>
                      <AdminButton variant="quiet" onClick={() => setNaming(group)}>
                        Rename
                      </AdminButton>
                      {/* A group with sponsors cannot go: they would vanish
                          from the site. The hint sits on a wrapper, since a
                          disabled button shows no tooltip of its own. */}
                      <span
                        title={
                          members.length > 0
                            ? 'Move or remove its sponsors first'
                            : 'Delete this group'
                        }
                      >
                        <AdminButton
                          variant="danger"
                          disabled={members.length > 0}
                          onClick={() => removeGroup(group)}
                        >
                          Delete
                        </AdminButton>
                      </span>
                      <AdminButton
                        variant="quiet"
                        onClick={() => setEditing({ new: true, tier: group.key })}
                      >
                        + Add sponsor here
                      </AdminButton>
                    </div>
                  </div>
                )}

                {members.length === 0 ? (
                  <p className="mt-3 rounded-sm border border-dashed border-[#CFCDC7] bg-white/60 px-4 py-5 text-center text-[0.78rem] text-slate">
                    No sponsors in this group yet. It stays off the site until one is added.
                  </p>
                ) : (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {members.map((sponsor) => {
                      // Position in the whole band, not within the group: the
                      // arrows move a logo through the order the site shows.
                      const i = list.indexOf(sponsor)
                      return (
                        <AdminCard interactive key={sponsor.id} className="flex flex-col">
                          <span className="flex h-24 items-center justify-center overflow-hidden rounded-sm border border-hair bg-white p-3">
                            <img
                              src={sponsor.logo}
                              alt=""
                              className="max-h-full max-w-full object-contain"
                            />
                          </span>

                          <p className="mt-3 text-[0.85rem] font-semibold leading-snug text-navy-950">
                            {sponsor.name}
                          </p>
                          {sponsor.link ? (
                            <a
                              href={sponsor.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-0.5 block truncate text-[0.76rem] text-gold-700 underline decoration-gold-500/40 underline-offset-2 hover:text-navy-900"
                            >
                              {sponsor.link.replace(/^https?:\/\//, '')}
                            </a>
                          ) : (
                            <p className="mt-0.5 text-[0.76rem] text-slate">No website link</p>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-1 pt-1">
                            <ArrowButton
                              label="Move up"
                              disabled={i === 0}
                              onClick={() => move(i, -1)}
                            >
                              ↑
                            </ArrowButton>
                            <ArrowButton
                              label="Move down"
                              disabled={i === list.length - 1}
                              onClick={() => move(i, 1)}
                            >
                              ↓
                            </ArrowButton>
                            <AdminButton variant="quiet" onClick={() => setEditing(sponsor)}>
                              Edit
                            </AdminButton>
                            <AdminButton variant="danger" onClick={() => remove(sponsor)}>
                              Remove
                            </AdminButton>
                          </div>
                        </AdminCard>
                      )
                    })}
                  </div>
                )}
              </section>
            )
          })}
      </div>
    </>
  )
}

/**
 * Naming a group, new or existing: English is required and is what the
 * panel shows; the other languages fall back to it on the site when blank.
 */
function GroupForm({
  group,
  onCancel,
  onSaved,
  onGone,
}: {
  group: Group | null
  onCancel: () => void
  onSaved: (group: Group) => void
  /** The group was deleted meanwhile (in another tab, say). */
  onGone?: (message: string) => void
}) {
  const [name, setName] = useState<GroupName>(() => ({ ...EMPTY_NAME, ...(group?.name ?? {}) }))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!name.en.trim()) {
      setError('Enter the group’s name in English.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const saved = group
        ? await adminApi.put<Group>(`/admin/sponsor-tiers/${group.id}`, { name })
        : await adminApi.post<Group>('/admin/sponsor-tiers', { name })
      onSaved(saved)
    } catch (e) {
      if (gone(e) && onGone) {
        onGone(reachable(e))
        return
      }
      setError(
        e instanceof AdminError && Object.keys(e.fields).length > 0
          ? Object.values(e.fields)[0]
          : reachable(e),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminCard className="admin-card-in mb-4 border-gold-500/50">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <p className="text-[0.85rem] font-semibold text-navy-950">
          {group ? `Rename “${group.name.en}”` : 'New group'}
        </p>
        <p className="mt-0.5 text-[0.74rem] text-slate">
          The heading over its logos on the site, e.g. “Media Partners”. Blank languages show the
          English.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {GROUP_LANGUAGES.map(({ lang, label }) => (
            <label key={lang} className="block">
              <span className="block text-[0.74rem] font-semibold text-navy-900">
                {label}
                {lang === 'en' && <span className="text-gold-700"> *</span>}
              </span>
              <input
                value={name[lang]}
                maxLength={80}
                autoFocus={lang === 'en'}
                onChange={(e) => {
                  setName((n) => ({ ...n, [lang]: e.target.value }))
                  setError(null)
                }}
                className="mt-1 block min-h-[36px] w-full rounded-sm border border-[#DDDCD8] bg-white px-2.5 text-[0.85rem] text-navy-950 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/35"
              />
            </label>
          ))}
        </div>
        {error && <p className="mt-2 text-[0.76rem] text-red-700">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <AdminButton variant="quiet" onClick={onCancel}>
            Cancel
          </AdminButton>
          <AdminButton type="submit" disabled={busy}>
            {busy ? 'Saving…' : group ? 'Save name' : 'Add group'}
          </AdminButton>
        </div>
      </form>
    </AdminCard>
  )
}

function SponsorForm({
  sponsor,
  groups,
  defaultTier,
  onCancel,
  onSaved,
}: {
  sponsor: Sponsor | null
  groups: Group[]
  /** The group a new sponsor starts in: the one whose "Add sponsor here" was pressed. */
  defaultTier: string
  onCancel: () => void
  onSaved: (name: string) => void
}) {
  const toast = useToast()
  const isNew = sponsor === null
  const [form, setForm] = useState<Omit<Sponsor, 'id'>>(
    () =>
      sponsor ?? { name: '', tier: defaultTier, logo: '', link: null, width: null, height: null },
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function set<K extends keyof Omit<Sponsor, 'id'>>(key: K, value: Omit<Sponsor, 'id'>[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setFieldErrors((e) => ({ ...e, [key]: '' }))
  }

  async function upload(file: File) {
    setUploading(true)
    setFieldErrors((e) => ({ ...e, logo: '' }))
    try {
      const body = new FormData()
      body.append('logo', file)
      const result = await adminApi.post<{
        path: string
        width: number | null
        height: number | null
      }>('/admin/sponsors/logo', body)
      // The logo's own size travels with it, so its tile holds space on the
      // site before the image arrives.
      setForm((f) => ({ ...f, logo: result.path, width: result.width, height: result.height }))
      toast.success('Logo uploaded. Save to put it on the site.')
    } catch (e) {
      setFieldErrors((errs) => ({
        ...errs,
        logo: e instanceof AdminError && e.fields.logo ? e.fields.logo : reachable(e),
      }))
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    setBusy(true)
    setError(null)
    setFieldErrors({})
    try {
      const body = { ...form, name: form.name.trim(), link: form.link?.trim() || null }
      if (isNew) await adminApi.post('/admin/sponsors', body)
      else await adminApi.put(`/admin/sponsors/${sponsor.id}`, body)
      onSaved(body.name)
    } catch (e) {
      if (e instanceof AdminError && Object.keys(e.fields).length > 0) setFieldErrors(e.fields)
      else setError(reachable(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.88rem] font-semibold text-navy-950">
          {isNew ? 'Add sponsor' : `Edit ${sponsor.name}`}
        </p>
        <div className="flex gap-2">
          <AdminButton variant="quiet" onClick={onCancel}>
            Cancel
          </AdminButton>
          <AdminButton onClick={save} disabled={busy || uploading}>
            {busy ? 'Saving…' : 'Save'}
          </AdminButton>
        </div>
      </div>

      {error && <Notice kind="error">{error}</Notice>}

      <div className="grid items-start gap-4 lg:grid-cols-12">
        <AdminCard className="lg:col-span-4">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate">Logo</p>
          {/* Flex with max-height, not a grid child at h-full: a tall crest
              overflowed the box and sat over the button below it. */}
          <div className="mt-3 flex h-32 items-center justify-center overflow-hidden rounded-sm border border-hair bg-white p-3">
            {form.logo ? (
              <img src={form.logo} alt="" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-[0.78rem] text-slate">No logo yet</span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) upload(file)
              e.target.value = ''
            }}
          />
          <AdminButton
            variant="quiet"
            className="mt-3"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : form.logo ? 'Replace logo' : 'Upload logo'}
          </AdminButton>
          <p className="mt-2 text-[0.72rem] leading-snug text-slate">
            JPEG, PNG or WebP, under 8 MB. A logo on a white or transparent background sits best on
            the tile; trim any empty space around it first.
          </p>
          {fieldErrors.logo && (
            <p className="mt-2 text-[0.76rem] text-red-700">{fieldErrors.logo}</p>
          )}
        </AdminCard>

        <AdminCard className="space-y-4 lg:col-span-8">
          <AdminField
            label="Name"
            value={form.name}
            onChange={(v) => set('name', v)}
            error={fieldErrors.name}
            hint="As it should be read aloud. Shown to screen readers, not printed under the logo."
          />

          <AdminField
            label="Website link"
            value={form.link ?? ''}
            onChange={(v) => set('link', v)}
            error={fieldErrors.link}
            placeholder="https://www.example.com"
            hint="Optional. When set, clicking the logo on the site opens this page in a new tab."
          />

          <label className="block">
            <span className="block text-[0.78rem] font-semibold text-navy-900">Group</span>
            <select
              value={form.tier}
              onChange={(e) => set('tier', e.target.value)}
              className="mt-1 block w-full rounded-sm border border-[#DDDCD8] bg-white px-2.5 py-2 text-[0.85rem] text-navy-950 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/35"
            >
              {groups.map((group) => (
                <option key={group.key} value={group.key}>
                  {group.name.en}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[0.72rem] text-slate">
              The site groups logos in this order and leaves out a group nobody is in. Add or rename
              groups on the Sponsors page.
            </span>
            {fieldErrors.tier && (
              <span className="mt-1 block text-[0.76rem] text-red-700">{fieldErrors.tier}</span>
            )}
          </label>
        </AdminCard>
      </div>
    </>
  )
}

/** Square nudge button for the running order. */
function ArrowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-sm border border-[#DDDCD8] bg-white text-navy-900 transition-colors hover:border-navy-600/50 disabled:opacity-35"
    >
      {children}
    </button>
  )
}
