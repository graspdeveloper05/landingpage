import { useCallback, useEffect, useState } from 'react'
import { API_BASE } from '@/services/api'
import { adminApi, AdminError, reachable, type AdminSurvey, type SurveyStatus } from './client'
import { AdminButton, Notice } from './ui'
import { useToast } from './Toast'
import { SkeletonRows } from './Loading'
import { FormBuilder } from './FormBuilder'
import { SurveyResults } from './SurveyResults'
import { SurveyShare } from './SurveyShare'
import { SurveyForm } from './FormSettings'

/**
 * One form's page: its heading and on/off switch, the link and QR code,
 * the question builder, and the results as they come in.
 */
export function SurveyDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const [survey, setSurvey] = useState<AdminSurvey | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingDetails, setEditingDetails] = useState(false)
  // Bumped when a new order is saved, so the results below follow it.
  const [orderSaved, setOrderSaved] = useState(0)
  // Questions with changes the builder has not saved (yet, or at all).
  const [unsaved, setUnsaved] = useState(0)
  const toast = useToast()

  /** Leaving the builder with changes not saved asks first. */
  const leave = (go: () => void) => {
    if (
      unsaved > 0 &&
      !confirm(
        `${unsaved} ${unsaved === 1 ? 'question has' : 'questions have'} changes that are not saved yet (see the red messages). Leave anyway?`,
      )
    ) {
      return
    }
    go()
  }

  const load = useCallback(() => {
    setError(null)
    return adminApi
      .get<AdminSurvey>(`/admin/surveys/${id}`)
      .then(setSurvey)
      .catch((e) => setError(reachable(e)))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function setSurveyStatus(status: SurveyStatus) {
    if (!survey) return
    try {
      const saved = await adminApi.put<AdminSurvey>(`/admin/surveys/${survey.id}`, {
        title: survey.title,
        description: survey.description,
        status,
      })
      // The questions stay as the builder has them; only the form changed.
      setSurvey((s) => (s ? { ...saved, questions: s.questions } : saved))
      toast.success(status === 'open' ? 'Form is active.' : 'Form is inactive.')
    } catch (e) {
      toast.error(e instanceof AdminError ? e.message : 'Could not change the form.')
    }
  }

  if (editingDetails && survey) {
    return (
      <SurveyForm
        survey={survey}
        onCancel={() => setEditingDetails(false)}
        onSaved={(saved) => {
          setEditingDetails(false)
          setSurvey((s) => (s ? { ...saved, questions: s.questions } : saved))
          toast.success('Form saved.')
        }}
      />
    )
  }

  if (error) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Notice kind="error">{error}</Notice>
        <AdminButton variant="quiet" onClick={load}>
          Try again
        </AdminButton>
        <AdminButton variant="quiet" onClick={onBack}>
          Back
        </AdminButton>
      </div>
    )
  }
  if (!survey) return <SkeletonRows count={4} />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <AdminButton variant="quiet" onClick={() => leave(onBack)}>
          ← All forms
        </AdminButton>
        <h2 className="flex-1 text-[0.95rem] font-semibold text-navy-950">{survey.title.en}</h2>
        <AdminButton variant="quiet" onClick={() => leave(() => setEditingDetails(true))}>
          Edit title & details
        </AdminButton>
        {survey.status === 'open' ? (
          <AdminButton variant="danger" onClick={() => setSurveyStatus('closed')}>
            Deactivate form
          </AdminButton>
        ) : (
          <AdminButton variant="success" onClick={() => setSurveyStatus('open')}>
            Activate form
          </AdminButton>
        )}
      </div>

      {survey.status !== 'open' && (
        <p className="text-micro text-slate">
          The form is inactive: attendees cannot answer until it is activated. Questions switched
          off with “Shown to attendees” stay hidden either way.
        </p>
      )}

      <SurveyShare survey={survey} />

      <div>
        <h3 className="mb-2 text-[0.82rem] font-semibold uppercase tracking-wide text-slate">
          Questions
        </h3>
        <FormBuilder
          survey={survey}
          setSurvey={setSurvey}
          onOrderSaved={() => setOrderSaved((n) => n + 1)}
          onUnsavedChange={setUnsaved}
        />
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-[0.82rem] font-semibold uppercase tracking-wide text-slate">
            Results
            {survey.status === 'open' && (
              <span className="normal-case tracking-normal"> · updating live</span>
            )}
          </h3>
          {/* A plain link so the browser performs the download, as on Registrations. */}
          <a
            href={`${API_BASE}/api/admin/surveys/${survey.id}/export`}
            className="inline-flex min-h-[34px] items-center rounded-sm border border-[#DDDCD8] bg-white px-3 text-[0.78rem] font-semibold text-navy-900 hover:border-navy-600"
          >
            Download CSV
          </a>
        </div>
        <SurveyResults key={orderSaved} surveyId={survey.id} live={survey.status === 'open'} />
      </section>
    </div>
  )
}
