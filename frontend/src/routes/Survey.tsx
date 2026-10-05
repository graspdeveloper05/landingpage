import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/cn'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Ornament } from '@/components/ui/Ornament'
import {
  pick,
  savedIdentity,
  saveIdentity,
  surveyApi,
  SurveyError,
  type Identity,
  type PublicQuestion,
  type PublicSurvey,
  type TestimonialCredit,
  type TestimonialEntry,
} from '@/services/survey'

/**
 * One survey, at its own link. Registered attendees sign in with the email
 * or mobile they registered with, answer, and hand the phone on.
 *
 * Dressed like the RSVP section -- the navy room with the interior faintly
 * behind it -- since it is the same people at the same event.
 */
export function Survey() {
  const { id = '' } = useParams()
  const { t, locale } = useI18n()
  const [identity, setIdentity] = useState(() => savedIdentity(id))
  const [survey, setSurvey] = useState<PublicSurvey | null>(null)
  const [missing, setMissing] = useState(false)
  const [thanked, setThanked] = useState(false)

  const load = useCallback(
    () =>
      surveyApi
        .get(id, identity?.email)
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

  const forget = useCallback(() => {
    saveIdentity(id, null)
    setIdentity(null)
  }, [id])

  // Moving to another survey's link: its own details, or the details step.
  useEffect(() => {
    setIdentity(savedIdentity(id))
  }, [id])

  // "Back to survey" after the thank-you: the sign-in step again, so the next
  // person can answer on the same phone or tablet.
  const finish = useCallback(() => {
    setThanked(false)
    forget()
    window.scrollTo({ top: 0 })
  }, [forget])

  const title = survey ? pick(survey.title, locale) : t('survey.title')
  const description = survey?.description ? pick(survey.description, locale) : undefined

  return (
    <>
      <section className="pb-20 pt-28 sm:pt-32">
        <div className="shell relative">
          <div className="mx-auto max-w-2xl rounded-sm border border-navy-900/10 bg-white px-6 py-10 shadow-[0_18px_50px_-24px_rgba(11,33,64,0.35)] sm:px-12 sm:py-14">
            <header className="mb-10 text-center">
              <h1 className="font-display text-[2rem] font-semibold leading-tight text-navy-950 sm:text-[2.6rem]">
                {title}
              </h1>
              {description && (
                <p className="mx-auto mt-3 max-w-xl text-lead text-slate">{description}</p>
              )}
              <Ornament className="mt-6" />
            </header>

            {thanked ? (
              <Thanks onBack={finish} />
            ) : missing ? (
              <Notice>{t('survey.missing')}</Notice>
            ) : survey && survey.status !== 'open' ? (
              <Notice>{t('survey.notOpen')}</Notice>
            ) : !identity ? (
              <Identify
                onIdentified={(next) => {
                  saveIdentity(id, next)
                  setIdentity(next)
                }}
              />
            ) : (
              survey &&
              (survey.questions.length === 0 ? (
                <Notice>{t('survey.wait')}</Notice>
              ) : (
                <AnswerForm
                  surveyLink={id}
                  isFeedback={survey.form_type === 'feedback'}
                  questions={survey.questions}
                  who={identity}
                  onDone={load}
                  onForget={forget}
                  onSubmitted={() => {
                    setThanked(true)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                />
              ))
            )}
          </div>
        </div>
      </section>
    </>
  )
}

/**
 * The card's closing state, after submitting or on returning to a survey
 * already finished: a thank-you, the way on to the programme, and the way
 * back to the start for the next person.
 */
function Thanks({ onBack }: { onBack: () => void }) {
  const { t } = useI18n()

  return (
    <div role="status" className="text-center">
      <span
        aria-hidden
        className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-700 text-[2rem] text-white"
      >
        ✓
      </span>
      <h2 className="mt-5 font-display text-[1.75rem] text-navy-950">{t('survey.thanksTitle')}</h2>
      <p className="mt-2 text-body text-slate">{t('survey.thanksBody')}</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink to="/programme" withArrow>
          {t('survey.viewProgramme')}
        </ButtonLink>
        <Button type="button" variant="outlineNavy" onClick={onBack}>
          {t('survey.backToSurvey')}
        </Button>
      </div>
    </div>
  )
}

/** A closed, missing or waiting state, in the RSVP section's voice. */
function Notice({ children }: { children: React.ReactNode }) {
  return <p className="text-center font-display text-h3 text-navy-950">{children}</p>
}

/**
 * The first step: who is answering. Checked here, before any question, so a
 * mistyped email is caught once rather than on every answer.
 */
function Identify({ onIdentified }: { onIdentified: (identity: Identity) => void }) {
  const { t } = useI18n()
  const [values, setValues] = useState<Identity>({ email: '', mobile: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof Identity, string>>>({})

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: Partial<Record<keyof Identity, string>> = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      next.email = t('survey.emailInvalid')
    // Malaysian and international numbers, as the RSVP form accepts.
    if (!/^\+?[0-9\s-]{8,16}$/.test(values.mobile.trim())) next.mobile = t('survey.mobileInvalid')
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onIdentified({
      email: values.email.trim().toLowerCase(),
      mobile: values.mobile.trim(),
    })
  }

  const field = (key: keyof Identity, type: string, autoComplete: string) => (
    <label className="block text-left">
      <span className="text-micro font-medium uppercase tracking-[0.08em] text-slate">
        {t(`survey.${key}`)}
      </span>
      <input
        type={type}
        value={values[key]}
        onChange={(e) => {
          setValues((v) => ({ ...v, [key]: e.target.value }))
          setErrors(({ [key]: _cleared, ...rest }) => rest)
        }}
        autoComplete={autoComplete}
        required
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={errors[key] ? `survey-${key}-error` : undefined}
        className={cn(
          'mt-2 block min-h-[48px] w-full rounded-sm border bg-white px-4 text-body text-navy-950',
          'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold-500/40',
          errors[key]
            ? 'border-red-400 bg-red-50'
            : 'border-navy-900/15 hover:border-gold-300 focus:border-gold-500',
        )}
      />
      {errors[key] && (
        <span
          id={`survey-${key}-error`}
          className="mt-1.5 flex items-center gap-1.5 text-micro text-red-700"
        >
          <span aria-hidden className="block h-1.5 w-1.5 rotate-45 bg-red-600" />
          {errors[key]}
        </span>
      )}
    </label>
  )

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-md text-center">
      <p className="text-body text-navy-900/80">{t('survey.signIn')}</p>

      <div className="mt-8 space-y-5">
        {field('email', 'email', 'email')}
        {field('mobile', 'tel', 'tel')}
      </div>

      <Button type="submit" withArrow className="mt-8 w-full">
        {t('survey.continue')}
      </Button>
    </form>
  )
}

/** Questions shown per page of the answer form. */
const PAGE_SIZE = 10

/**
 * Every open question with one Submit at the foot. Answers are kept here,
 * keyed by question, so the ten-second refresh that brings in a newly opened
 * question does not wipe what has been chosen for the others.
 */
function AnswerForm({
  surveyLink,
  isFeedback,
  questions,
  who,
  onDone,
  onForget,
  onSubmitted,
}: {
  surveyLink: string
  /** Feedback forms end with the testimonial section. */
  isFeedback: boolean
  questions: PublicQuestion[]
  who: Identity
  onDone: () => void
  onForget: () => void
  /** Every answer was recorded. */
  onSubmitted: () => void
}) {
  const { t } = useI18n()
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [sent, setSent] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [page, setPage] = useState(0)
  const [testimonial, setTestimonial] = useState<TestimonialEntry>(EMPTY_TESTIMONIAL)
  const [testimonialErrors, setTestimonialErrors] = useState<TestimonialErrors>({})

  // A testimonial is sent only when written and permitted; without either,
  // the feedback goes on its own, as the form promises.
  const sharing = isFeedback && testimonial.quote.trim() !== '' && testimonial.consent

  const isDone = (q: PublicQuestion) => q.answered || sent.has(q.id)
  const pending = questions.filter((q) => !isDone(q))
  const filled = pending.filter((q) => answers[q.id]?.trim()).length

  // Ten to a page. Clamped, because a question the moderator closes while
  // someone is on the last page can leave that page empty.
  const pages = Math.max(1, Math.ceil(pending.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const onPage = pending.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)
  const lastPage = current === pages - 1
  // Only a required question left empty holds the form back.
  const blank = (q: PublicQuestion) => q.is_required && !answers[q.id]?.trim()

  const goTo = (next: number) => {
    setPage(next)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /** Marks the unanswered questions and says so; true when there were none. */
  const check = (list: PublicQuestion[], message: string) => {
    const missing = list.filter(blank)
    if (missing.length === 0) return true
    setErrors(Object.fromEntries(missing.map((q) => [q.id, t('survey.required')])))
    setError(message)
    return false
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Each page is answered in full before the next one opens.
    if (!lastPage) {
      if (check(onPage, t('survey.answerPage'))) goTo(current + 1)
      return
    }

    // Every question is required: a half-answered survey is sent as nothing,
    // with the gaps marked, rather than as a partial set. A gap on an earlier
    // page (a question opened there since) takes them back to it.
    if (!check(pending, t('survey.answerAll'))) {
      const first = pending.findIndex(blank)
      const firstPage = Math.floor(first / PAGE_SIZE)
      if (firstPage !== current) {
        setPage(firstPage)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      return
    }

    if (sharing) {
      const problems = checkTestimonial(testimonial, t)
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

    // One request per answer, so a question that closed meanwhile fails on
    // its own and the rest still count.
    for (const q of pending) {
      try {
        // A skipped optional question is sent empty, so it is not asked again.
        await surveyApi.answer(q.id, who, answers[q.id] ?? '')
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
        await surveyApi.testimonial(surveyLink, who, testimonial)
      } catch (err) {
        if (!(err instanceof SurveyError && err.status === 409)) testimonialFailed = true
      }
    }

    setSent(done)
    setErrors(failed)
    setBusy(false)
    if (testimonialFailed) {
      setError(t('survey.error'))
      return
    }
    if (Object.keys(failed).length > 0) {
      setError(t('survey.error'))
      onDone()
    } else {
      setAnswers({})
      setTestimonial(EMPTY_TESTIMONIAL)
      onSubmitted()
    }
  }

  // Someone who has answered everything open sees the same thank-you, not
  // their finished questions again.
  if (pending.length === 0) {
    return <Thanks onBack={onForget} />
  }

  return (
    <form onSubmit={submit} noValidate>
      <ol className="divide-y divide-navy-900/10 border-y border-navy-900/10">
        {onPage.map((q, i) => (
          <QuestionField
            key={q.id}
            number={current * PAGE_SIZE + i + 1}
            question={q}
            done={false}
            value={answers[q.id] ?? ''}
            error={errors[q.id]}
            onChange={(v) => {
              setAnswers((all) => ({ ...all, [q.id]: v }))
              setErrors(({ [q.id]: _cleared, ...rest }) => rest)
            }}
          />
        ))}
      </ol>

      {isFeedback && lastPage && (
        <TestimonialFields
          value={testimonial}
          errors={testimonialErrors}
          onChange={(next) => {
            setTestimonial(next)
            setTestimonialErrors({})
          }}
        />
      )}

      <div className="mt-8 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="text-small text-slate">
          {error ? (
            <span role="alert" className="flex items-center gap-2 text-red-700">
              <span aria-hidden className="block h-1.5 w-1.5 shrink-0 rotate-45 bg-gold-400" />
              {error}
            </span>
          ) : (
            <>
              {pages > 1 && (
                <span className="block font-medium text-navy-900">
                  {t('survey.page', { page: current + 1, pages })}
                </span>
              )}
              {t('survey.progress', { done: filled, total: pending.length })}
            </>
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

function QuestionField({
  number,
  question,
  done,
  value,
  error,
  onChange,
}: {
  number: number
  question: PublicQuestion
  done: boolean
  value: string
  error?: string
  onChange: (value: string) => void
}) {
  const { t, locale } = useI18n()
  const text = pick(question.question, locale)
  const errorId = `q${question.id}-error`

  return (
    <li className="grid grid-cols-[2.25rem_1fr] gap-x-4 py-8 sm:grid-cols-[3rem_1fr]">
      <span
        aria-hidden
        className="tnum font-display text-[1.75rem] leading-none text-gold-500 sm:text-[2.25rem]"
      >
        {number}
      </span>

      <fieldset aria-describedby={error ? errorId : undefined} className="min-w-0">
        <legend className="font-display text-[1.2rem] leading-snug text-navy-950 sm:text-[1.35rem]">
          {text}
          {!question.is_required && (
            <span className="ml-2 font-sans text-small text-slate">({t('survey.optional')})</span>
          )}
        </legend>

        {done ? (
          <p className="mt-4 flex items-center gap-2 text-small text-gold-700">
            <span aria-hidden className="block h-1.5 w-1.5 rotate-45 bg-gold-400" />
            {t('survey.thanks')}
          </p>
        ) : (
          <div className="mt-5">
            {question.type === 'choice' && (
              <div className="space-y-2.5">
                {question.options?.map((o, i) => {
                  const checked = value === String(i)
                  return (
                    <label
                      key={i}
                      className={cn(
                        'flex min-h-[52px] cursor-pointer items-center gap-4 rounded-sm border px-4 py-3 text-body transition-colors duration-200',
                        'focus-within:ring-2 focus-within:ring-gold-500/60',
                        checked
                          ? 'border-gold-500 bg-gold-500/10 text-navy-950'
                          : 'border-navy-900/15 bg-white text-navy-900 hover:border-gold-500/60',
                      )}
                    >
                      <input
                        type="radio"
                        name={`q${question.id}`}
                        checked={checked}
                        onChange={() => onChange(String(i))}
                        className="sr-only"
                      />
                      <span
                        aria-hidden
                        className={cn(
                          'grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors',
                          checked ? 'border-gold-500' : 'border-navy-900/30',
                        )}
                      >
                        {checked && <span className="block h-2.5 w-2.5 rounded-full bg-gold-500" />}
                      </span>
                      {pick(o, locale)}
                    </label>
                  )
                })}
              </div>
            )}

            {question.type === 'checkbox' && (
              <div className="space-y-2.5">
                {/* A lone tickbox (consent) needs no "select all" hint. */}
                {(question.options?.length ?? 0) > 1 && (
                  <p className="text-small text-slate">{t('survey.selectAll')}</p>
                )}
                {question.options?.map((o, i) => {
                  // The answer is the ticked option numbers, e.g. "0,2".
                  const ticked = value ? value.split(',') : []
                  const checked = ticked.includes(String(i))
                  const toggle = () =>
                    onChange(
                      (checked ? ticked.filter((v) => v !== String(i)) : [...ticked, String(i)])
                        .map(Number)
                        .sort((a, b) => a - b)
                        .join(','),
                    )
                  return (
                    <label
                      key={i}
                      className={cn(
                        'flex min-h-[52px] cursor-pointer items-center gap-4 rounded-sm border px-4 py-3 text-body transition-colors duration-200',
                        'focus-within:ring-2 focus-within:ring-gold-500/60',
                        checked
                          ? 'border-gold-500 bg-gold-500/10 text-navy-950'
                          : 'border-navy-900/15 bg-white text-navy-900 hover:border-gold-500/60',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={toggle}
                        className="sr-only"
                      />
                      <span
                        aria-hidden
                        className={cn(
                          'grid h-5 w-5 shrink-0 place-items-center rounded-sm border-2 transition-colors',
                          checked ? 'border-gold-500 bg-gold-500 text-white' : 'border-navy-900/30',
                        )}
                      >
                        {checked && (
                          <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                            <path
                              d="M3 8.5l3 3 7-7"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      {pick(o, locale)}
                    </label>
                  )
                })}
              </div>
            )}

            {question.type === 'rating' && (
              <div role="radiogroup" aria-label={text} className="flex gap-1.5 sm:gap-2">
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
                        'grid h-12 w-12 place-items-center rounded-sm text-[1.6rem] transition-colors duration-200 sm:h-14 sm:w-14',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/60',
                        lit ? 'text-gold-500' : 'text-navy-900/20 hover:text-gold-500/60',
                      )}
                    >
                      ★
                    </button>
                  )
                })}
              </div>
            )}

            {question.type === 'text' && (
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                maxLength={1000}
                rows={4}
                aria-label={text}
                placeholder={t('survey.typeHere')}
                className={cn(
                  'block w-full rounded-sm border bg-white px-4 py-3 text-body text-navy-950',
                  'transition-colors duration-200 placeholder:text-slate/50 focus:bg-white focus:outline-none',
                  error
                    ? 'border-red-400'
                    : 'border-navy-900/15 hover:border-gold-300 focus:border-gold-500',
                )}
              />
            )}

            {error && (
              <p id={errorId} className="mt-2 flex items-center gap-1.5 text-micro text-red-700">
                <span aria-hidden className="block h-1.5 w-1.5 rotate-45 bg-gold-400" />
                {error}
              </p>
            )}
          </div>
        )}
      </fieldset>
    </li>
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

const CREDITS: TestimonialCredit[] = ['anonymous', 'first_name', 'full_name', 'full_name_org']

/**
 * The testimonial section every feedback form ends with, as the organising
 * team's form sets it out: an optional reflection, how to credit it (with
 * only the fields that credit needs), and an unticked permission box.
 */
function TestimonialFields({
  value,
  errors,
  onChange,
}: {
  value: TestimonialEntry
  errors: TestimonialErrors
  onChange: (next: TestimonialEntry) => void
}) {
  const { t } = useI18n()
  const set = (patch: Partial<TestimonialEntry>) => onChange({ ...value, ...patch })
  const input = (invalid: boolean) =>
    cn(
      'mt-2 block min-h-[48px] w-full rounded-sm border bg-white px-4 text-body text-navy-950',
      'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold-500/40',
      invalid
        ? 'border-red-400 bg-red-50'
        : 'border-navy-900/15 hover:border-gold-300 focus:border-gold-500',
    )

  return (
    <section aria-labelledby="testimonial-heading" className="mt-10 space-y-6">
      <div>
        <h2 id="testimonial-heading" className="font-display text-[1.35rem] text-navy-950">
          {t('survey.testimonialHeading')}{' '}
          <span className="font-sans text-small text-slate">({t('survey.optional')})</span>
        </h2>
        <p className="mt-1 text-small text-slate">{t('survey.testimonialIntro')}</p>
      </div>

      <label className="block">
        <span className="font-semibold text-navy-950">{t('survey.testimonialQuestion')}</span>
        <span className="block text-small text-slate">{t('survey.testimonialHint')}</span>
        <textarea
          value={value.quote}
          onChange={(e) => set({ quote: e.target.value })}
          maxLength={1000}
          rows={4}
          className="mt-2 block w-full rounded-sm border border-navy-900/15 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
        />
      </label>

      <fieldset>
        <legend className="font-semibold text-navy-950">{t('survey.creditQuestion')}</legend>
        <p className="text-small text-slate">{t('survey.creditHint')}</p>
        <div className="mt-3 space-y-2.5">
          {CREDITS.map((credit) => {
            const checked = value.credit === credit
            return (
              <label
                key={credit}
                className={cn(
                  'flex min-h-[52px] cursor-pointer items-center gap-4 rounded-sm border px-4 py-3 text-body transition-colors duration-200',
                  'focus-within:ring-2 focus-within:ring-gold-500/60',
                  checked
                    ? 'border-gold-500 bg-gold-500/10 text-navy-950'
                    : 'border-navy-900/15 bg-white text-navy-900 hover:border-gold-500/60',
                )}
              >
                <input
                  type="radio"
                  name="testimonial-credit"
                  checked={checked}
                  onChange={() => set({ credit })}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={cn(
                    'grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors',
                    checked ? 'border-gold-500' : 'border-navy-900/30',
                  )}
                >
                  {checked && <span className="block h-2.5 w-2.5 rounded-full bg-gold-500" />}
                </span>
                {t(`survey.credit_${credit}`)}
              </label>
            )
          })}
        </div>

        {/* Only the fields the chosen credit needs. */}
        {value.credit !== 'anonymous' && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-micro font-medium uppercase tracking-[0.08em] text-slate">
                {t('survey.creditName')}
              </span>
              <input
                value={value.name}
                onChange={(e) => set({ name: e.target.value })}
                autoComplete="name"
                aria-invalid={errors.name ? true : undefined}
                className={input(!!errors.name)}
              />
              {errors.name && (
                <span className="mt-1.5 block text-micro text-red-700">{errors.name}</span>
              )}
            </label>
            {value.credit === 'full_name_org' && (
              <label className="block">
                <span className="text-micro font-medium uppercase tracking-[0.08em] text-slate">
                  {t('survey.creditOrganisation')}
                </span>
                <input
                  value={value.organisation}
                  onChange={(e) => set({ organisation: e.target.value })}
                  autoComplete="organization"
                  aria-invalid={errors.organisation ? true : undefined}
                  className={input(!!errors.organisation)}
                />
                {errors.organisation && (
                  <span className="mt-1.5 block text-micro text-red-700">
                    {errors.organisation}
                  </span>
                )}
              </label>
            )}
          </div>
        )}
      </fieldset>

      <div>
        <p className="font-semibold text-navy-950">{t('survey.consentHeading')}</p>
        <label className="mt-2 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={value.consent}
            onChange={(e) => set({ consent: e.target.checked })}
            className="mt-1 h-5 w-5 shrink-0 accent-[#C9A227]"
          />
          <span className="text-body text-navy-900">{t('survey.consentText')}</span>
        </label>
        <p className="mt-3 text-small text-slate">{t('survey.consentNote')}</p>
      </div>
    </section>
  )
}
