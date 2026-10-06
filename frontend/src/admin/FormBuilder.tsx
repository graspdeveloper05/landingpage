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
}: {
  survey: AdminSurvey
  setSurvey: React.Dispatch<React.SetStateAction<AdminSurvey | null>>
  /** A new order was saved; the results below follow it. */
  onOrderSaved: () => void
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
  const timers = useRef(new Map<number, number>())
  const versions = useRef(new Map<number, number>())
  const [pending, setPending] = useState<Set<number>>(new Set())
  const [inflight, setInflight] = useState(0)
  const [failed, setFailed] = useState<Record<number, string[]>>({})
  const [busy, setBusy] = useState(false)

  const draftOf = useCallback((q: AdminSurveyQuestion) => drafts[q.id] ?? fromQuestion(q), [drafts])

  const flush = useCallback(
    async (id: number) => {
      window.clearTimeout(timers.current.get(id))
      timers.current.delete(id)
      const d = draftsRef.current[id]
      if (!d) return
      const problems = problemsOf(d, survey.form_type)
      if (problems.length > 0) {
        setFailed((f) => ({ ...f, [id]: problems }))
        return
      }
      const version = versions.current.get(id) ?? 0
      setInflight((n) => n + 1)
      try {
        const saved = await adminApi.put<AdminSurveyQuestion>(
          `/admin/survey-questions/${id}`,
          toPayload(d),
        )
        setSurvey((s) =>
          s ? { ...s, questions: (s.questions ?? []).map((q) => (q.id === id ? saved : q)) } : s,
        )
        setFailed(({ [id]: _cleared, ...rest }) => rest)
        // Typed into again while this was saving: the next save carries it.
        if ((versions.current.get(id) ?? 0) === version) {
          setPending((p) => {
            const next = new Set(p)
            next.delete(id)
            return next
          })
        }
      } catch (e) {
        const message =
          e instanceof AdminError
            ? (Object.values(e.fields)[0] ?? e.message)
            : 'Could not reach the server. It will try again when you next type.'
        setFailed((f) => ({ ...f, [id]: [message] }))
      } finally {
        setInflight((n) => n - 1)
      }
    },
    [setSurvey, survey.form_type],
  )

  function change(id: number, next: Draft) {
    setDrafts((all) => ({ ...all, [id]: next }))
    draftsRef.current = { ...draftsRef.current, [id]: next }
    versions.current.set(id, (versions.current.get(id) ?? 0) + 1)
    setPending((p) => new Set(p).add(id))
    window.clearTimeout(timers.current.get(id))
    timers.current.set(
      id,
      window.setTimeout(() => flush(id), SAVE_AFTER_MS),
    )
  }

  // Leaving with changes not yet saved: send them, and warn if the tab closes.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (pending.size > 0) e.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [pending])
  useEffect(
    () => () => {
      timers.current.forEach((_, id) => flush(id))
    },
    [flush],
  )

  function open(id: number | null) {
    if (openId !== null && openId !== id && pending.has(openId)) flush(openId)
    setOpenId(id)
    if (id !== freshId) setFreshId(null)
  }

  // ------------------------------------------------------------ add, copy, delete

  async function saveOrder(list: AdminSurveyQuestion[]) {
    try {
      await adminApi.post(`/admin/surveys/${survey.id}/questions/reorder`, {
        ids: list.map((q) => q.id),
      })
      onOrderSaved()
    } catch {
      toast.error('Could not save the new order.')
    }
  }

  /** A new question (or page break) after the open one, or at the end. */
  async function add(draft: Draft) {
    setBusy(true)
    try {
      const created = await adminApi.post<AdminSurveyQuestion>(
        `/admin/surveys/${survey.id}/questions`,
        toPayload(draft),
      )
      const at =
        openId !== null ? questions.findIndex((q) => q.id === openId) + 1 : questions.length
      const next = [...questions]
      next.splice(at, 0, { ...created, responses_count: 0 })
      setSurvey((s) => (s ? { ...s, questions: next } : s))
      setDrafts((all) => ({ ...all, [created.id]: draft }))
      if (at < questions.length) saveOrder(next)
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
    const answers = q.responses_count ?? 0
    const extra = answers
      ? ` Its ${answers} ${answers === 1 ? 'answer' : 'answers'} will be deleted too.`
      : ''
    if (!confirm(`Delete "${draftOf(q).question.en || 'this question'}"?${extra}`)) return
    window.clearTimeout(timers.current.get(q.id))
    timers.current.delete(q.id)
    try {
      await adminApi.del(`/admin/survey-questions/${q.id}`)
      setSurvey((s) =>
        s ? { ...s, questions: (s.questions ?? []).filter((x) => x.id !== q.id) } : s,
      )
      setPending((p) => {
        const next = new Set(p)
        next.delete(q.id)
        return next
      })
      setFailed(({ [q.id]: _gone, ...rest }) => rest)
      if (openId === q.id) setOpenId(null)
      toast.success('Question deleted.')
    } catch (e) {
      toast.error(e instanceof AdminError ? e.message : 'Could not delete that question.')
    }
  }

  // ------------------------------------------------------------------- reorder

  /** Keyboard on the grip: arrow up or down moves the question one place. */
  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= questions.length) return
    const next = [...questions]
    ;[next[index], next[target]] = [next[target], next[index]]
    reordering.current = true
    setSurvey((s) => (s ? { ...s, questions: next } : s))
    saveOrder(next)
  }

  // Dragging a card: press anywhere on a closed card, or on the grip of the
  // open one (its boxes are for typing), and move. The card follows the
  // pointer, the others slide out of its way, and the order is saved once,
  // when it is let go. On a touch screen only the grip drags, so a swipe
  // still scrolls the page.
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
    if (e.button !== 0) return
    const target = e.target as Element
    const onGrip = !!target.closest('[data-grip]')
    // The open card is for typing: it moves only by its grip. A closed card
    // moves from anywhere but its buttons.
    if (!onGrip && (id === openId || target.closest('button, a, input, select, textarea'))) return
    if (e.pointerType === 'touch' && !onGrip) return
    const el = rows.current.get(id)
    if (!el) return
    if (onGrip) e.preventDefault()
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
      order: questions.map((q) => q.id).join(),
    }
  }

  function dragMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d) return
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
    const middle = d.startTop + d.delta + d.height / 2
    let to = 0
    for (const q of questions) {
      if (q.id === d.id) continue
      const r = rows.current.get(q.id)
      if (r && r.offsetTop + r.offsetHeight / 2 < middle) to++
    }
    const from = questions.findIndex((q) => q.id === d.id)
    if (to === from) return
    const next = [...questions]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    reordering.current = true
    setSurvey((s) => (s ? { ...s, questions: next } : s))
  }

  function endDrag() {
    const d = drag.current
    drag.current = null
    if (!d?.started) return
    // The pointerup that ends a drag must not also open the card under it.
    suppressClick.current = true
    window.setTimeout(() => (suppressClick.current = false), 0)
    setDragId(null)
    const el = rows.current.get(d.id)
    if (el) {
      el.style.transition = calm ? 'none' : 'transform 200ms cubic-bezier(0.2, 0.7, 0.3, 1)'
      el.style.transform = ''
    }
    if (questions.map((q) => q.id).join() !== d.order) saveOrder(questions)
  }
  const suppressClick = useRef(false)

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
              onPointerMove={dragMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onClickCapture={(e) => {
                if (suppressClick.current) {
                  e.stopPropagation()
                  e.preventDefault()
                }
              }}
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
