import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import {
  adminApi,
  AdminError,
  reachable,
  toLocalized,
  type AdminSurvey,
  type Locale,
  type Localized,
  type SurveyStatus,
} from './client'
import { AdminButton, AdminCard, LocalizedFieldset, Notice } from './ui'
import { useToast } from './Toast'
import { SkeletonRows } from './Loading'
import { SurveyDetail } from './SurveyDetail'
import { StatusChip } from './SurveyResults'
import { surveyUrl } from './SurveyShare'

/** Surveys run during and after the event, answered by registered attendees. */
export function SurveyAdmin() {
  const [list, setList] = useState<AdminSurvey[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<AdminSurvey | 'new' | null>(null)
  const [openId, setOpenId] = useState<number | null>(null)
  const toast = useToast()

  // A failure clears `list` to [] as well as setting the error: leaving it
  // null shows the error with the skeleton under it forever.
  const load = () => {
    setError(null)
    return adminApi
      .get<AdminSurvey[]>('/admin/surveys')
      .then(setList)
      .catch((e) => {
        setList([])
        setError(reachable(e))
      })
  }

  useEffect(() => {
    load()
  }, [])

  async function remove(survey: AdminSurvey) {
    if (!confirm(`Delete "${survey.title.en}" and all its answers? This cannot be undone.`)) return
    try {
      await adminApi.del(`/admin/surveys/${survey.id}`)
      toast.success('Survey deleted.')
      load()
    } catch (e) {
      toast.error(e instanceof AdminError ? e.message : 'Could not delete that survey.')
    }
  }

  if (openId !== null) {
    return (
      <SurveyDetail
        id={openId}
        onBack={() => {
          setOpenId(null)
          load()
        }}
      />
    )
  }

  if (editing) {
    return (
      <SurveyForm
        survey={editing === 'new' ? null : editing}
        onCancel={() => setEditing(null)}
        onSaved={(saved) => {
          setEditing(null)
          toast.success('Survey saved.')
          // A new survey has no questions yet, so go straight to adding them.
          if (editing === 'new') setOpenId(saved.id)
          else load()
        }}
      />
    )
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.78rem] text-slate">
          Each survey has its own link. Attendees answer with the email or mobile they registered
          with.
        </p>
        <AdminButton onClick={() => setEditing('new')}>Add survey</AdminButton>
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
          <p className="text-small text-slate">No surveys yet. Add the first one.</p>
        </AdminCard>
      )}

      <div className="space-y-2">
        {list?.map((s) => (
          <AdminCard interactive key={s.id}>
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-[12rem] flex-1">
                <p className="text-[0.88rem] font-semibold text-navy-950">{s.title.en}</p>
                <p className="text-micro text-slate">
                  {s.questions_count ?? 0} questions · {s.responses_count ?? 0} answers ·{' '}
                  <span className="break-all">{surveyUrl(s.id)}</span>
                </p>
              </div>
              <StatusChip status={s.status} />
              <div className="flex items-center gap-1">
                <AdminButton onClick={() => setOpenId(s.id)}>Manage</AdminButton>
                <AdminButton variant="quiet" onClick={() => setEditing(s)}>
                  Edit
                </AdminButton>
                <AdminButton variant="danger" onClick={() => remove(s)}>
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

/* -------------------------------------------------------------------------- */

const STATUS_CHOICES: { value: SurveyStatus; label: string; hint: string }[] = [
  { value: 'draft', label: 'Draft', hint: 'Being prepared' },
  { value: 'open', label: 'Open', hint: 'Taking answers' },
  { value: 'closed', label: 'Closed', hint: 'No more answers' },
]

function SurveyForm({
  survey,
  onCancel,
  onSaved,
}: {
  survey: AdminSurvey | null
  onCancel: () => void
  onSaved: (saved: AdminSurvey) => void
}) {
  const [title, setTitle] = useState<Localized>(toLocalized(survey?.title))
  const [description, setDescription] = useState<Localized>(toLocalized(survey?.description))
  const [status, setStatus] = useState<SurveyStatus>(survey?.status ?? 'draft')
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
      const payload = { title, description, status }
      const saved = survey
        ? await adminApi.put<AdminSurvey>(`/admin/surveys/${survey.id}`, payload)
        : await adminApi.post<AdminSurvey>('/admin/surveys', payload)
      onSaved(saved)
    } catch (e) {
      if (e instanceof AdminError) {
        setFieldErrors(e.fields)
        setError(Object.keys(e.fields).length > 0 ? 'Some fields need attention — see below.' : e.message)
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
        {survey ? 'Edit survey' : 'Add survey'}
      </h2>

      <AdminCard className="space-y-4">
        <LocalizedFieldset
          label="Title"
          hint="The heading attendees see. Only English is required; empty languages show the English."
          value={title}
          onChange={setTitle}
          errors={localeErrors('title')}
        />
        <LocalizedFieldset
          label="Description (optional)"
          hint="A line under the heading, e.g. what the survey is for."
          value={description}
          onChange={setDescription}
          errors={localeErrors('description')}
          multiline
        />

        <fieldset>
          <legend className="mb-1 text-[0.78rem] font-semibold text-navy-900">Status</legend>
          <p className="mb-2 text-[0.7rem] text-slate">
            Attendees can answer only while the survey is open. Questions are opened one by one on
            the survey's Manage page.
          </p>
          <div className="flex flex-wrap gap-2">
            {STATUS_CHOICES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                aria-pressed={status === s.value}
                className={cn(
                  'rounded-sm border px-3 py-1.5 text-left',
                  status === s.value
                    ? 'border-navy-900 bg-navy-900 text-cream'
                    : 'border-[#DDDCD8] bg-white text-navy-900 hover:border-gold-500',
                )}
              >
                <span className="block text-[0.78rem] font-semibold">{s.label}</span>
                <span className="block text-micro opacity-75">{s.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>
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
