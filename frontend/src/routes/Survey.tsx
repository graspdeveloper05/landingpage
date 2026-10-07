import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/cn'
import { Button, ButtonLink } from '@/components/ui/Button'
import { PageHero } from '@/components/layout/PageHero'
import { FormBackdrop } from '@/components/survey/FormBackdrop'
import { BANNER_TEXT, FormIntro, type FormProgress } from '@/components/survey/FormHeader'
import { Smiley } from '@/components/survey/Smiley'
import {
  EMPTY_IDENTITY,
  OFF_SCALE,
  newSubmissionId,
  pick,
  savedIdentity,
  saveIdentity,
  surveyApi,
  SurveyError,
  type Detail,
  type Identity,
  type PublicQuestion,
  type PublicSurvey,
  type TestimonialCredit,
  type TestimonialEntry,
  type Text,
} from '@/services/survey'

/**
 * One form, at its own link: a survey, the participant feedback form, or
 * questions from the floor. Laid out as the organising team's mock forms
 * are: a navy masthead carrying each section's heading, then the questions
 * as white cards on the cream page, a section to a page.
 */
export function Survey() {
  const { id = '' } = useParams()
  const { t, locale } = useI18n()
  const [identity, setIdentity] = useState(() => savedIdentity(id))
  const [survey, setSurvey] = useState<PublicSurvey | null>(null)
  const [missing, setMissing] = useState(false)
  const [thanked, setThanked] = useState(false)
  const [page, setPage] = useState<FormProgress>({ at: 0, steps: [], intro: '' })
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const load = useCallback(
    () =>
      surveyApi
        .get(id, identity?.email || undefined)
        .then((s) => {
          setSurvey(s)
          setMissing(false)
        })
        .catch((e) => {
          if (e instanceof SurveyError && e.status === 404) setMissing(true)
        }),
    [id, identity?.email],
  )

  useEffect(() => {
    load()
  }, [load])

  // Feedback forms at /feedback/..., surveys at /survey/...: a link with the
  // other prefix (an older QR code, say) moves to the right one.
  useEffect(() => {
    if (!survey) return
    const base = survey.form_type === 'feedback' ? '/feedback/' : '/survey/'
    if (!pathname.startsWith(base)) navigate(base + id, { replace: true })
  }, [survey, pathname, id, navigate])

  // Every ten seconds while the survey is open and on screen, so a question
  // the moderator opens appears by itself. A closed survey, or a tab in the
  // background, asks nothing: a hall of phones shares one Wi-Fi address.
  const live = survey?.status === 'open' && !missing
  useEffect(() => {
    if (!live) return
    const timer = window.setInterval(() => {
      if (!document.hidden) load()
    }, 10000)
    return () => window.clearInterval(timer)
  }, [live, load])

  // Moving to another survey's link: its own details, or none.
  useEffect(() => {
    setIdentity(savedIdentity(id))
  }, [id])

  // "Back" after the thank-you starts again. A form that knows people by
  // email forgets them, so the next person on the same phone starts clean;
  // one without email keeps the name, for someone asking a second question.
  const again = useCallback(() => {
    setThanked(false)
    if (survey && survey.fields.email !== 'off') {
      saveIdentity(id, null)
      setIdentity(null)
    }
    window.scrollTo({ top: 0 })
  }, [id, survey])

  const formTitle = survey ? pick(survey.title, locale) : t('survey.title')
  const showForm =
    !!survey &&
    !thanked &&
    !missing &&
    survey.status === 'open' &&
    survey.questions.some((q) => !q.answered)
  const total = survey?.questions.length ?? 0
  const description = showForm && survey.description ? pick(survey.description, locale) : ''
  // A short description goes under the title in the banner, as on the other
  // pages; a long one would not fit there, so it opens the card instead.
  const shortDescription = description.length <= BANNER_TEXT && !description.includes('\n')

  return (
    <>
      {/* Room at the bottom of the banner for the form's first card, which
          overlaps its lower edge as in Google Forms. */}
      <PageHero
        title={formTitle}
        sub={shortDescription ? description || undefined : undefined}
        className="pb-16 sm:pb-20"
      />

      {/* flow-root keeps the column's negative margin to the column: without
          it the margin carries the whole section, background and all, up
          over the banner. */}
      <section className="relative isolate flow-root bg-cream-deep pb-24">
        <FormBackdrop />
        <div className="shell">
          <div className="relative z-10 mx-auto -mt-12 max-w-3xl space-y-6 sm:-mt-14">
            <FormIntro
              description={shortDescription ? undefined : description}
              meta={
                showForm && total > 1
                  ? t('survey.length', {
                      count: total,
                      minutes: Math.max(1, Math.round(total * 0.4)),
                    })
                  : undefined
              }
              progress={showForm ? page : undefined}
            />

            <div>
              {thanked ? (
                <Thanks
                  feedback={survey?.form_type === 'feedback'}
                  another={!!survey && survey.fields.email === 'off'}
                  onBack={again}
                />
              ) : missing ? (
                <Notice>{t('survey.missing')}</Notice>
              ) : !survey ? null : survey.status !== 'open' ? (
                <Notice>{t('survey.notOpen')}</Notice>
              ) : survey.questions.length === 0 ? (
                <Notice>{t('survey.wait')}</Notice>
              ) : (
                <AnswerForm
                  // A new person (details forgotten, or someone else's saved)
                  // starts on a clean form rather than the last one's details.
                  key={`${survey.id}-${identity?.email ?? ''}-${identity ? 1 : 0}`}
                  survey={survey}
                  surveyLink={id}
                  saved={identity}
                  onPage={setPage}
                  onDone={load}
                  onSubmitted={(who) => {
                    if (Object.values(who).some((v) => v.trim())) {
                      saveIdentity(id, who)
                      setIdentity(who)
                    }
                    setThanked(true)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  onFinished={again}
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

/** A closed, missing or waiting state. */
function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-hair bg-white px-6 py-12 text-center shadow-card">
      <p className="font-display text-h3 text-navy-950">{children}</p>
    </div>
  )
}

/**
 * After submitting, or on returning to a form already finished: a thank-you,
 * the way on to the programme, and the way back for the next person.
 */
function Thanks({
  feedback,
  another,
  onBack,
}: {
  feedback: boolean
  /** A form without email takes another submission: "Send another". */
  another?: boolean
  onBack: () => void
}) {
  const { t } = useI18n()

  return (
    <div
      role="status"
      className="anim-rise rounded-sm border border-hair bg-white px-6 py-12 text-center shadow-card sm:px-12"
    >
      {/* The tick draws itself and two waves leave it, as from the masthead. */}
      <span
        aria-hidden
        className="sv-pop relative mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-gold-500 bg-gold-500/10 text-navy-950"
      >
        <span className="sv-ring-out" />
        <span className="sv-ring-out" />
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
          <path
            d="M5 12.5l4.5 4.5L19 7.5"
            pathLength={1}
            className="sv-draw sv-draw--slow"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <h2
        className="anim-rise mx-auto mt-6 max-w-xl font-display text-[1.75rem] leading-snug text-navy-950 sm:text-[2.1rem]"
        style={{ animationDelay: '250ms' }}
      >
        {t(feedback ? 'survey.feedbackThanksTitle' : 'survey.thanksTitle')}
      </h2>
      <p
        className="anim-rise mx-auto mt-3 max-w-lg text-body text-slate"
        style={{ animationDelay: '350ms' }}
      >
        {t(feedback ? 'survey.feedbackThanksBody' : 'survey.thanksBody')}
      </p>
      <div
        className="anim-rise mt-9 flex flex-col justify-center gap-3 sm:flex-row"
        style={{ animationDelay: '450ms' }}
      >
        <ButtonLink to="/programme" withArrow>
          {t('survey.viewProgramme')}
        </ButtonLink>
        <Button type="button" variant="outlineNavy" onClick={onBack}>
          {another ? t('survey.sendAnother') : t('survey.backToSurvey')}
        </Button>
      </div>
    </div>
  )
}

/** Questions to a page when a form has no section headings. */
const PAGE_SIZE = 10

interface Page {
  section: { title: Text; intro?: Text | null } | null
  questions: PublicQuestion[]
  testimonial?: boolean
}

/**
 * A new page at each section heading; a form without headings is cut every
 * ten questions. A feedback form ends with a page for the testimonial.
 */
function paginate(questions: PublicQuestion[], feedback: boolean): Page[] {
  const sectioned = questions.some((q) => q.section)
  const pages: Page[] = []
  for (const q of questions) {
    const last = pages[pages.length - 1]
    if (!last || (sectioned ? !!q.section : last.questions.length >= PAGE_SIZE)) {
      pages.push({ section: q.section, questions: [q] })
    } else {
      last.questions.push(q)
    }
  }
  if (feedback) pages.push({ section: null, questions: [], testimonial: true })
  return pages
}

type DetailErrors = Partial<Record<Detail, string>>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Malaysian and international numbers, as the RSVP form accepts.
const MOBILE = /^\+?[0-9\s-]{8,16}$/

/** Each detail the form asks: given when required, well-formed when given. */
function checkDetails(
  fields: PublicSurvey['fields'],
  v: Identity,
  t: (k: string) => string,
): DetailErrors {
  const errors: DetailErrors = {}
  const asked = (d: Detail) => fields[d] !== 'off'
  const needed = (d: Detail) => fields[d] === 'required'
  if (needed('name') && !v.name.trim()) errors.name = t('survey.nameInvalid')
  if (asked('email') && (needed('email') || v.email.trim()) && !EMAIL.test(v.email.trim())) {
    errors.email = t('survey.emailInvalid')
  }
  if (asked('mobile') && (needed('mobile') || v.mobile.trim()) && !MOBILE.test(v.mobile.trim())) {
    errors.mobile = t('survey.mobileInvalid')
  }
  if (needed('organisation') && !v.organisation.trim()) errors.organisation = t('survey.required')
  return errors
}

/** Whether an answer counts as given, for each kind of question. */
function answered(q: PublicQuestion, value: string | undefined): boolean {
  if (!value?.trim()) return false
  if (q.type === 'grid') {
    const parts = value.split(',')
    return parts.length === (q.statements?.length ?? 0) && parts.every((p) => p !== '')
  }
  return true
}

/**
 * The questions, a page at a time, with one Submit at the end. Answers are
 * kept here, keyed by question, so the ten-second refresh that brings in a
 * newly opened question does not wipe what has been chosen for the others.
 */
function AnswerForm({
  survey,
  surveyLink,
  saved,
  onPage,
  onDone,
  onSubmitted,
  onFinished,
}: {
  survey: PublicSurvey
  surveyLink: string
  saved: Identity | null
  onPage: (page: FormProgress) => void
  onDone: () => void
  onSubmitted: (who: Identity) => void
  onFinished: () => void
}) {
  const { t, locale } = useI18n()
  const feedback = survey.form_type === 'feedback'
  const fields = survey.fields
  const asksDetails = Object.values(fields).some((m) => m !== 'off')

  const [who, setWho] = useState<Identity>(() => saved ?? EMPTY_IDENTITY)
  const [detailErrors, setDetailErrors] = useState<DetailErrors>({})
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [others, setOthers] = useState<Record<number, string>>({})
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [sent, setSent] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(0)
  // Which way the last page change went, so the next page's cards come in
  // from that side.
  const [backwards, setBackwards] = useState(false)
  const [testimonial, setTestimonial] = useState<TestimonialEntry>(EMPTY_TESTIMONIAL)
  const [testimonialErrors, setTestimonialErrors] = useState<TestimonialErrors>({})
  // One id for this filling-in, kept across a retry, so the admin reads one
  // response rather than loose answers.
  const submission = useRef(newSubmissionId())

  // A testimonial on a form that asks for a name credits it from there.
  const named = fields.name !== 'off'
  // A testimonial is sent only when written and permitted; without either,
  // the feedback goes on its own, as the form promises.
  const sharing = feedback && testimonial.quote.trim() !== '' && testimonial.consent

  const pending = survey.questions.filter((q) => !q.answered && !sent.has(q.id))
  const pages = useMemo(() => paginate(pending, feedback), [pending, feedback])
  const current = Math.min(page, pages.length - 1)
  const here = pages[current]
  const lastPage = current === pages.length - 1
  // Numbered by place in the whole form, answered ones included.
  const numberOf = (q: PublicQuestion) => survey.questions.indexOf(q) + 1
  const total = survey.questions.length

  // The masthead shows this page's section heading.
  // What each page is called in the steps: its section heading, "Your
  // details" for a first page that asks them, else "Part 2".
  const stepsKey = pages
    .map((p, i) =>
      p.testimonial
        ? t('survey.testimonialPageTitle')
        : p.section
          ? pick(p.section.title, locale)
          : i === 0 && asksDetails
            ? t('survey.detailsHeading')
            : t('survey.part', { n: i + 1 }),
    )
    .join('\u0001')
  const sectionIntro = here?.testimonial
    ? t('survey.testimonialPageIntro')
    : here?.section?.intro
      ? pick(here.section.intro, locale)
      : ''
  // Joined into one string so the effect runs when the names change, not on
  // every render's fresh array.
  useEffect(() => {
    onPage({ at: current, steps: stepsKey.split('\u0001'), intro: sectionIntro })
  }, [stepsKey, sectionIntro, current, onPage])

  // The Next / Submit row, for the last question on a page to bring up.
  const actions = useRef<HTMLDivElement>(null)

  /**
   * After a one-tap answer (a choice, a scale, stars or a face, or the last
   * row of a table), the next question comes into view, as in Typeform; the
   * last one on the page brings up the Next or Submit button. Only when the
   * question goes from unanswered to answered, so changing an answer leaves
   * the page where it is. Ticks and typing never move it: there may be more
   * to come. "Other" waits for its text.
   */
  const moveOn = (q: PublicQuestion, before: string | undefined, value: string) => {
    const otherPicked = q.has_other && value === String(q.options?.length ?? 0)
    const oneTap = q.type === 'rating' || q.type === 'grid' || (q.type === 'choice' && !otherPicked)
    if (!oneTap || answered(q, before) || !answered(q, value)) return
    const next = here.questions[here.questions.indexOf(q) + 1]
    const target = next ? document.getElementById(`question-${next.id}`) : actions.current
    if (!target) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // A moment first, so the choice is seen to take.
    window.setTimeout(
      () =>
        target.scrollIntoView({
          behavior: still ? 'auto' : 'smooth',
          block: next ? 'start' : 'center',
        }),
      380,
    )
  }

  const goTo = (next: number) => {
    setBackwards(next < current)
    setPage(next)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /** What stops a question going in: blank when required, Other unnamed, a table half done. */
  const problem = (q: PublicQuestion): string | null => {
    const value = answers[q.id]
    if (q.type === 'grid' && value?.replace(/,/g, '') && !answered(q, value)) {
      return t('survey.statementNeeded')
    }
    if (q.is_required && !answered(q, value)) {
      return q.type === 'grid' ? t('survey.statementNeeded') : t('survey.required')
    }
    const otherIndex = q.has_other ? String(q.options?.length ?? 0) : null
    if (otherIndex && value?.split(',').includes(otherIndex) && !others[q.id]?.trim()) {
      return t('survey.otherNeeded')
    }
    return null
  }

  /** Marks what is missing on these questions; true when nothing is. */
  const check = (list: PublicQuestion[], message: string) => {
    const found = Object.fromEntries(
      list.map((q) => [q.id, problem(q)]).filter(([, p]) => p !== null),
    ) as Record<number, string>
    setErrors(found)
    if (Object.keys(found).length === 0) return true
    setError(message)
    return false
  }

  const checkWho = () => {
    const found = checkDetails(fields, who, t)
    setDetailErrors(found)
    if (Object.keys(found).length === 0) return true
    setError(t('survey.detailsCheck'))
    return false
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!lastPage) {
      if (current === 0 && asksDetails && !checkWho()) return
      if (check(here.questions, t('survey.answerPage'))) goTo(current + 1)
      return
    }

    // Everything again before sending: details first, then any gap on an
    // earlier page (a question opened there since) takes them back to it.
    if (asksDetails && !checkWho()) {
      if (current !== 0) goTo(0)
      setError(t('survey.detailsCheck'))
      return
    }
    if (!check(pending, t('survey.answerAll'))) {
      const first = pages.findIndex((p) => p.questions.some((q) => problem(q)))
      if (first !== -1 && first !== current) {
        setBackwards(first < current)
        setPage(first)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      return
    }

    const entry: TestimonialEntry = named
      ? { ...testimonial, name: who.name, organisation: who.organisation }
      : testimonial
    if (sharing && !named) {
      const problems = checkTestimonial(entry, t)
      setTestimonialErrors(problems)
      if (Object.keys(problems).length > 0) {
        setError(t('survey.testimonialCheck'))
        return
      }
    }

    setBusy(true)
    setErrors({})
    const failed: Record<number, string> = {}
    const done = new Set(sent)
    const details: Identity = {
      name: who.name.trim(),
      email: who.email.trim().toLowerCase(),
      mobile: who.mobile.trim(),
      organisation: who.organisation.trim(),
    }

    // One request per answer, so a question that closed meanwhile fails on
    // its own and the rest still count.
    for (const q of pending) {
      try {
        // A skipped optional question is sent empty, so it is not asked again.
        const value = answered(q, answers[q.id]) ? (answers[q.id] ?? '') : ''
        await surveyApi.answer(q.id, details, value, submission.current, others[q.id])
        done.add(q.id)
      } catch (err) {
        if (err instanceof SurveyError && err.status === 409) done.add(q.id)
        else
          failed[q.id] = err instanceof SurveyError && err.message ? err.message : t('survey.error')
      }
    }

    // The testimonial after the answers, so feedback is never lost to it.
    let testimonialFailed = false
    if (sharing && Object.keys(failed).length === 0) {
      try {
        await surveyApi.testimonial(surveyLink, details, entry)
      } catch (err) {
        if (!(err instanceof SurveyError && err.status === 409)) testimonialFailed = true
      }
    }

    setSent(done)
    setErrors(failed)
    setBusy(false)
    if (testimonialFailed || Object.keys(failed).length > 0) {
      setError(t('survey.error'))
      if (Object.keys(failed).length > 0) onDone()
      return
    }
    setAnswers({})
    setOthers({})
    setTestimonial(EMPTY_TESTIMONIAL)
    setPage(0)
    // A fresh id for whoever fills the form in next on this phone.
    submission.current = newSubmissionId()
    setSent(new Set())
    onSubmitted(details)
  }

  // Someone who has answered everything open sees the thank-you, not their
  // finished questions again.
  if (pending.length === 0) {
    return <Thanks feedback={feedback} another={fields.email === 'off'} onBack={onFinished} />
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {/* Keyed by page: each page's cards arrive one after another. */}
      <div
        key={current}
        className="sv-page space-y-5"
        style={{ '--sv-from': backwards ? '-28px' : '28px' } as React.CSSProperties}
      >
        {current === 0 && asksDetails && (
          <DetailsCard
            fields={fields}
            note={survey.details_note ? pick(survey.details_note, locale) : ''}
            value={who}
            errors={detailErrors}
            onChange={(next, key) => {
              setWho(next)
              setDetailErrors(({ [key]: _cleared, ...rest }) => rest)
            }}
          />
        )}

        {here.questions.map((q) => (
          <QuestionCard
            key={q.id}
            number={numberOf(q)}
            question={q}
            value={answers[q.id] ?? ''}
            other={others[q.id] ?? ''}
            error={errors[q.id]}
            done={answered(q, answers[q.id]) && !errors[q.id]}
            onChange={(v) => {
              moveOn(q, answers[q.id], v)
              setAnswers((all) => ({ ...all, [q.id]: v }))
              setErrors(({ [q.id]: _cleared, ...rest }) => rest)
            }}
            onOther={(v) => {
              setOthers((all) => ({ ...all, [q.id]: v }))
              setErrors(({ [q.id]: _cleared, ...rest }) => rest)
            }}
          />
        ))}

        {here.testimonial && (
          <TestimonialFields
            firstNumber={total + 1}
            named={named}
            value={testimonial}
            errors={testimonialErrors}
            onChange={(next) => {
              setTestimonial(next)
              setTestimonialErrors({})
            }}
          />
        )}
      </div>

      <div
        ref={actions}
        className="flex flex-col-reverse items-stretch gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <p aria-live="polite" className="text-small text-slate">
          {error && (
            <span role="alert" className="flex items-center gap-2 text-red-700">
              <span aria-hidden className="block h-1.5 w-1.5 shrink-0 rotate-45 bg-red-600" />
              {error}
            </span>
          )}
        </p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          {current > 0 && (
            <Button
              type="button"
              variant="outlineNavy"
              onClick={() => goTo(current - 1)}
              className="w-full sm:w-auto"
            >
              {t('survey.back')}
            </Button>
          )}
          <Button type="submit" disabled={busy} withArrow className="w-full sm:w-auto">
            {lastPage ? t('survey.submit') : t('survey.next')}
          </Button>
        </div>
      </div>
    </form>
  )
}

/** The white card every part of the form sits in. */
function Card({
  children,
  className,
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <div
      id={id}
      className={cn('rounded-sm border border-hair bg-white p-5 shadow-card sm:p-8', className)}
    >
      {children}
    </div>
  )
}

const inputClass = (invalid: boolean) =>
  cn(
    'mt-1.5 block min-h-[48px] w-full rounded-sm border bg-cream px-4 text-body text-navy-950',
    'transition-colors duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/40',
    invalid
      ? 'border-red-400 bg-red-50'
      : 'border-navy-900/15 hover:border-gold-300 focus:border-gold-500',
  )

function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null
  return (
    <span id={id} className="mt-1.5 flex items-center gap-1.5 text-micro text-red-700">
      <span aria-hidden className="block h-1.5 w-1.5 rotate-45 bg-red-600" />
      {children}
    </span>
  )
}

/** Who is answering: only the details this form asks for, and its note. */
function DetailsCard({
  fields,
  note,
  value,
  errors,
  onChange,
}: {
  fields: PublicSurvey['fields']
  note: string
  value: Identity
  errors: DetailErrors
  onChange: (next: Identity, key: Detail) => void
}) {
  const { t } = useI18n()
  const shown: { key: Detail; type: string; auto: string }[] = (
    [
      { key: 'name', type: 'text', auto: 'name' },
      { key: 'email', type: 'email', auto: 'email' },
      { key: 'mobile', type: 'tel', auto: 'tel' },
      { key: 'organisation', type: 'text', auto: 'organization' },
    ] as const
  ).filter((f) => fields[f.key] !== 'off')

  return (
    <Card>
      <h2 className="font-display text-[1.35rem] text-navy-950">{t('survey.detailsHeading')}</h2>
      <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {shown.map(({ key, type, auto }) => (
          <label key={key} className="block">
            <span className="text-small font-semibold text-navy-950">
              {t(`survey.${key}`)}
              {fields[key] === 'required' ? (
                <span aria-hidden className="text-gold-600">
                  {' '}
                  *
                </span>
              ) : (
                <span className="font-normal text-slate"> ({t('survey.optional')})</span>
              )}
            </span>
            <input
              type={type}
              value={value[key]}
              onChange={(e) => onChange({ ...value, [key]: e.target.value }, key)}
              autoComplete={auto}
              required={fields[key] === 'required'}
              aria-invalid={errors[key] ? true : undefined}
              aria-describedby={errors[key] ? `detail-${key}-error` : undefined}
              className={inputClass(!!errors[key])}
            />
            <FieldError id={`detail-${key}-error`}>{errors[key]}</FieldError>
          </label>
        ))}
      </div>
      {/* Usually how the answers are used: a quiet panel with a lock, so it
          reads as a promise rather than small print. */}
      {note && (
        <div className="mt-6 flex gap-3 rounded-sm border border-gold-500/25 bg-[#FBF9F3] px-4 py-3.5">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden
            className="mt-0.5 h-4 w-4 shrink-0 text-gold-600"
          >
            <rect x="4" y="9" width="12" height="8" rx="1.5" />
            <path d="M7 9V6.5a3 3 0 0 1 6 0V9" strokeLinecap="round" />
          </svg>
          <p className="whitespace-pre-line text-small leading-relaxed text-navy-900/80">{note}</p>
        </div>
      )}
    </Card>
  )
}

/** One question: its number, wording and note, then the way to answer it. */
function QuestionCard({
  number,
  question,
  value,
  other,
  error,
  done,
  onChange,
  onOther,
}: {
  number: number
  question: PublicQuestion
  value: string
  other: string
  error?: string
  /** Answered: the number turns full gold and a line grows under it. */
  done: boolean
  onChange: (value: string) => void
  onOther: (value: string) => void
}) {
  const { t, locale } = useI18n()
  const text = pick(question.question, locale)
  const help = question.help ? pick(question.help, locale) : ''
  const errorId = `q${question.id}-error`
  const hint =
    question.type === 'checkbox' && question.max_choices
      ? t('survey.selectUpTo', { n: question.max_choices })
      : question.type === 'checkbox' && (question.options?.length ?? 0) > 1
        ? t('survey.selectAll')
        : question.layout === 'scale'
          ? t('survey.selectOne')
          : ''

  return (
    <Card
      id={`question-${question.id}`}
      className={cn(
        'scroll-mt-28 transition-[border-color,box-shadow] duration-300',
        error && 'sv-shake !border-red-300 ring-1 ring-red-200',
      )}
    >
      <fieldset aria-describedby={error ? errorId : undefined} className="min-w-0">
        <div className="grid grid-cols-[2.75rem_1fr] gap-x-3 sm:grid-cols-[3.75rem_1fr]">
          <span
            aria-hidden
            className={cn(
              'tnum relative self-start justify-self-start font-display text-[2rem] leading-none transition-colors duration-500 sm:text-[2.6rem]',
              done ? 'text-gold-500' : 'text-gold-500/45',
            )}
          >
            {String(number).padStart(2, '0')}
            <span
              className={cn(
                'absolute -bottom-2 left-0 h-[2px] w-full origin-left bg-gold-500 transition-transform duration-500 ease-gentle',
                done ? 'scale-x-100' : 'scale-x-0',
              )}
            />
          </span>
          <div className="min-w-0">
            <legend className="text-[1.08rem] font-semibold leading-snug text-navy-950 sm:text-[1.2rem]">
              {text}
              {!question.is_required && (
                <span className="ml-2 text-small font-normal text-slate">
                  ({t('survey.optional')})
                </span>
              )}
            </legend>
            {help && <p className="mt-2 text-small text-slate">{help}</p>}
            {hint && <p className="mt-2 text-small font-semibold text-gold-700">{hint}</p>}
          </div>
        </div>

        <div className="mt-5 sm:pl-[4.5rem]">
          {question.type === 'choice' && question.layout === 'scale' && (
            <ScaleInput question={question} value={value} onChange={onChange} />
          )}
          {question.type === 'choice' && question.layout !== 'scale' && (
            <OptionsInput
              question={question}
              value={value}
              other={other}
              onChange={onChange}
              onOther={onOther}
            />
          )}
          {question.type === 'checkbox' && (
            <OptionsInput
              multiple
              question={question}
              value={value}
              other={other}
              onChange={onChange}
              onOther={onOther}
            />
          )}
          {question.type === 'grid' && (
            <GridInput question={question} value={value} onChange={onChange} />
          )}
          {question.type === 'rating' &&
            (question.layout === 'smileys' ? (
              <SmileysInput label={text} value={value} onChange={onChange} />
            ) : (
              <StarsInput label={text} value={value} onChange={onChange} />
            ))}
          {question.type === 'text' && (
            <TextInput
              label={text}
              max={question.max_length ?? 1000}
              invalid={!!error}
              value={value}
              onChange={onChange}
            />
          )}
          <FieldError id={errorId}>{error}</FieldError>
        </div>
      </fieldset>
    </Card>
  )
}

/** A choice: picking it sweeps a gold wash across from the left. */
const optionClass = (checked: boolean, disabled = false) =>
  cn(
    'flex min-h-[52px] cursor-pointer items-center gap-3.5 rounded-sm border px-4 py-3 text-body',
    'bg-white bg-gradient-to-r from-gold-500/[0.14] to-gold-500/[0.06] bg-no-repeat',
    'transition-[background-size,border-color,color,transform] duration-300 ease-gentle active:scale-[0.99]',
    'focus-within:ring-2 focus-within:ring-gold-500/60',
    checked
      ? 'border-gold-500 bg-[length:100%_100%] text-navy-950'
      : 'border-navy-900/15 bg-[length:0%_100%] text-navy-900 hover:border-gold-500/60',
    disabled && 'cursor-not-allowed opacity-45 hover:border-navy-900/15 active:scale-100',
  )

function Mark({ checked, square }: { checked: boolean; square?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid h-5 w-5 shrink-0 place-items-center border-2 transition-colors duration-200',
        square ? 'rounded-sm' : 'rounded-full',
        checked
          ? square
            ? 'sv-pop border-gold-500 bg-gold-500 text-white'
            : 'border-gold-500'
          : 'border-navy-900/30',
      )}
    >
      {checked &&
        (square ? (
          <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
            <path
              d="M3 8.5l3 3 7-7"
              pathLength={1}
              className="sv-draw"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <span className="sv-pop block h-2.5 w-2.5 rounded-full bg-gold-500" />
        ))}
    </span>
  )
}

/**
 * A list to pick one from, or to tick (up to a maximum, when there is one).
 * "Other" comes last and opens a box for what it is.
 */
function OptionsInput({
  question,
  multiple,
  value,
  other,
  onChange,
  onOther,
}: {
  question: PublicQuestion
  multiple?: boolean
  value: string
  other: string
  onChange: (value: string) => void
  onOther: (value: string) => void
}) {
  const { t, locale } = useI18n()
  const labels = (question.options ?? []).map((o) => pick(o, locale))
  if (question.has_other) labels.push(t('survey.other'))
  const otherIndex = question.has_other ? labels.length - 1 : -1
  const ticked = value ? value.split(',') : []
  const full = !!multiple && !!question.max_choices && ticked.length >= question.max_choices
  // Short options sit two to a row; long ones keep the full width.
  const twoUp = labels.length > 4 && labels.every((l) => l.length <= 48)

  const toggle = (i: number) => {
    if (!multiple) return onChange(String(i))
    const on = ticked.includes(String(i))
    onChange(
      (on ? ticked.filter((v) => v !== String(i)) : [...ticked, String(i)])
        .map(Number)
        .sort((a, b) => a - b)
        .join(','),
    )
  }

  const otherChosen = otherIndex >= 0 && ticked.includes(String(otherIndex))

  return (
    <>
      <div className={cn('grid gap-2.5', twoUp && 'sm:grid-cols-2')}>
        {labels.map((label, i) => {
          const checked = multiple ? ticked.includes(String(i)) : value === String(i)
          const disabled = full && !checked
          return (
            <label key={i} className={optionClass(checked, disabled)}>
              <input
                type={multiple ? 'checkbox' : 'radio'}
                name={`q${question.id}`}
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(i)}
                className="sr-only"
              />
              <Mark checked={checked} square={multiple} />
              <span>{label}</span>
            </label>
          )
        })}
      </div>
      {otherChosen && (
        <input
          value={other}
          onChange={(e) => onOther(e.target.value)}
          maxLength={300}
          placeholder={t('survey.otherPlaceholder')}
          aria-label={t('survey.other')}
          autoFocus
          className={cn('anim-fade', inputClass(false))}
        />
      )}
    </>
  )
}

/** Static class names for the scale's columns (Tailwind reads them as written). */
const SCALE_COLUMNS: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  5: 'sm:grid-cols-5',
  6: 'sm:grid-cols-6',
  7: 'sm:grid-cols-7',
}

/**
 * A single choice as numbered cards, 1 to 5 across on a wide screen and a
 * numbered list on a phone. "Not sure" stands apart, off the scale.
 */
function ScaleInput({
  question,
  value,
  onChange,
}: {
  question: PublicQuestion
  value: string
  onChange: (value: string) => void
}) {
  const { locale } = useI18n()
  const all = (question.options ?? []).map((o, i) => ({
    i,
    label: pick(o, locale),
    off: OFF_SCALE.test(o.en),
  }))
  const scale = all.filter((o) => !o.off)
  const extra = all.filter((o) => o.off)

  return (
    <div role="radiogroup" aria-label={pick(question.question, locale)}>
      <div className={cn('grid gap-2', SCALE_COLUMNS[scale.length])}>
        {scale.map((o, n) => {
          const checked = value === String(o.i)
          return (
            <label
              key={o.i}
              className={cn(
                'flex min-h-[56px] cursor-pointer items-center gap-4 rounded-sm border px-4 py-2.5',
                'transition-[background-color,border-color,color,transform,box-shadow] duration-300 ease-gentle active:scale-[0.98]',
                'sm:min-h-[104px] sm:flex-col sm:justify-center sm:gap-1.5 sm:px-2 sm:text-center',
                'focus-within:ring-2 focus-within:ring-gold-500/60',
                checked
                  ? 'border-navy-900 bg-navy-900 text-cream shadow-[0_10px_24px_-12px_rgba(10,22,40,0.55)] sm:-translate-y-1'
                  : 'border-gold-500/35 bg-[#FBF9F3] text-navy-900 hover:border-gold-500 sm:hover:-translate-y-0.5',
              )}
            >
              <input
                type="radio"
                name={`q${question.id}`}
                checked={checked}
                onChange={() => onChange(String(o.i))}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  'tnum w-6 shrink-0 font-display text-[1.6rem] leading-none sm:w-auto sm:text-[1.9rem]',
                  checked ? 'sv-pop text-gold-400' : 'text-gold-600',
                )}
              >
                {n + 1}
              </span>
              <span className="text-small leading-tight sm:text-[0.8rem]">{o.label}</span>
            </label>
          )
        })}
      </div>
      {extra.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {extra.map((o) => {
            const checked = value === String(o.i)
            return (
              <label
                key={o.i}
                className={cn(
                  'inline-flex min-h-[44px] cursor-pointer items-center rounded-full border px-5 text-small transition-[background-color,border-color,color,transform] duration-200 active:scale-95',
                  'focus-within:ring-2 focus-within:ring-gold-500/60',
                  checked
                    ? 'border-navy-900 bg-navy-900 text-cream'
                    : 'border-navy-900/15 bg-white text-slate hover:border-gold-500/60',
                )}
              >
                <input
                  type="radio"
                  name={`q${question.id}`}
                  checked={checked}
                  onChange={() => onChange(String(o.i))}
                  className="sr-only"
                />
                {o.label}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * A statement table: each statement in turn, with the shared scale under it.
 * The answer is one choice per statement, "0,2,1,0"; a statement not yet
 * answered is an empty place.
 */
function GridInput({
  question,
  value,
  onChange,
}: {
  question: PublicQuestion
  value: string
  onChange: (value: string) => void
}) {
  const { locale } = useI18n()
  const statements = question.statements ?? []
  const picked = value ? value.split(',') : statements.map(() => '')
  const set = (row: number, i: number) => {
    const next = statements.map((_, r) => picked[r] ?? '')
    next[row] = String(i)
    onChange(next.join(','))
  }

  return (
    <div className="divide-y divide-hair border-y border-hair">
      {statements.map((s, row) => (
        <div key={row} role="radiogroup" aria-label={pick(s, locale)} className="py-4">
          <p className="text-body font-medium text-navy-950">{pick(s, locale)}</p>
          <div
            className={cn(
              'mt-3 flex flex-wrap gap-1.5 sm:grid',
              SCALE_COLUMNS[question.options?.length ?? 5],
            )}
          >
            {(question.options ?? []).map((o, i) => {
              const checked = picked[row] === String(i)
              return (
                <label
                  key={i}
                  className={cn(
                    'flex min-h-[40px] cursor-pointer items-center rounded-full border px-3.5 py-1.5 text-small leading-tight transition-[background-color,border-color,color,transform] duration-200 active:scale-95',
                    'sm:min-h-[48px] sm:justify-center sm:rounded-sm sm:px-2 sm:text-center sm:text-[0.8rem]',
                    'focus-within:ring-2 focus-within:ring-gold-500/60',
                    checked
                      ? 'border-navy-900 bg-navy-900 text-cream'
                      : 'border-navy-900/15 bg-white text-navy-900 hover:border-gold-500/60',
                  )}
                >
                  <input
                    type="radio"
                    name={`q${question.id}-${row}`}
                    checked={checked}
                    onChange={() => set(row, i)}
                    className="sr-only"
                  />
                  {pick(o, locale)}
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * A rating of 1 to 5 as faces, from very poor to excellent. A face wiggles
 * under the mouse and says what it means; the chosen one fills gold with a
 * small bounce and the others step back.
 */
function SmileysInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useI18n()
  const [near, setNear] = useState(0)
  const picked = Number(value) || 0
  const named = near || picked

  return (
    <div>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex justify-between gap-1 sm:justify-start sm:gap-3"
        onPointerLeave={() => setNear(0)}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const on = picked === n
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={t(`survey.face${n}`)}
              onClick={() => onChange(String(n))}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setNear(n)}
              onFocus={() => setNear(n)}
              onBlur={() => setNear(0)}
              className={cn(
                'sv-face grid h-12 w-12 place-items-center rounded-full transition-[transform,opacity,color] duration-300 ease-gentle sm:h-16 sm:w-16',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60 focus-visible:ring-offset-2',
                on ? 'is-on scale-110 text-navy-950' : 'text-navy-900/35 hover:text-gold-600',
                picked > 0 && !on && 'opacity-75 hover:opacity-100',
              )}
            >
              {/* Re-keyed when chosen, so the bounce plays each time. */}
              <span
                key={on ? `on-${n}` : 'off'}
                className={cn('block h-full w-full', on && 'sv-face-pick')}
              >
                <Smiley level={n} className="h-full w-full" />
              </span>
            </button>
          )
        })}
      </div>
      {/* What the face under the mouse, or the chosen one, means. Screen
          readers have it from each face's own name. */}
      <p aria-hidden className="mt-2.5 min-h-[1.25rem] text-small font-semibold text-gold-700">
        <span key={named} className="anim-fade inline-block">
          {named ? t(`survey.face${named}`) : ''}
        </span>
      </p>
    </div>
  )
}

function StarsInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useI18n()
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1.5 sm:gap-2">
      {[1, 2, 3, 4, 5].map((n) => {
        const lit = Number(value) >= n
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === String(n)}
            aria-label={t('survey.stars', { n })}
            onClick={() => onChange(String(n))}
            className={cn(
              'grid h-12 w-12 place-items-center rounded-sm text-[1.6rem] transition-[color,transform] duration-200 hover:scale-110 sm:h-14 sm:w-14',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60',
              lit ? 'text-gold-500' : 'text-navy-900/20 hover:text-gold-500/60',
            )}
          >
            {/* Re-keyed on each new rating, so the lit stars pop in turn. */}
            <span
              key={lit ? `on-${value}` : 'off'}
              className={lit ? 'sv-star' : undefined}
              style={lit ? { animationDelay: `${(n - 1) * 45}ms` } : undefined}
            >
              ★
            </span>
          </button>
        )
      })}
    </div>
  )
}

function TextInput({
  label,
  max,
  invalid,
  value,
  onChange,
}: {
  label: string
  max: number
  invalid: boolean
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useI18n()
  return (
    <>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={max}
        rows={max <= 300 ? 3 : 5}
        aria-label={label}
        placeholder={t('survey.typeHere')}
        className={cn(
          'block w-full rounded-sm border bg-cream px-4 py-3 text-body text-navy-950',
          'transition-colors duration-200 placeholder:text-slate/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/40',
          invalid
            ? 'border-red-400'
            : 'border-navy-900/15 hover:border-gold-300 focus:border-gold-500',
        )}
      />
      <p
        className={cn(
          'tnum mt-1.5 text-right text-micro transition-colors duration-300',
          value.length >= max * 0.9 ? 'font-semibold text-gold-700' : 'text-slate',
        )}
      >
        {t('survey.chars', { n: value.length, max })}
      </p>
    </>
  )
}

const EMPTY_TESTIMONIAL: TestimonialEntry = {
  quote: '',
  credit: 'anonymous',
  name: '',
  organisation: '',
  consent: false,
}

type TestimonialErrors = Partial<Record<'name' | 'organisation', string>>

/** A credit that shows a name needs one; with organisation, that too. */
function checkTestimonial(entry: TestimonialEntry, t: (key: string) => string): TestimonialErrors {
  const errors: TestimonialErrors = {}
  if (entry.credit !== 'anonymous' && !entry.name.trim()) errors.name = t('survey.nameNeeded')
  if (entry.credit === 'full_name_org' && !entry.organisation.trim()) {
    errors.organisation = t('survey.organisationNeeded')
  }
  return errors
}

/**
 * The testimonial page every feedback form ends with: an optional
 * reflection, how to credit it, and an unticked permission box. A form that
 * asked for a name credits from it ("Anonymous participant" or "Full name
 * and organisation"); one that did not asks for what the credit needs.
 */
function TestimonialFields({
  firstNumber,
  named,
  value,
  errors,
  onChange,
}: {
  firstNumber: number
  named: boolean
  value: TestimonialEntry
  errors: TestimonialErrors
  onChange: (next: TestimonialEntry) => void
}) {
  const { t } = useI18n()
  const set = (patch: Partial<TestimonialEntry>) => onChange({ ...value, ...patch })
  const credits: TestimonialCredit[] = named
    ? ['anonymous', 'full_name_org']
    : ['anonymous', 'first_name', 'full_name', 'full_name_org']
  const number = (n: number) => (
    <span
      aria-hidden
      className="tnum font-display text-[2rem] leading-none text-gold-500 sm:text-[2.6rem]"
    >
      {String(n).padStart(2, '0')}
    </span>
  )

  return (
    <>
      <Card>
        <div className="grid grid-cols-[2.75rem_1fr] gap-x-3 sm:grid-cols-[3.75rem_1fr]">
          {number(firstNumber)}
          <label htmlFor="testimonial-quote" className="min-w-0">
            <span className="block text-[1.08rem] font-semibold leading-snug text-navy-950 sm:text-[1.2rem]">
              {t('survey.testimonialQuestion')}
              <span className="ml-2 text-small font-normal text-slate">
                ({t('survey.optional')})
              </span>
            </span>
            <span className="mt-2 block text-small text-slate">{t('survey.testimonialHint')}</span>
          </label>
        </div>
        <div className="mt-5 sm:pl-[4.5rem]">
          <textarea
            id="testimonial-quote"
            value={value.quote}
            onChange={(e) => set({ quote: e.target.value })}
            maxLength={1000}
            rows={4}
            className="block w-full rounded-sm border border-navy-900/15 bg-cream px-4 py-3 text-body text-navy-950 transition-colors duration-200 hover:border-gold-300 focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/40"
          />
        </div>
      </Card>

      <Card>
        <fieldset className="min-w-0">
          <div className="grid grid-cols-[2.75rem_1fr] gap-x-3 sm:grid-cols-[3.75rem_1fr]">
            {number(firstNumber + 1)}
            <div className="min-w-0">
              <legend className="text-[1.08rem] font-semibold leading-snug text-navy-950 sm:text-[1.2rem]">
                {t('survey.creditQuestion')}
              </legend>
              <p className="mt-2 text-small text-slate">
                {named ? t('survey.creditNamedHint') : t('survey.creditHint')}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-2.5 sm:pl-[4.5rem]">
            {credits.map((credit) => {
              const checked = value.credit === credit
              return (
                <label key={credit} className={optionClass(checked)}>
                  <input
                    type="radio"
                    name="testimonial-credit"
                    checked={checked}
                    onChange={() => set({ credit })}
                    className="sr-only"
                  />
                  <Mark checked={checked} />
                  {t(`survey.credit_${credit}`)}
                </label>
              )
            })}

            {/* Only the fields the chosen credit needs, on a form without a name. */}
            {!named && value.credit !== 'anonymous' && (
              <div className="grid gap-4 pt-2 sm:grid-cols-2">
                <label className="block">
                  <span className="text-small font-semibold text-navy-950">
                    {t('survey.creditName')}
                  </span>
                  <input
                    value={value.name}
                    onChange={(e) => set({ name: e.target.value })}
                    autoComplete="name"
                    aria-invalid={errors.name ? true : undefined}
                    className={inputClass(!!errors.name)}
                  />
                  <FieldError id="credit-name-error">{errors.name}</FieldError>
                </label>
                {value.credit === 'full_name_org' && (
                  <label className="block">
                    <span className="text-small font-semibold text-navy-950">
                      {t('survey.creditOrganisation')}
                    </span>
                    <input
                      value={value.organisation}
                      onChange={(e) => set({ organisation: e.target.value })}
                      autoComplete="organization"
                      aria-invalid={errors.organisation ? true : undefined}
                      className={inputClass(!!errors.organisation)}
                    />
                    <FieldError id="credit-org-error">{errors.organisation}</FieldError>
                  </label>
                )}
              </div>
            )}
          </div>
        </fieldset>
      </Card>

      <Card className="border-gold-500/40 bg-[#FBF9F3]">
        <label className="flex cursor-pointer items-start gap-4">
          <input
            type="checkbox"
            checked={value.consent}
            onChange={(e) => set({ consent: e.target.checked })}
            className="mt-1 h-5 w-5 shrink-0 accent-[#C9A227]"
          />
          <span>
            <span className="block font-semibold text-navy-950">{t('survey.consentHeading')}</span>
            <span className="mt-1.5 block text-body text-navy-900">{t('survey.consentText')}</span>
          </span>
        </label>
        <p className="mt-4 text-small text-slate">{t('survey.consentNote')}</p>
      </Card>
    </>
  )
}
