import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/cn'
import {
  pick,
  savedIdentity,
  saveIdentity,
  surveyApi,
  SurveyError,
  type Identity,
  type PublicQuestion,
  type PublicSurvey,
} from '@/services/survey'

/** One survey, at its own link. Registered attendees answer it. */
export function Survey() {
  const { id = '' } = useParams()
  const { t, locale } = useI18n()
  const [identity, setIdentity] = useState(savedIdentity)
  const [survey, setSurvey] = useState<PublicSurvey | null>(null)
  const [missing, setMissing] = useState(false)

  const load = useCallback(
    () =>
      surveyApi
        .get(id, identity?.token)
        .then((s) => {
          setSurvey(s)
          setMissing(false)
        })
        .catch((e) => {
          if (e instanceof SurveyError && e.status === 404) setMissing(true)
        }),
    [id, identity?.token],
  )

  // Every ten seconds, so a question the moderator opens appears by itself.
  useEffect(() => {
    load()
    const timer = window.setInterval(load, 10000)
    return () => window.clearInterval(timer)
  }, [load])

  const forget = () => {
    saveIdentity(null)
    setIdentity(null)
  }

  return (
    <section className="mx-auto min-h-[70vh] max-w-xl px-5 pb-20 pt-28 sm:pt-32">
      <h1 className="font-display text-[2rem] leading-tight text-navy-950">
        {survey ? pick(survey.title, locale) : t('survey.title')}
      </h1>
      {survey?.description && <p className="mt-2 text-slate">{pick(survey.description, locale)}</p>}

      <div className="mt-8">
        {missing ? (
          <Message>{t('survey.missing')}</Message>
        ) : survey && survey.status !== 'open' ? (
          <Message>{t('survey.notOpen')}</Message>
        ) : !identity ? (
          <Identify
            onIdentified={(next) => {
              saveIdentity(next)
              setIdentity(next)
            }}
          />
        ) : (
          survey && (
            <div className="space-y-4">
              <p className="text-navy-900">
                {t('survey.welcome', { name: identity.firstName })}{' '}
                <button type="button" onClick={forget} className="text-small text-slate underline">
                  {t('survey.notYou')}
                </button>
              </p>
              {survey.questions.length === 0 && <Message>{t('survey.wait')}</Message>}
              {survey.questions.map((q) => (
                <QuestionCard key={q.id} question={q} token={identity.token} onDone={load} onForget={forget} />
              ))}
            </div>
          )
        )}
      </div>
    </section>
  )
}

function Message({ children }: { children: React.ReactNode }) {
  return <p className="rounded-sm border border-hair bg-white px-4 py-6 text-center text-slate">{children}</p>
}

function Identify({ onIdentified }: { onIdentified: (identity: Identity) => void }) {
  const { t } = useI18n()
  const [contact, setContact] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!contact.trim()) return
    setBusy(true)
    setError(null)
    try {
      onIdentified(await surveyApi.identify(contact.trim()))
    } catch (err) {
      setError(err instanceof SurveyError && err.status === 422 ? t('survey.notFound') : t('survey.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="block font-semibold text-navy-950">{t('survey.contact')}</span>
        <span className="block text-small text-slate">{t('survey.contactHint')}</span>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          autoComplete="email"
          aria-invalid={error ? true : undefined}
          className={cn(
            'mt-2 block w-full rounded-sm border bg-white px-3 py-2.5 text-navy-950 focus:outline-none focus:ring-2 focus:ring-gold-500/40',
            error ? 'border-red-400' : 'border-hair',
          )}
        />
      </label>
      {error && (
        <p role="alert" className="text-small text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="rounded-sm bg-navy-900 px-5 py-2.5 font-semibold text-cream hover:bg-navy-800 disabled:opacity-50"
      >
        {t('survey.continue')}
      </button>
      <p className="text-micro text-slate">{t('survey.linked')}</p>
    </form>
  )
}

function QuestionCard({
  question,
  token,
  onDone,
  onForget,
}: {
  question: PublicQuestion
  token: string
  onDone: () => void
  onForget: () => void
}) {
  const { t, locale } = useI18n()
  const [answer, setAnswer] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!answer.trim()) return
    setBusy(true)
    setError(null)
    try {
      await surveyApi.answer(question.id, token, answer)
      setDone(true)
      onDone()
    } catch (err) {
      if (err instanceof SurveyError && err.status === 401) return onForget()
      if (err instanceof SurveyError && err.status === 409) return setDone(true)
      setError(err instanceof SurveyError && err.message ? err.message : t('survey.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-sm border border-hair bg-white p-4">
      <p className="font-semibold text-navy-950">{pick(question.question, locale)}</p>

      {done || question.answered ? (
        <p className="mt-3 text-small text-green-800">✓ {t('survey.thanks')}</p>
      ) : (
        <>
          <div className="mt-3">
            {question.type === 'choice' && (
              <div className="space-y-2">
                {question.options?.map((o, i) => (
                  <label
                    key={i}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-sm border px-3 py-2.5',
                      answer === String(i) ? 'border-navy-900 bg-navy-900/5' : 'border-hair',
                    )}
                  >
                    <input
                      type="radio"
                      name={`q${question.id}`}
                      checked={answer === String(i)}
                      onChange={() => setAnswer(String(i))}
                      className="accent-[#0B2140]"
                    />
                    {pick(o, locale)}
                  </label>
                ))}
              </div>
            )}

            {question.type === 'rating' && (
              <div className="flex gap-2" role="radiogroup">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={answer === String(n)}
                    aria-label={String(n)}
                    onClick={() => setAnswer(String(n))}
                    className={cn(
                      'h-11 w-11 rounded-sm border text-xl',
                      Number(answer) >= n ? 'border-gold-500 bg-gold-500/15 text-gold-700' : 'border-hair text-slate',
                    )}
                  >
                    ★
                  </button>
                ))}
              </div>
            )}

            {question.type === 'text' && (
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder={t('survey.typeHere')}
                className="block w-full rounded-sm border border-hair px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
              />
            )}
          </div>

          {error && (
            <p role="alert" className="mt-2 text-small text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !answer.trim()}
            className="mt-3 rounded-sm bg-navy-900 px-5 py-2 font-semibold text-cream hover:bg-navy-800 disabled:opacity-40"
          >
            {t('survey.submit')}
          </button>
        </>
      )}
    </form>
  )
}
