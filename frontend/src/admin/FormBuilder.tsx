import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import {
  adminApi,
  AdminError,
  type AdminSurvey,
  type AdminSurveyQuestion,
  type Locale,
} from './client'
import { useToast } from './Toast'
import { surveyUrl } from './SurveyShare'
import { Dots, QuestionCard } from './QuestionCard'
import {
  LANGUAGES,
  blankDraft,
  fromQuestion,
  problemsOf,
  toPayload,
  translated,
  type Draft,
} from './formDraft'

/** How long after the last keystroke a change is saved. */
const SAVE_AFTER_MS = 700

/**
 * The form's questions, built the way Google Forms builds them: every
 * question a card, edited where it stands, saved by itself a moment after
 * typing stops. One switch at the top turns every text into its Bahasa
 * Malaysia (or Chinese, or Tamil) translation. Cards are dragged to reorder.
 */
export function FormBuilder({
  survey,
  setSurvey,
  onOrderSaved,
  onUnsavedChange,
}: {
  survey: AdminSurvey
  setSurvey: React.Dispatch<React.SetStateAction<AdminSurvey | null>>
  /** A new order was saved; the results below follow it. */
  onOrderSaved: () => void
  /** How many questions have changes not saved yet. */
  onUnsavedChange?: (count: number) => void
}) {
  const toast = useToast()
  const questions = useMemo(() => survey.questions ?? [], [survey.questions])
  const [drafts, setDrafts] = useState<Record<number, Draft>>({})
  const draftsRef = useRef(drafts)
  draftsRef.current = drafts
  const [openId, setOpenId] = useState<number | null>(null)
  const [freshId, setFreshId] = useState<number | null>(null)
  const [lang, setLang] = useState<Locale>('en')

  // Saving: what is waiting, what is on its way, what could not go.
  // One save per question at a time; a change made while one is on its way
  // is sent when it lands, so the newest wording is always the last to arrive.
  const timers = useRef(new Map<number, number>())
  const versions = useRef(new Map<number, number>())
  const saving = useRef(new Set<number>())
  const again = useRef(new Set<number>())
  const deleted = useRef(new Set<number>())
  const [pending, setPending] = useState<Set<number>>(new Set())
  const [inflight, setInflight] = useState(0)
  const [failed, setFailed] = useState<Record<number, string[]>>({})
  const [busy, setBusy] = useState(false)
  const questionsRef = useRef(questions)
  questionsRef.current = questions

  const draftOf = useCallback((q: AdminSurveyQuestion) => drafts[q.id] ?? fromQuestion(q), [drafts])

  const dropPending = (id: number) =>
    setPending((p) => {
      if (!p.has(id)) return p
      const next = new Set(p)
      next.delete(id)
      return next
    })
  const dropFailed = (id: number) =>
    setFailed((f) => {
      if (!(id in f)) return f
      const { [id]: _gone, ...rest } = f
      return rest
    })

  const replaceQuestion = useCallback(
    (saved: AdminSurveyQuestion) =>
      setSurvey((s) =>
        s
          ? { ...s, questions: (s.questions ?? []).map((q) => (q.id === saved.id ? saved : q)) }
          : s,
      ),
    [setSurvey],
  )

  /**
   * Someone answered this question while it was being edited: its kind and
   * options are now locked. The stored structure comes back, the wording
   * typed here is kept, and the wording is saved again.
   */
  const lockAfterAnswers = useCallback(
    async (id: number) => {
      try {
        const fresh = await adminApi.get<AdminSurvey>(`/admin/surveys/${survey.id}`)
        const stored = fresh.questions?.find((q) => q.id === id)
        if (!stored) return
        replaceQuestion(stored)
        const mine = draftsRef.current[id]
        const base = fromQuestion(stored)
        const merged: Draft = mine
          ? {
              ...base,
              question: mine.question,
              help: mine.help,
              section: mine.section,
              required: mine.required,
              status: mine.status,
            }
          : base
        setDrafts((all) => ({ ...all, [id]: merged }))
        draftsRef.current = { ...draftsRef.current, [id]: merged }
        versions.current.set(id, (versions.current.get(id) ?? 0) + 1)
        toast.error(
          'People have started answering this question, so its type and options are now locked. Your wording was kept; changes to the options were undone.',
        )
        flushRef.current(id)
      } catch {
        // The error message on the card still says what happened.
      }
    },
    [replaceQuestion, survey.id, toast],
  )

  const flushRef = useRef<(id: number) => void>(() => {})
  const flush = useCallback(
    async (id: number) => {
      window.clearTimeout(timers.current.get(id))
      timers.current.delete(id)
      if (deleted.current.has(id)) return
      if (saving.current.has(id)) {
        again.current.add(id)
        return
      }
      const d = draftsRef.current[id]
      if (!d) return
      const problems = problemsOf(d, survey.form_type)
      if (problems.length > 0) {
        setFailed((f) => ({ ...f, [id]: problems }))
        return
      }
      const version = versions.current.get(id) ?? 0
      saving.current.add(id)
      setInflight((n) => n + 1)
      try {
        const saved = await adminApi.put<AdminSurveyQuestion>(
          `/admin/survey-questions/${id}`,
          toPayload(d),
        )
        if (deleted.current.has(id)) return
        replaceQuestion(saved)
        // Only the newest version clears the state: an older save landing
        // late must not hide a newer problem.
        if ((versions.current.get(id) ?? 0) === version) {
          dropFailed(id)
          dropPending(id)
        }
      } catch (e) {
        if (deleted.current.has(id)) return
        if (e instanceof AdminError && (e.fields.options || e.fields.type)) {
          setFailed((f) => ({ ...f, [id]: [e.fields.options ?? e.fields.type] }))
          lockAfterAnswers(id)
        } else {
          const message =
            e instanceof AdminError
              ? (Object.values(e.fields)[0] ?? e.message)
              : 'Could not reach the server. Your change is kept here; it saves when you next type.'
          setFailed((f) => ({ ...f, [id]: [message] }))
        }
      } finally {
        saving.current.delete(id)
        setInflight((n) => n - 1)
        if (again.current.has(id)) {
          again.current.delete(id)
          flushRef.current(id)
        }
      }
    },
    [lockAfterAnswers, replaceQuestion, survey.form_type],
  )
  flushRef.current = flush

  function change(id: number, next: Draft) {
    setDrafts((all) => ({ ...all, [id]: next }))
    draftsRef.current = { ...draftsRef.current, [id]: next }
    versions.current.set(id, (versions.current.get(id) ?? 0) + 1)
    setPending((p) => new Set(p).add(id))
    window.clearTimeout(timers.current.get(id))
    timers.current.set(
      id,
      window.setTimeout(() => flushRef.current(id), SAVE_AFTER_MS),
    )
  }

  // What is not saved yet, for the page around the builder to warn about.
  const unsaved = new Set([...pending, ...Object.keys(failed).map(Number)]).size
  useEffect(() => {
    onUnsavedChange?.(unsaved)
  }, [unsaved, onUnsavedChange])

  // Closing the tab with changes not saved: the browser asks first. Leaving
  // the builder inside the panel: whatever is waiting is sent on the way out.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (unsaved > 0) e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [unsaved])
  useEffect(() => {
    const waiting = timers.current
    return () => waiting.forEach((_, id) => flushRef.current(id))
  }, [])

  function open(id: number | null) {
    if (openId !== null && openId !== id && pending.has(openId)) flush(openId)
    setOpenId(id)
    if (id !== freshId) setFreshId(null)
  }

  // ------------------------------------------------------------ add, copy, delete

  // The order is saved one request at a time; the newest order waits for
  // the one on its way, so quick moves cannot land out of turn.
  const orderBusy = useRef(false)
  const orderNext = useRef<number[] | null>(null)
  const orderTimer = useRef<number | undefined>(undefined)

  async function sendOrder() {
    if (orderBusy.current || !orderNext.current) return
    const ids = orderNext.current
    orderNext.current = null
    orderBusy.current = true
    try {
      await adminApi.post(`/admin/surveys/${survey.id}/questions/reorder`, { ids })
      if (!orderNext.current) onOrderSaved()
    } catch {
      toast.error('Could not save the new order.')
    } finally {
      orderBusy.current = false
      if (orderNext.current) sendOrder()
    }
  }

  function saveOrder(list: AdminSurveyQuestion[], wait = 0) {
    orderNext.current = list.map((q) => q.id)
    window.clearTimeout(orderTimer.current)
    orderTimer.current = window.setTimeout(sendOrder, wait)
  }

  /**
   * A new question (or page break) after the open one, or at the end. On a
   * form attendees can answer now, it starts hidden, so nobody meets
   * "Untitled question" half-way through its writing.
   */
  async function add(draft: Draft) {
    setBusy(true)
    const start: Draft = { ...draft, status: survey.status === 'open' ? 'closed' : 'open' }
    try {
      const created = await adminApi.post<AdminSurveyQuestion>(
        `/admin/surveys/${survey.id}/questions`,
        toPayload(start),
      )
      const list = questionsRef.current
      const at = openId !== null ? list.findIndex((q) => q.id === openId) + 1 : list.length
      const next = [...list]
      next.splice(at, 0, { ...created, responses_count: 0 })
      setSurvey((s) => (s ? { ...s, questions: next } : s))
      setDrafts((all) => ({ ...all, [created.id]: start }))
      draftsRef.current = { ...draftsRef.current, [created.id]: start }
      if (at < list.length) saveOrder(next)
      open(created.id)
      setFreshId(created.id)
      window.setTimeout(
        () => rows.current.get(created.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        50,
      )
    } catch (e) {
      toast.error(e instanceof AdminError ? e.message : 'Could not add a question.')
    } finally {
      setBusy(false)
    }
  }

  async function duplicate(q: AdminSurveyQuestion) {
    const d = draftOf(q)
    const problems = problemsOf(d, survey.form_type)
    if (problems.length > 0) {
      setFailed((f) => ({ ...f, [q.id]: problems }))
      return
    }
    setOpenId(q.id)
    await add({ ...d, section: null })
  }

  async function remove(q: AdminSurveyQuestion) {
    // The answers so far, asked fresh: the page may have been open a while.
    let answers = q.responses_count ?? 0
    try {
      const fresh = await adminApi.get<AdminSurvey>(`/admin/surveys/${survey.id}`)
      answers = fresh.questions?.find((x) => x.id === q.id)?.responses_count ?? answers
    } catch {
      // Use what the page already knows.
    }
    const extra = answers
      ? ` Its ${answers} ${answers === 1 ? 'answer' : 'answers'} will be deleted too.`
      : ''
    if (!confirm(`Delete "${draftOf(q).question.en || 'this question'}"?${extra}`)) return
    window.clearTimeout(timers.current.get(q.id))
    timers.current.delete(q.id)
    deleted.current.add(q.id)
    try {
      await adminApi.del(`/admin/survey-questions/${q.id}`)
      setSurvey((s) =>
        s ? { ...s, questions: (s.questions ?? []).filter((x) => x.id !== q.id) } : s,
      )
      dropPending(q.id)
      dropFailed(q.id)
      if (openId === q.id) setOpenId(null)
      toast.success('Question deleted.')
    } catch (e) {
      // Still there: its unsaved changes go back to being saved.
      deleted.current.delete(q.id)
      if (pending.has(q.id)) flush(q.id)
      toast.error(e instanceof AdminError ? e.message : 'Could not delete that question.')
    }
  }

  // ------------------------------------------------------------------- reorder

  /** Keyboard on the grip: arrow up or down moves the question one place. */
  function move(index: number, direction: -1 | 1) {
    const list = questionsRef.current
    const target = index + direction
    if (target < 0 || target >= list.length) return
    const next = [...list]
    ;[next[index], next[target]] = [next[target], next[index]]
    reordering.current = true
    setSurvey((s) => (s ? { ...s, questions: next } : s))
    // Saved once the keys stop, not on every press of a held key.
    saveOrder(next, 400)
  }

  // Dragging a card: press anywhere on a closed card, or on the grip of the
  // open one (its boxes are for typing), and move. The card follows the
  // pointer, the others slide out of its way, and the order is saved once,
  // when it is let go. On a touch screen only the grip drags, so a swipe
  // still scrolls the page. The moves are followed on the window, so the
  // drag ends wherever the button is let go.
  const [dragId, setDragId] = useState<number | null>(null)
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
  const lastTops = useRef(new Map<number, number>())
  const reordering = useRef(false)
  const calm =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  // After each change of order: the held card stays under the pointer; every
  // other card that moved starts where it was and slides to where it is now.
  useLayoutEffect(() => {
    const d = drag.current
    rows.current.forEach((el, id) => {
      const top = el.offsetTop
      if (d?.started && id === d.id) {
        el.style.transition = 'none'
        el.style.transform = `translateY(${d.startTop + d.delta - top}px)`
      } else {
        const was = lastTops.current.get(id)
        // Only a change of order slides; a card opening or closing does not.
        if (!calm && reordering.current && was !== undefined && was !== top) {
          el.style.transition = 'none'
          el.style.transform = `translateY(${was - top}px)`
          void el.offsetHeight
          el.style.transition = 'transform 220ms cubic-bezier(0.2, 0.7, 0.3, 1)'
          el.style.transform = ''
        }
      }
      lastTops.current.set(id, top)
    })
    reordering.current = false
  })

  function startDrag(e: React.PointerEvent<HTMLDivElement>, id: number) {
    if (e.button !== 0 || drag.current) return
    const target = e.target as Element
    const onGrip = !!target.closest('[data-grip]')
    // The open card is for typing: it moves only by its grip. A closed card
    // moves from anywhere but its buttons.
    if (!onGrip && (id === openId || target.closest('button, a, input, select, textarea'))) return
    if (e.pointerType === 'touch' && !onGrip) return
    const el = rows.current.get(id)
    if (!el) return
    if (onGrip) e.preventDefault()
    drag.current = {
      id,
      startY: e.pageY,
      startTop: el.offsetTop,
      height: el.offsetHeight,
      delta: 0,
      started: false,
      order: questionsRef.current.map((q) => q.id).join(),
    }
    window.addEventListener('pointermove', dragMove)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
  }

  function dragMove(e: PointerEvent) {
    const d = drag.current
    if (!d) return
    // The button came up somewhere the page did not hear it: finish.
    if (e.buttons === 0) return endDrag()
    d.delta = e.pageY - d.startY
    // A few pixels first, so a press that was meant as a click stays one.
    if (!d.started) {
      if (Math.abs(d.delta) < 5) return
      d.started = true
      setDragId(d.id)
      window.getSelection()?.removeAllRanges()
    }
    if (e.clientY < 80) window.scrollBy(0, -14)
    else if (e.clientY > window.innerHeight - 80) window.scrollBy(0, 14)

    const el = rows.current.get(d.id)
    if (el) {
      el.style.transition = 'none'
      el.style.transform = `translateY(${d.startTop + d.delta - el.offsetTop}px)`
    }

    // The new place: how many other cards have their middle above the held
    // card's middle, measured on the layout so sliding cards do not flicker.
    const list = questionsRef.current
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
    reordering.current = true
    questionsRef.current = next
    setSurvey((s) => (s ? { ...s, questions: next } : s))
  }

  function endDrag() {
    window.removeEventListener('pointermove', dragMove)
    window.removeEventListener('pointerup', endDrag)
    window.removeEventListener('pointercancel', endDrag)
    const d = drag.current
    drag.current = null
    if (!d?.started) return
    // The click that follows letting go must not open the card under it.
    const swallow = (ev: MouseEvent) => {
      ev.stopPropagation()
      ev.preventDefault()
    }
    window.addEventListener('click', swallow, { capture: true, once: true })
    window.setTimeout(() => window.removeEventListener('click', swallow, true), 0)
    setDragId(null)
    const el = rows.current.get(d.id)
    if (el) {
      el.style.transition = calm ? 'none' : 'transform 200ms cubic-bezier(0.2, 0.7, 0.3, 1)'
      el.style.transform = ''
    }
    const list = questionsRef.current
    if (list.map((q) => q.id).join() !== d.order) saveOrder(list)
  }

  // ---------------------------------------------------------------- the page

  const allDrafts = questions.map(draftOf)
  const progress = (code: Locale) => translated(allDrafts, code)
  const failedCount = Object.keys(failed).length
  const status =
    failedCount > 0
      ? {
          tone: 'error',
          text: `${failedCount} ${failedCount === 1 ? 'question needs' : 'questions need'} attention — not saved`,
        }
      : inflight > 0 || pending.size > 0
        ? { tone: 'busy', text: 'Saving…' }
        : { tone: 'ok', text: 'All changes saved' }

  return (
    <section>
      {/* The bar that stays in view: language, save state, preview. */}
      <div className="sticky top-0 z-20 -mx-1 mb-3 flex flex-wrap items-center gap-3 rounded-md border border-[#E6E5E1] bg-white/95 px-3 py-2 shadow-[0_4px_16px_-10px_rgba(11,33,64,0.3)] backdrop-blur">
        <div role="tablist" aria-label="Language you are editing" className="flex flex-wrap gap-1">
          {LANGUAGES.map((l) => {
            const p = l.code === 'en' ? null : progress(l.code)
            const done = p && p.total > 0 && p.done === p.total
            return (
              <button
                key={l.code}
                type="button"
                role="tab"
                aria-selected={lang === l.code}
                onClick={() => setLang(l.code)}
                className={cn(
                  'flex min-h-[32px] items-center gap-1.5 rounded-sm px-2.5 text-[0.78rem] font-semibold transition-colors',
                  lang === l.code ? 'bg-navy-900 text-cream' : 'text-navy-900 hover:bg-[#F1F1EF]',
                )}
              >
                {l.label}
                {p && p.total > 0 && (
                  <span
                    className={cn(
                      'tnum rounded-full px-1.5 text-[0.68rem]',
                      done
                        ? 'bg-green-100 text-green-800'
                        : lang === l.code
                          ? 'bg-white/15 text-cream'
                          : 'bg-amber-100 text-amber-900',
                    )}
                  >
                    {done ? '✓' : `${p.done}/${p.total}`}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <span
          aria-live="polite"
          className={cn(
            'ml-auto flex items-center gap-1.5 text-micro font-semibold',
            status.tone === 'error'
              ? 'text-red-700'
              : status.tone === 'busy'
                ? 'text-slate'
                : 'text-green-700',
          )}
        >
          {status.tone === 'ok' && <span aria-hidden>✓</span>}
          {status.text}
        </span>
        <a
          href={surveyUrl(survey)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[32px] items-center gap-1.5 rounded-sm border border-[#DDDCD8] px-3 text-[0.78rem] font-semibold text-navy-900 hover:border-navy-600"
        >
          Preview
          <svg
            viewBox="0 0 12 12"
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M4.5 2.5h5v5M9.5 2.5l-7 7" />
          </svg>
        </a>
      </div>

      {lang !== 'en' && (
        <p className="mb-3 rounded-sm bg-amber-50 px-3 py-2 text-micro text-amber-900">
          Translating into {LANGUAGES.find((l) => l.code === lang)?.label}: open a question and type
          the translation under each grey English line. Anything left empty shows in English. Switch
          back to English to add or change questions.
        </p>
      )}

      {questions.length === 0 ? (
        <div className="rounded-md border border-dashed border-[#CFCDC7] bg-white px-6 py-10 text-center">
          <p className="text-[0.95rem] font-semibold text-navy-950">No questions yet</p>
          <p className="mt-1 text-small text-slate">
            Start with the first one; it saves as you type.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => add(blankDraft())}
            className="mt-4 min-h-[38px] rounded-sm bg-navy-900 px-5 text-[0.82rem] font-semibold text-cream hover:bg-navy-800"
          >
            + Add the first question
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div
              key={q.id}
              ref={(el) => {
                if (el) rows.current.set(q.id, el)
                else rows.current.delete(q.id)
              }}
              onPointerDown={(e) => startDrag(e, q.id)}
              className={cn(
                'relative rounded-md',
                dragId === q.id &&
                  'z-10 select-none [&>div]:shadow-cardHover [&>div]:ring-2 [&>div]:ring-gold-500',
              )}
            >
              <QuestionCard
                number={i + 1}
                question={q}
                draft={draftOf(q)}
                open={openId === q.id}
                fresh={freshId === q.id}
                lang={lang}
                formType={survey.form_type}
                problems={failed[q.id] ?? []}
                onOpen={() => open(q.id)}
                onClose={() => open(null)}
                onChange={(next) => change(q.id, next)}
                onDuplicate={() => duplicate(q)}
                onDelete={() => remove(q)}
                grip={
                  <button
                    type="button"
                    data-grip
                    aria-label={`Move question ${i + 1}. Drag, or press the up and down arrow keys.`}
                    title="Drag to reorder"
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
                      'grid h-8 w-6 cursor-grab place-items-center rounded-sm text-[#A9A69E] hover:bg-[#F1F1EF] hover:text-navy-900',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50',
                      dragId === q.id && 'cursor-grabbing',
                    )}
                  >
                    <Dots />
                  </button>
                }
              />
            </div>
          ))}
        </div>
      )}

      {questions.length > 0 && lang === 'en' && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 rounded-md border border-dashed border-[#CFCDC7] bg-white/60 px-4 py-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => add(blankDraft())}
            className="min-h-[38px] rounded-sm bg-navy-900 px-5 text-[0.82rem] font-semibold text-cream hover:bg-navy-800 disabled:opacity-60"
          >
            + Add question
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => add(blankDraft(true))}
            className="min-h-[38px] rounded-sm border border-[#CFCDC7] bg-white px-5 text-[0.82rem] font-semibold text-navy-900 hover:border-navy-600 disabled:opacity-60"
          >
            + Add new page
          </button>
          <span className="w-full text-center text-micro text-slate">
            {openId !== null ? 'Adds below the open question.' : 'Adds at the end.'} Drag a card to
            change the order.
          </span>
        </div>
      )}
    </section>
  )
}
