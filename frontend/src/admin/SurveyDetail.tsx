import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
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

const TYPE_LABEL = {
  choice: 'Multiple choice',
  checkbox: 'Checkboxes',
  rating: 'Rating 1–5',
  text: 'Text',
  grid: 'Statement table',
}

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
      toast.success(status === 'open' ? 'Survey is active.' : 'Survey is inactive.')
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

  async function saveOrder(next: AdminSurveyQuestion[]) {
    if (!survey) return
    try {
      await adminApi.post(`/admin/surveys/${survey.id}/questions/reorder`, {
        ids: next.map((q) => q.id),
      })
      setOrderSaved((n) => n + 1)
    } catch {
      toast.error('Could not save the new order.')
      load()
    }
  }

  /** Keyboard on the grip: arrow up or down moves the question one place. */
  function move(index: number, direction: -1 | 1) {
    const list = survey?.questions
    if (!survey || !list) return
    const target = index + direction
    if (target < 0 || target >= list.length) return
    const next = [...list]
    ;[next[index], next[target]] = [next[target], next[index]]
    setSurvey({ ...survey, questions: next })
    saveOrder(next)
  }

  // Dragging a question: press anywhere on its row (on a touch screen, on
  // its grip, so a swipe still scrolls the page) and move. The row follows
  // the pointer, the others slide out of its way, and the order is saved
  // once, when it is let go.
  const [dragId, setDragId] = useState<number | null>(null)
  // Bumped when a new order is saved, so the results below follow it.
  const [orderSaved, setOrderSaved] = useState(0)
  const rows = useRef(new Map<number, HTMLDivElement>())
  const drag = useRef<{
    id: number
    startY: number
    startTop: number
    height: number
    delta: number
    started: boolean
    order: string
  } | null>(null)
  // Where each row sat last time, so a row that moves can glide from there.
  const lastTops = useRef(new Map<number, number>())
  const calm =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  // After each reorder: the held row stays under the pointer; every other row
  // that changed place starts where it was and slides to where it is now.
  useLayoutEffect(() => {
    const d = drag.current
    rows.current.forEach((el, id) => {
      const top = el.offsetTop
      if (d?.started && id === d.id) {
        el.style.transition = 'none'
        el.style.transform = `translateY(${d.startTop + d.delta - top}px)`
      } else {
        const was = lastTops.current.get(id)
        if (!calm && was !== undefined && was !== top) {
          el.style.transition = 'none'
          el.style.transform = `translateY(${was - top}px)`
          void el.offsetHeight
          el.style.transition = 'transform 220ms cubic-bezier(0.2, 0.7, 0.3, 1)'
          el.style.transform = ''
        }
      }
      lastTops.current.set(id, top)
    })
  }, [survey?.questions, calm])

  function startDrag(e: React.PointerEvent<HTMLDivElement>, id: number) {
    if (!survey?.questions || e.button !== 0) return
    const target = e.target as Element
    const onGrip = !!target.closest('[data-grip]')
    // The row's buttons stay buttons; a finger drags only by the grip.
    if (!onGrip && target.closest('button, a, input, select, textarea')) return
    if (e.pointerType === 'touch' && !onGrip) return
    const el = rows.current.get(id)
    if (!el) return
    e.preventDefault()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // A pointer that is no longer down cannot be captured; nothing to hold.
    }
    drag.current = {
      id,
      startY: e.pageY,
      startTop: el.offsetTop,
      height: el.offsetHeight,
      delta: 0,
      started: false,
      order: survey.questions.map((q) => q.id).join(),
    }
  }

  function dragMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current
    const list = survey?.questions
    if (!d || !survey || !list) return
    d.delta = e.pageY - d.startY
    // A few pixels first, so a press that was meant as a click stays one.
    if (!d.started) {
      if (Math.abs(d.delta) < 4) return
      d.started = true
      setDragId(d.id)
    }
    // Near the top or bottom of the window, scroll so a long list can be crossed.
    if (e.clientY < 80) window.scrollBy(0, -14)
    else if (e.clientY > window.innerHeight - 80) window.scrollBy(0, 14)

    const el = rows.current.get(d.id)
    if (el) {
      el.style.transition = 'none'
      el.style.transform = `translateY(${d.startTop + d.delta - el.offsetTop}px)`
    }

    // The new place: how many other rows have their middle above the held
    // row's middle. Measured on the layout, not the sliding rows, so it does
    // not flicker while they move.
    const middle = d.startTop + d.delta + d.height / 2
    let to = 0
    for (const q of list) {
      if (q.id === d.id) continue
      const r = rows.current.get(q.id)
      if (r && r.offsetTop + r.offsetHeight / 2 < middle) to++
    }
    const from = list.findIndex((q) => q.id === d.id)
    if (to === from) return
    const next = [...list]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setSurvey({ ...survey, questions: next })
  }

  function endDrag() {
    const d = drag.current
    drag.current = null
    if (!d?.started) return
    setDragId(null)
    // Settle the held row into its place.
    const el = rows.current.get(d.id)
    if (el) {
      el.style.transition = calm ? 'none' : 'transform 200ms cubic-bezier(0.2, 0.7, 0.3, 1)'
      el.style.transform = ''
    }
    const list = survey?.questions ?? []
    if (list.map((q) => q.id).join() !== d.order) saveOrder(list)
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
        formType={survey?.form_type ?? 'survey'}
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
            Deactivate survey
          </AdminButton>
        ) : (
          <AdminButton variant="success" onClick={() => setSurveyStatus('open')}>
            Activate survey
          </AdminButton>
        )}
      </div>

      {survey.status !== 'open' && (
        <p className="text-micro text-slate">
          Attendees see a question only while the survey is active <em>and</em> the question is
          active.
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
            <div
              key={q.id}
              ref={(el) => {
                if (el) rows.current.set(q.id, el)
                else rows.current.delete(q.id)
              }}
              onPointerDown={(e) => startDrag(e, q.id)}
              onPointerMove={dragMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className={cn(
                'relative rounded-sm transition-shadow duration-200',
                dragId === q.id
                  ? 'z-10 cursor-grabbing select-none shadow-cardHover ring-2 ring-gold-500'
                  : 'cursor-grab',
              )}
            >
              <AdminCard interactive>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    aria-label={`Drag to reorder: ${q.question.en}. Or press the up and down arrow keys.`}
                    title="Drag to reorder"
                    data-grip
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp') {
                        e.preventDefault()
                        move(i, -1)
                      } else if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        move(i, 1)
                      }
                    }}
                    style={{ touchAction: 'none' }}
                    className={cn(
                      'grid h-10 w-7 shrink-0 place-items-center rounded-sm text-slate hover:bg-[#F1F1EF] hover:text-navy-900',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50',
                    )}
                  >
                    <svg viewBox="0 0 10 16" className="h-4 w-2.5" fill="currentColor" aria-hidden>
                      {[2, 8, 14].map((y) => (
                        <g key={y}>
                          <circle cx="2" cy={y} r="1.5" />
                          <circle cx="8" cy={y} r="1.5" />
                        </g>
                      ))}
                    </svg>
                  </button>
                  <span className="tnum w-6 text-[0.85rem] font-semibold text-gold-700">
                    {i + 1}
                  </span>
                  <div className="min-w-[12rem] flex-1">
                    {q.section && (
                      <p className="text-micro font-semibold text-gold-700">
                        New page: {q.section.title.en}
                      </p>
                    )}
                    <p className="text-[0.88rem] font-semibold text-navy-950">{q.question.en}</p>
                    <p className="text-micro text-slate">
                      {TYPE_LABEL[q.type]} · {q.is_required ? 'Required' : 'Optional'} ·{' '}
                      {q.responses_count ?? 0} answers
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {q.status === 'open' ? (
                      <AdminButton variant="danger" onClick={() => setQuestionStatus(q, 'closed')}>
                        Deactivate
                      </AdminButton>
                    ) : (
                      <AdminButton variant="success" onClick={() => setQuestionStatus(q, 'open')}>
                        Activate
                      </AdminButton>
                    )}
                    <AdminButton variant="quiet" onClick={() => setEditing(q)}>
                      Edit
                    </AdminButton>
                    <AdminButton variant="danger" onClick={() => remove(q)}>
                      Remove
                    </AdminButton>
                  </div>
                </div>
              </AdminCard>
            </div>
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
        <SurveyResults key={orderSaved} surveyId={survey.id} live={survey.status === 'open'} />
      </section>
    </div>
  )
}
