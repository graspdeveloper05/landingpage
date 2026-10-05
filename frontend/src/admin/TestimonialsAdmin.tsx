import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import {
  adminApi,
  AdminError,
  reachable,
  type AdminTestimonial,
  type TestimonialCredit,
  type TestimonialStatus,
} from './client'
import { AdminButton, AdminCard, AdminField, Notice } from './ui'
import { useToast } from './Toast'
import { SkeletonRows } from './Loading'

const CREDITS: { value: TestimonialCredit; label: string }[] = [
  { value: 'anonymous', label: 'Anonymous participant' },
  { value: 'first_name', label: 'First name only' },
  { value: 'full_name', label: 'Full name' },
  { value: 'full_name_org', label: 'Full name and organisation' },
]

const STATUS: Record<TestimonialStatus, { label: string; style: string }> = {
  pending: { label: 'Pending review', style: 'border-amber-300 bg-amber-50 text-amber-800' },
  approved: { label: 'On the website', style: 'border-green-300 bg-green-50 text-green-800' },
  hidden: { label: 'Hidden', style: 'border-[#DDDCD8] bg-[#F1F1EF] text-slate' },
}

/** How the homepage will credit a testimonial, as the participant chose. */
function attribution(t: Pick<AdminTestimonial, 'credit' | 'name' | 'organisation'>) {
  const name = (t.name ?? '').trim()
  if (t.credit === 'first_name') return name.split(' ')[0]
  if (t.credit === 'full_name') return name
  if (t.credit === 'full_name_org') return [name, t.organisation?.trim()].filter(Boolean).join(', ')
  return 'Anonymous participant'
}

/**
 * Testimonials are reviewed here before they appear on the homepage. Only
 * approved ones are shown, in this order.
 */
export function TestimonialsAdmin() {
  const [list, setList] = useState<AdminTestimonial[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<AdminTestimonial | 'new' | null>(null)
  const toast = useToast()

  // A failure clears `list` to [] as well as setting the error: leaving it
  // null shows the error with the skeleton under it forever.
  const load = () => {
    setError(null)
    return adminApi
      .get<AdminTestimonial[]>('/admin/testimonials')
      .then(setList)
      .catch((e) => {
        setList([])
        setError(reachable(e))
      })
  }

  useEffect(() => {
    load()
  }, [])

  async function setStatus(t: AdminTestimonial, status: TestimonialStatus) {
    try {
      await adminApi.put(`/admin/testimonials/${t.id}`, { ...t, status })
      toast.success(
        status === 'approved' ? 'Testimonial is on the website.' : 'Testimonial hidden.',
      )
      load()
    } catch (e) {
      toast.error(e instanceof AdminError ? e.message : 'Could not update that testimonial.')
    }
  }

  async function remove(t: AdminTestimonial) {
    if (!confirm('Delete this testimonial? This cannot be undone.')) return
    try {
      await adminApi.del(`/admin/testimonials/${t.id}`)
      toast.success('Testimonial deleted.')
      load()
    } catch (e) {
      toast.error(e instanceof AdminError ? e.message : 'Could not delete that testimonial.')
    }
  }

  async function move(index: number, direction: -1 | 1) {
    if (!list) return
    const target = index + direction
    if (target < 0 || target >= list.length) return
    const next = [...list]
    ;[next[index], next[target]] = [next[target], next[index]]
    setList(next)
    try {
      await adminApi.post('/admin/testimonials/reorder', { ids: next.map((t) => t.id) })
    } catch {
      toast.error('Could not save the new order.')
      load()
    }
  }

  if (editing) {
    return (
      <TestimonialForm
        testimonial={editing === 'new' ? null : editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          toast.success('Testimonial saved.')
          load()
        }}
      />
    )
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.78rem] text-slate">
          Approved testimonials appear on the homepage under “What participants said”, in this
          order.
        </p>
        <AdminButton onClick={() => setEditing('new')}>Add testimonial</AdminButton>
      </div>

      {error && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Notice kind="error">{error}</Notice>
          <AdminButton variant="quiet" onClick={load}>
            Try again
          </AdminButton>
        </div>
      )}
      {!list && <SkeletonRows count={3} />}

      {list && list.length === 0 && !error && (
        <AdminCard>
          <p className="text-small text-slate">No testimonials yet. Add the first one.</p>
        </AdminCard>
      )}

      <div className="space-y-2">
        {list?.map((t, i) => (
          <AdminCard interactive key={t.id}>
            <div className="flex flex-wrap items-start gap-4">
              <div className="min-w-[14rem] flex-1">
                <p className="text-[0.88rem] italic text-navy-950">“{t.quote}”</p>
                <p className="mt-1 text-micro text-slate">— {attribution(t)}</p>
              </div>
              <span
                className={cn(
                  'rounded-full border px-2 py-0.5 text-micro font-semibold',
                  STATUS[t.status].style,
                )}
              >
                {STATUS[t.status].label}
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {t.status === 'approved' ? (
                  <AdminButton variant="danger" onClick={() => setStatus(t, 'hidden')}>
                    Hide
                  </AdminButton>
                ) : (
                  <AdminButton variant="success" onClick={() => setStatus(t, 'approved')}>
                    Approve
                  </AdminButton>
                )}
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
                <AdminButton variant="quiet" onClick={() => setEditing(t)}>
                  Edit
                </AdminButton>
                <AdminButton variant="danger" onClick={() => remove(t)}>
                  Delete
                </AdminButton>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>
    </>
  )
}

function TestimonialForm({
  testimonial,
  onCancel,
  onSaved,
}: {
  testimonial: AdminTestimonial | null
  onCancel: () => void
  onSaved: () => void
}) {
  const [quote, setQuote] = useState(testimonial?.quote ?? '')
  const [credit, setCredit] = useState<TestimonialCredit>(testimonial?.credit ?? 'anonymous')
  const [name, setName] = useState(testimonial?.name ?? '')
  const [organisation, setOrganisation] = useState(testimonial?.organisation ?? '')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setFieldErrors({})
    try {
      const payload = {
        quote,
        credit,
        name: credit === 'anonymous' ? null : name,
        organisation: credit === 'full_name_org' ? organisation : null,
        ...(testimonial ? { status: testimonial.status } : {}),
      }
      if (testimonial) await adminApi.put(`/admin/testimonials/${testimonial.id}`, payload)
      else await adminApi.post('/admin/testimonials', payload)
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
      <h2 className="mb-4 text-[0.95rem] font-semibold text-navy-950">
        {testimonial ? 'Edit testimonial' : 'Add testimonial'}
      </h2>

      <AdminCard className="space-y-4">
        <AdminField
          label="Testimonial"
          hint="As the participant wrote it. Minor edits for spelling, grammar or length are allowed."
          value={quote}
          onChange={setQuote}
          error={fieldErrors.quote}
          multiline
        />

        <fieldset>
          <legend className="mb-1 text-[0.78rem] font-semibold text-navy-900">Credit as</legend>
          <div className="flex flex-wrap gap-2">
            {CREDITS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCredit(c.value)}
                aria-pressed={credit === c.value}
                className={cn(
                  'rounded-sm border px-3 py-1.5 text-[0.78rem] font-semibold',
                  credit === c.value
                    ? 'border-navy-900 bg-navy-900 text-cream'
                    : 'border-[#DDDCD8] bg-white text-navy-900 hover:border-gold-500',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Only the fields the chosen credit needs. */}
        {credit !== 'anonymous' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label="Name" value={name} onChange={setName} error={fieldErrors.name} />
            {credit === 'full_name_org' && (
              <AdminField
                label="Organisation"
                value={organisation}
                onChange={setOrganisation}
                error={fieldErrors.organisation}
              />
            )}
          </div>
        )}

        <p className="text-micro text-slate">
          Shown on the website as:{' '}
          <span className="font-semibold">— {attribution({ credit, name, organisation })}</span>
        </p>
      </AdminCard>

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
