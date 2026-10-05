import { useCallback, useEffect, useState } from 'react'
import { API_BASE } from '@/services/api'
import {
  adminApi,
  AdminError,
  reachable,
  type AdminSurvey,
  type AdminSurveyQuestion,
  type SurveyStatus,
} from './client'
import { AdminButton, AdminCard, Notice } from './ui'
import { useToast } from './Toast'
import { SkeletonRows } from './Loading'
import { SurveyQuestionForm } from './SurveyQuestionForm'
import { SurveyResults } from './SurveyResults'
import { SurveyShare } from './SurveyShare'
import { SurveyForm } from './SurveyAdmin'

const TYPE_LABEL = { choice: 'Multiple choice', rating: 'Rating 1–5', text: 'Text' }

export function SurveyDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const [survey, setSurvey] = useState<AdminSurvey | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<AdminSurveyQuestion | 'new' | null>(null)
  const [editingDetails, setEditingDetails] = useState(false)
  const toast = useToast()

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
      setSurvey(
        await adminApi.put<AdminSurvey>(`/admin/surveys/${survey.id}`, {
          title: survey.title,
          description: survey.description,
          status,
        }),
      )
      toast.success(status === 'open' ? 'Survey is open to attendees.' : 'Survey closed.')
    } catch (e) {
      toast.error(e instanceof AdminError ? e.message : 'Could not change the survey.')
    }
  }

  async function setQuestionStatus(q: AdminSurveyQuestion, status: SurveyStatus) {
    try {
      await adminApi.put(`/admin/survey-questions/${q.id}`, {
        type: q.type,
        question: q.question,
        options: q.options,
        status,
      })
      load()
    } catch (e) {
      toast.error(e instanceof AdminError ? e.message : 'Could not change that question.')
    }
  }

  async function remove(q: AdminSurveyQuestion) {
    const extra = q.responses_count ? ` Its ${q.responses_count} answers will be deleted too.` : ''
    if (!confirm(`Remove "${q.question.en}"?${extra}`)) return
    try {
      await adminApi.del(`/admin/survey-questions/${q.id}`)
      toast.success('Question removed.')
      load()
    } catch (e) {
      toast.error(e instanceof AdminError ? e.message : 'Could not remove that question.')
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const list = survey?.questions
    if (!survey || !list) return
    const target = index + direction
    if (target < 0 || target >= list.length) return
    const next = [...list]
    ;[next[index], next[target]] = [next[target], next[index]]
    setSurvey({ ...survey, questions: next })
    try {
      await adminApi.post(`/admin/surveys/${survey.id}/questions/reorder`, {
        ids: next.map((q) => q.id),
      })
    } catch {
      toast.error('Could not save the new order.')
      load()
    }
  }

  if (editingDetails && survey) {
    return (
      <SurveyForm
        survey={survey}
        onCancel={() => setEditingDetails(false)}
        onSaved={(saved) => {
          setEditingDetails(false)
          setSurvey(saved)
          toast.success('Survey saved.')
        }}
      />
    )
  }

  if (editing) {
    return (
      <SurveyQuestionForm
        surveyId={id}
        question={editing === 'new' ? null : editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          toast.success('Question saved.')
          load()
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

  const questions = survey.questions ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <AdminButton variant="quiet" onClick={onBack}>
          ← All surveys
        </AdminButton>
        <h2 className="flex-1 text-[0.95rem] font-semibold text-navy-950">{survey.title.en}</h2>
        <AdminButton variant="quiet" onClick={() => setEditingDetails(true)}>
          Edit details
        </AdminButton>
        {survey.status === 'open' ? (
          <AdminButton variant="danger" onClick={() => setSurveyStatus('closed')}>
            Close survey
          </AdminButton>
        ) : (
          <AdminButton variant="success" onClick={() => setSurveyStatus('open')}>
            Open survey
          </AdminButton>
        )}
      </div>

      {survey.status !== 'open' && (
        <p className="text-micro text-slate">
          Attendees see a question only while the survey is open <em>and</em> the question is open.
        </p>
      )}

      <SurveyShare survey={survey} />

      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-[0.82rem] font-semibold uppercase tracking-wide text-slate">
            Questions
          </h3>
          <AdminButton onClick={() => setEditing('new')}>Add question</AdminButton>
        </div>

        {questions.length === 0 && (
          <AdminCard>
            <p className="text-small text-slate">No questions yet. Add the first one.</p>
          </AdminCard>
        )}

        <div className="space-y-2">
          {questions.map((q, i) => (
            <AdminCard interactive key={q.id}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="tnum w-6 text-[0.85rem] font-semibold text-gold-700">{i + 1}</span>
                <div className="min-w-[12rem] flex-1">
                  <p className="text-[0.88rem] font-semibold text-navy-950">{q.question.en}</p>
                  <p className="text-micro text-slate">
                    {TYPE_LABEL[q.type]} · {q.is_required ? 'Required' : 'Optional'} ·{' '}
                    {q.responses_count ?? 0} answers
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {q.status === 'open' ? (
                    <AdminButton variant="danger" onClick={() => setQuestionStatus(q, 'closed')}>
                      Close
                    </AdminButton>
                  ) : (
                    <AdminButton variant="success" onClick={() => setQuestionStatus(q, 'open')}>
                      Open
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
                    disabled={i === questions.length - 1}
                    onClick={() => move(i, 1)}
                    className="h-10 w-8 rounded-sm border border-hair text-navy-800 hover:border-gold-500 disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <AdminButton variant="quiet" onClick={() => setEditing(q)}>
                    Edit
                  </AdminButton>
                  <AdminButton variant="danger" onClick={() => remove(q)}>
                    Remove
                  </AdminButton>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      </section>

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
        <SurveyResults surveyId={survey.id} live={survey.status === 'open'} />
      </section>
    </div>
  )
}
