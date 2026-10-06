import { useEffect, useState } from 'react'
import { adminApi, AdminError, reachable, type AdminSurvey } from './client'
import { AdminButton, AdminCard, Notice } from './ui'
import { useToast } from './Toast'
import { SkeletonRows } from './Loading'
import { SurveyDetail } from './SurveyDetail'
import { StatusChip } from './SurveyResults'
import { surveyUrl } from './SurveyShare'
import { SurveyResponses } from './SurveyResponses'
import { SurveyForm } from './FormSettings'

/** People with a list beside them: who answered. */
function ResponsesIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
      <circle cx="5" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M1.5 13c0-2.2 1.6-3.8 3.5-3.8s3.5 1.6 3.5 3.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M10.5 4.5h4M10.5 8h4M10.5 11.5h3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Surveys run during and after the event, answered by registered attendees. */
export function SurveyAdmin() {
  const [list, setList] = useState<AdminSurvey[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Existing surveys are edited on their own page (SurveyDetail); only a new
  // one starts from the bare form here.
  const [adding, setAdding] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)
  const [viewing, setViewing] = useState<AdminSurvey | null>(null)
  // The form being switched on or off, so its button cannot be pressed twice.
  const [switching, setSwitching] = useState<number | null>(null)
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

  /** Active takes answers; Inactive stops them. Same call as the form's own page. */
  async function setActive(survey: AdminSurvey, active: boolean) {
    setSwitching(survey.id)
    try {
      const saved = await adminApi.put<AdminSurvey>(`/admin/surveys/${survey.id}`, {
        title: survey.title,
        description: survey.description,
        status: active ? 'open' : 'closed',
      })
      setList(
        (all) => all?.map((x) => (x.id === saved.id ? { ...x, status: saved.status } : x)) ?? all,
      )
      toast.success(
        active ? `"${survey.title.en}" is active.` : `"${survey.title.en}" is inactive.`,
      )
    } catch (e) {
      toast.error(e instanceof AdminError ? e.message : 'Could not change the form.')
    } finally {
      setSwitching(null)
    }
  }

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

  if (viewing) {
    return (
      <SurveyResponses
        survey={viewing}
        onBack={() => {
          setViewing(null)
          load()
        }}
      />
    )
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

  if (adding) {
    return (
      <SurveyForm
        survey={null}
        onCancel={() => setAdding(false)}
        onSaved={(saved) => {
          setAdding(false)
          toast.success('Form created. Now add its questions.')
          // A new survey has no questions yet, so go straight to adding them.
          setOpenId(saved.id)
        }}
      />
    )
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.78rem] text-slate">
          Each form has its own link and QR code. Under Edit, choose which details it asks (name,
          email, phone, organisation).
        </p>
        <AdminButton onClick={() => setAdding(true)}>+ New form</AdminButton>
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
                <p className="text-[0.88rem] font-semibold text-navy-950">
                  {s.title.en}
                  <span className="ml-2 rounded-full border border-[#DDDCD8] px-2 py-0.5 align-middle text-micro font-semibold text-slate">
                    {s.form_type === 'feedback' ? 'Feedback' : 'Survey'}
                  </span>
                </p>
                <p className="text-micro text-slate">
                  {s.questions_count ?? 0} questions · {s.responses_count ?? 0} answers ·{' '}
                  <span className="break-all">{surveyUrl(s)}</span>
                </p>
              </div>
              <StatusChip status={s.status} />
              <div className="flex items-center gap-1">
                {s.status === 'open' ? (
                  <AdminButton
                    variant="danger"
                    disabled={switching === s.id}
                    onClick={() => setActive(s, false)}
                  >
                    Deactivate
                  </AdminButton>
                ) : (
                  <AdminButton
                    variant="success"
                    disabled={switching === s.id}
                    onClick={() => setActive(s, true)}
                  >
                    Activate
                  </AdminButton>
                )}
                <button
                  type="button"
                  onClick={() => setViewing(s)}
                  aria-label={`View responses to ${s.title.en}`}
                  title="View responses"
                  className="grid h-[34px] w-[34px] place-items-center rounded-sm border border-[#DDDCD8] bg-white text-navy-900 transition-colors hover:border-navy-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/35"
                >
                  <ResponsesIcon />
                </button>
                <AdminButton onClick={() => setOpenId(s.id)}>Edit</AdminButton>
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
