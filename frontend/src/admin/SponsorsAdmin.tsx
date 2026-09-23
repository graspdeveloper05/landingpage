import { useEffect, useRef, useState } from 'react'
import { AdminError, adminApi, reachable } from './client'
import { AdminButton, AdminCard, AdminField, Notice } from './ui'
import { SkeletonRows } from './Loading'
import { useToast } from './Toast'

type Tier = 'foundingPatron' | 'convenedBy' | 'gold' | 'silver' | 'marketing'

interface Sponsor {
  id: number
  name: string
  tier: Tier
  logo: string
  width?: number | null
  height?: number | null
}

/** The client's own billing, and how each reads on the site. */
const TIERS: { value: Tier; label: string }[] = [
  { value: 'foundingPatron', label: 'Founding Patron' },
  { value: 'convenedBy', label: 'Convened by' },
  { value: 'gold', label: 'Gold Sponsor' },
  { value: 'silver', label: 'Silver Sponsor' },
  { value: 'marketing', label: 'Marketing Partner' },
]

const tierLabel = (tier: Tier) => TIERS.find((t) => t.value === tier)?.label ?? tier

/**
 * §10 — the partners and sponsors band.
 *
 * Logos arrive one at a time as the event is put together, so they are edited
 * here rather than written into the site. A tier nobody is in does not appear
 * on the site at all, which is why an empty Silver tier needs no attention.
 */
export function SponsorsAdmin() {
  const toast = useToast()
  const [list, setList] = useState<Sponsor[] | null>(null)
  const [editing, setEditing] = useState<Sponsor | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)

  function load() {
    setError(null)
    adminApi
      .get<Sponsor[]>('/admin/sponsors')
      .then(setList)
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

  if (editing) {
    return (
      <SponsorForm
        sponsor={editing === 'new' ? null : editing}
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
          {list ? `${list.length} on the site` : ' '}
        </p>
        <AdminButton onClick={() => setEditing('new')}>Add sponsor</AdminButton>
      </div>

      {error && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Notice kind="error">{error}</Notice>
          <AdminButton variant="quiet" onClick={load}>
            Try again
          </AdminButton>
        </div>
      )}
      {!list && <SkeletonRows count={3} thumb />}

      {list && list.length === 0 && !error && (
        <AdminCard>
          <p className="text-small text-slate">
            No sponsors yet. Add the first one and the band appears on the site.
          </p>
        </AdminCard>
      )}

      <div className="space-y-3">
        {list?.map((sponsor, i) => (
          <AdminCard interactive key={sponsor.id}>
            <div className="flex flex-wrap items-center gap-4">
              <span className="grid h-16 w-24 shrink-0 place-items-center rounded-sm border border-hair bg-white p-1.5">
                <img src={sponsor.logo} alt="" className="max-h-full max-w-full object-contain" />
              </span>

              <div className="min-w-[12rem] flex-1">
                <p className="text-[0.88rem] font-semibold text-navy-950">{sponsor.name}</p>
                <p className="text-small text-slate">{tierLabel(sponsor.tier)}</p>
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
                <AdminButton variant="quiet" onClick={() => setEditing(sponsor)}>
                  Edit
                </AdminButton>
                <AdminButton variant="danger" onClick={() => remove(sponsor)}>
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

function SponsorForm({
  sponsor,
  onCancel,
  onSaved,
}: {
  sponsor: Sponsor | null
  onCancel: () => void
  onSaved: (name: string) => void
}) {
  const toast = useToast()
  const isNew = sponsor === null
  const [form, setForm] = useState<Omit<Sponsor, 'id'>>(
    () => sponsor ?? { name: '', tier: 'gold', logo: '', width: null, height: null },
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
      const result = await adminApi.post<{ path: string; width: number | null; height: number | null }>(
        '/admin/sponsors/logo',
        body,
      )
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
      const body = { ...form, name: form.name.trim() }
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
          <div className="mt-3 grid h-32 place-items-center rounded-sm border border-hair bg-white p-3">
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
          {fieldErrors.logo && <p className="mt-2 text-[0.76rem] text-red-700">{fieldErrors.logo}</p>}
        </AdminCard>

        <AdminCard className="space-y-4 lg:col-span-8">
          <AdminField
            label="Name"
            value={form.name}
            onChange={(v) => set('name', v)}
            error={fieldErrors.name}
            hint="As it should be read aloud. Shown to screen readers, not printed under the logo."
          />

          <label className="block">
            <span className="block text-[0.78rem] font-semibold text-navy-900">Tier</span>
            <select
              value={form.tier}
              onChange={(e) => set('tier', e.target.value as Tier)}
              className="mt-1 block w-full rounded-sm border border-[#DDDCD8] bg-white px-2.5 py-2 text-[0.85rem] text-navy-950 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/35"
            >
              {TIERS.map((tier) => (
                <option key={tier.value} value={tier.value}>
                  {tier.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[0.72rem] text-slate">
              The site groups logos by tier, in this order, and leaves out a tier nobody is in.
            </span>
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
