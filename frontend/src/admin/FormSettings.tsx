import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import {
  adminApi,
  AdminError,
  toLocalized,
  type AdminSurvey,
  type DetailMode,
  type FormDetail,
  type FormType,
  type Locale,
  type Localized,
  type SurveyStatus,
} from './client'
import { Notice } from './ui'
import { Switch, TextField } from './QuestionCard'
import { LANGUAGES } from './formDraft'

const SITE = 'serinegaradialogue.org'

const FORM_TYPES: { value: FormType; label: string; hint: string; icon: React.ReactNode }[] = [
  {
    value: 'survey',
    label: 'Survey',
    hint: 'Before or during the event: a questionnaire, a live poll, questions from the floor.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
      >
        <rect x="4" y="3.5" width="16" height="17" rx="2" />
        <path d="M8 8.5h8M8 12h8M8 15.5h5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'feedback',
    label: 'Feedback',
    hint: 'After the event: what people thought, ending with an optional testimonial.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-6 w-6"
      >
        <path d="M4.5 5.5h15v10h-8l-4 3.5v-3.5h-3z" strokeLinejoin="round" />
        <path d="M9 10.5h.01M12 10.5h.01M15 10.5h.01" strokeLinecap="round" strokeWidth="2.2" />
      </svg>
    ),
  },
]

const DETAILS: { key: FormDetail; label: string; hint: string }[] = [
  { key: 'name', label: 'Full name', hint: 'Shown with their answers' },
  { key: 'email', label: 'Email', hint: 'One response per email; matches before and after' },
  { key: 'mobile', label: 'Phone', hint: 'Malaysian or international' },
  { key: 'organisation', label: 'Organisation', hint: 'Where they work or study' },
]

const MODES: { mode: DetailMode; label: string }[] = [
  { mode: 'required', label: 'Required' },
  { mode: 'optional', label: 'Optional' },
  { mode: 'off', label: "Don't ask" },
]

/**
 * A form's settings, laid out like the question builder: what kind of form,
 * its title and line under it (with one language switch for every text),
 * who is answering, its link, and whether it is taking answers. The cards
 * rise in turn; every choice answers back with a little movement.
 */
export function SurveyForm({
  survey,
  onCancel,
  onSaved,
}: {
  survey: AdminSurvey | null
  onCancel: () => void
  onSaved: (saved: AdminSurvey) => void
}) {
  const [formType, setFormType] = useState<FormType>(survey?.form_type ?? 'survey')
  const [title, setTitle] = useState<Localized>(toLocalized(survey?.title))
  const [description, setDescription] = useState<Localized>(toLocalized(survey?.description))
  const [slug, setSlug] = useState(survey?.slug ?? '')
  // A form that never chose keeps what it always asked: email and phone for
  // a survey, nothing for (anonymous) feedback.
  const [fields, setFields] = useState<Record<FormDetail, DetailMode>>(() => {
    const set =
      survey?.fields ??
      (survey?.form_type === 'feedback' ? {} : { email: 'required', mobile: 'required' })
    return {
      name: set.name ?? 'off',
      email: set.email ?? 'off',
      mobile: set.mobile ?? 'off',
      organisation: set.organisation ?? 'off',
    }
  })
  const [note, setNote] = useState<Localized>(toLocalized(survey?.details_note))
  const [status, setStatus] = useState<SurveyStatus>(survey?.status ?? 'draft')
  const [lang, setLang] = useState<Locale>('en')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  // Bumped on each refusal, so the message shakes again each time.
  const [refusals, setRefusals] = useState(0)
  const [busy, setBusy] = useState(false)

  const anonymous = fields.email === 'off' && fields.name === 'off'
  const asksSomething = Object.values(fields).some((m) => m !== 'off')
  const base = formType === 'feedback' ? 'feedback' : 'survey'
  const texts = [title, description, ...(asksSomething ? [note] : [])]
  const progress = (code: Locale) => {
    const withEnglish = texts.filter((t) => t.en.trim())
    return { done: withEnglish.filter((t) => t[code]?.trim()).length, total: withEnglish.length }
  }
  const explain = anonymous
    ? 'Anonymous: no name or email is asked, so anyone can send this form more than once (right for questions from the floor).'
    : fields.email !== 'off'
      ? 'Each email can answer once. Use the same email setting on the pre-event and feedback forms to compare answers.'
      : 'Without an email, people can send this form more than once.'

  const refuse = (message: string) => {
    setError(message)
    setRefusals((n) => n + 1)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    if (!title.en.trim()) {
      setLang('en')
      setFieldErrors({ 'title.en': 'Give the form a title in English.' })
      refuse('Give the form a title in English.')
      return
    }
    setBusy(true)
    try {
      const payload = {
        form_type: formType,
        title,
        description,
        slug,
        fields,
        details_note: note,
        ...(survey ? { status } : {}),
      }
      const saved = survey
        ? await adminApi.put<AdminSurvey>(`/admin/surveys/${survey.id}`, payload)
        : await adminApi.post<AdminSurvey>('/admin/surveys', payload)
      onSaved(saved)
    } catch (e) {
      if (e instanceof AdminError) {
        setFieldErrors(e.fields)
        refuse(Object.values(e.fields)[0] ?? e.message)
      } else {
        refuse('Could not save. Check the connection and try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    // The Save bar spans the whole working area: the form stretches to the
    // panel's edges and its content keeps to a readable column.
    <form onSubmit={save} className="-mx-4 -mb-4 sm:-mx-6 sm:-mb-6">
      <div className="mx-auto max-w-3xl px-4 pb-6 sm:px-6">
        <div className="admin-rise mb-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="group min-h-[34px] rounded-sm border border-[#DDDCD8] bg-white px-3 text-[0.78rem] font-semibold text-navy-900 transition-colors hover:border-navy-600"
          >
            <span className="inline-block transition-transform duration-200 group-hover:-translate-x-0.5">
              ←
            </span>{' '}
            Back
          </button>
          <h2 className="text-[1.05rem] font-semibold text-navy-950">
            {survey ? 'Form settings' : 'New form'}
          </h2>
        </div>

        <div className="space-y-4">
          {/* 1. What kind of form */}
          <Section step={1} title="What kind of form is it?">
            <div className="grid gap-3 sm:grid-cols-2">
              {FORM_TYPES.map((t) => {
                const on = formType === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setFormType(t.value)}
                    aria-pressed={on}
                    className={cn(
                      'relative flex items-start gap-3 rounded-md border p-4 text-left',
                      'transition-[border-color,background-color,box-shadow,transform] duration-200 ease-gentle',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50',
                      on
                        ? 'border-gold-500 bg-gold-500/10 shadow-[inset_0_0_0_1px_theme(colors.gold.500)]'
                        : 'border-[#DDDCD8] bg-white hover:-translate-y-0.5 hover:border-navy-600 hover:shadow-card',
                    )}
                  >
                    <span
                      key={on ? 'on' : 'off'}
                      className={cn('mt-0.5', on ? 'admin-pop text-gold-700' : 'text-slate')}
                    >
                      {t.icon}
                    </span>
                    <span>
                      <span className="block text-[0.95rem] font-semibold text-navy-950">
                        {t.label}
                      </span>
                      <span className="mt-0.5 block text-micro leading-relaxed text-slate">
                        {t.hint}
                      </span>
                    </span>
                    {on && (
                      <span
                        aria-hidden
                        className="admin-pop absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-gold-500 text-[0.7rem] font-bold text-white"
                      >
                        ✓
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </Section>

          {/* 2. Title and the line under it, with one switch for every language */}
          <Section
            step={2}
            title="Title"
            aside={
              <Sliding
                label="Language you are editing"
                role="tablist"
                value={lang}
                onChange={setLang}
                options={LANGUAGES.map((l) => {
                  const p = l.code === 'en' ? null : progress(l.code)
                  const done = p && p.total > 0 && p.done === p.total
                  return {
                    value: l.code,
                    label: (
                      <>
                        {l.label}
                        {p && p.total > 0 && (
                          <span
                            className={cn(
                              'tnum ml-1.5 rounded-full px-1.5 text-[0.66rem] transition-colors',
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
                      </>
                    ),
                  }
                })}
                small
              />
            }
          >
            <div key={lang} className="admin-fade space-y-3">
              <TextField
                value={title}
                lang={lang}
                onChange={setTitle}
                placeholder="e.g. Before the Dialogue"
                label="Title"
                big
                maxLength={150}
              />
              {fieldErrors['title.en'] && (
                <p className="admin-fade text-micro font-semibold text-red-700">
                  {fieldErrors['title.en']}
                </p>
              )}
              <TextField
                value={description}
                lang={lang}
                onChange={setDescription}
                placeholder="A line under the title: what the form is for (optional)"
                label="Description"
                multiline
                maxLength={500}
              />
              {lang !== 'en' && (
                <p className="text-micro text-slate">
                  Type each translation under the grey English. Anything left empty shows in
                  English.
                </p>
              )}
            </div>
          </Section>

          {/* 3. Who is answering */}
          <Section step={3} title="What should people tell you about themselves?">
            <p className="-mt-1 mb-3 text-micro text-slate">
              Asked on the first page, before the questions.
            </p>
            <div className="divide-y divide-[#EEEDEA] rounded-md border border-[#E6E5E1]">
              {DETAILS.map((d) => (
                <div
                  key={d.key}
                  className={cn(
                    'flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 transition-colors duration-200',
                    fields[d.key] === 'off' ? 'bg-[#FAFAF8]' : 'bg-white',
                  )}
                >
                  <div>
                    <p
                      className={cn(
                        'text-[0.88rem] font-semibold transition-colors duration-200',
                        fields[d.key] === 'off' ? 'text-slate' : 'text-navy-950',
                      )}
                    >
                      {d.label}
                    </p>
                    <p className="text-micro text-slate">{d.hint}</p>
                  </div>
                  <Sliding
                    label={d.label}
                    role="radiogroup"
                    value={fields[d.key]}
                    onChange={(mode) => setFields((f) => ({ ...f, [d.key]: mode }))}
                    options={MODES.map((m) => ({ value: m.mode, label: m.label }))}
                    muted={fields[d.key] === 'off'}
                    bordered
                  />
                </div>
              ))}
            </div>
            <p
              key={explain}
              className={cn(
                'admin-fade mt-3 rounded-sm px-3 py-2 text-micro transition-colors duration-200',
                anonymous ? 'bg-gold-500/10 text-navy-900' : 'bg-[#F7F7F5] text-slate',
              )}
            >
              {explain}
            </p>
            <div className={cn('admin-collapse', asksSomething && 'is-open')}>
              <div>
                <div className="pt-4">
                  <p className="mb-1 text-[0.82rem] font-semibold text-navy-950">
                    Note beside these details{' '}
                    <span className="font-normal text-slate">(optional)</span>
                  </p>
                  <TextField
                    value={note}
                    lang={lang}
                    onChange={setNote}
                    placeholder="e.g. Responses are seen only by the organising team; findings are reported together."
                    label="Note beside the details"
                    multiline
                    maxLength={500}
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* 4. The link */}
          <Section step={4} title="Link and QR code">
            <label className="block">
              <span className="text-micro text-slate">
                A short, fixed link. Choose it before printing a QR code; it stays the same.
              </span>
              <span
                className={cn(
                  'mt-2 flex items-center overflow-hidden rounded-sm border bg-white transition-[border-color,box-shadow] duration-200',
                  'focus-within:border-gold-500 focus-within:ring-2 focus-within:ring-gold-500/30',
                  fieldErrors.slug ? 'border-red-400' : 'border-[#DDDCD8]',
                )}
              >
                <span className="whitespace-nowrap border-r border-[#E6E5E1] bg-[#F7F7F5] px-3 py-2 text-[0.82rem] text-slate">
                  {SITE}/
                  <span key={base} className="admin-fade inline-block font-semibold text-navy-800">
                    {base}
                  </span>
                  /
                </span>
                <input
                  value={slug}
                  onChange={(e) =>
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, ''),
                    )
                  }
                  placeholder={survey ? `(automatic, e.g. ${survey.id})` : 'pre-event'}
                  maxLength={60}
                  aria-label="Short link"
                  className="min-w-0 flex-1 bg-transparent px-2 py-2 text-[0.88rem] font-semibold text-navy-950 placeholder:font-normal placeholder:text-slate/60 focus:outline-none"
                />
              </span>
            </label>
            {fieldErrors.slug ? (
              <p className="admin-fade mt-1.5 text-micro font-semibold text-red-700">
                {fieldErrors.slug}
              </p>
            ) : (
              <p className="mt-1.5 text-micro text-slate">
                Lowercase letters, numbers and dashes. Leave empty for an automatic link.
              </p>
            )}
          </Section>

          {/* 5. Taking answers (an existing form; a new one starts off) */}
          {survey ? (
            <Section step={5} title="Taking answers">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-micro text-slate">
                  When this is off, people who open the link are told the form is closed.
                </p>
                <Switch
                  checked={status === 'open'}
                  onChange={(on) => setStatus(on ? 'open' : status === 'open' ? 'closed' : status)}
                  label={status === 'open' ? 'Active' : 'Inactive'}
                />
              </div>
            </Section>
          ) : (
            <p className="admin-rise px-1 text-micro text-slate" style={{ animationDelay: '0.3s' }}>
              A new form starts inactive. Add its questions next, then switch it on when it is
              ready.
            </p>
          )}
        </div>
      </div>

      <div className="admin-bar-up sticky bottom-0 z-10 border-t border-[#DDDCD8] bg-white/95 shadow-[0_-6px_16px_-8px_rgba(11,33,64,0.25)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-end gap-3 px-4 py-3 sm:px-6">
          {error && (
            <span key={refusals} className="admin-shake mr-auto">
              <Notice kind="error">{error}</Notice>
            </span>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[38px] rounded-sm px-4 text-[0.82rem] font-semibold text-navy-900 transition-colors hover:bg-[#F1F1EF]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="group inline-flex min-h-[38px] items-center gap-2 rounded-sm bg-navy-900 px-5 text-[0.82rem] font-semibold text-cream transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-navy-800 hover:shadow-cardHover active:translate-y-0 disabled:translate-y-0 disabled:opacity-70"
          >
            {busy && (
              <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" aria-hidden>
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeOpacity="0.25"
                  strokeWidth="3"
                />
                <path
                  d="M21 12a9 9 0 0 0-9-9"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            )}
            {busy ? 'Saving…' : survey ? 'Save settings' : 'Create form and add questions'}
            {!busy && (
              <span
                aria-hidden
                className="inline-block transition-transform duration-200 group-hover:translate-x-0.5"
              >
                →
              </span>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}

/** A numbered card, one decision each; the cards rise in turn as the page opens. */
function Section({
  step,
  title,
  aside,
  children,
}: {
  step: number
  title: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section
      className="admin-card-in rounded-md border border-[#E6E5E1] bg-white px-4 py-4 transition-shadow duration-300 focus-within:shadow-[0_6px_24px_-12px_rgba(11,33,64,0.3)] sm:px-6 sm:py-5"
      style={{ animationDelay: `${step * 60}ms` }}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2.5 text-[0.95rem] font-semibold text-navy-950">
          <span className="tnum grid h-6 w-6 place-items-center rounded-full bg-gold-500/15 text-micro font-semibold text-gold-700">
            {step}
          </span>
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

/**
 * A row of choices with one highlight that slides to the chosen one, for
 * the language tabs and the Required / Optional / Don't ask buttons.
 */
function Sliding<T extends string>({
  label,
  role,
  value,
  onChange,
  options,
  small,
  muted,
  bordered,
}: {
  label: string
  role: 'tablist' | 'radiogroup'
  value: T
  onChange: (v: T) => void
  options: { value: T; label: React.ReactNode }[]
  small?: boolean
  /** The chosen option is "off": a quieter highlight. */
  muted?: boolean
  bordered?: boolean
}) {
  const box = useRef<HTMLDivElement>(null)
  const [mark, setMark] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const measure = () => {
      const el = box.current?.querySelector<HTMLElement>('[data-on="true"]')
      if (!el) return
      const next = { left: el.offsetLeft, width: el.offsetWidth }
      // Only a real move updates: setting a new object every render loops.
      setMark((m) => (m && m.left === next.left && m.width === next.width ? m : next))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  })

  return (
    <div
      ref={box}
      role={role}
      aria-label={label}
      className={cn(
        'relative isolate flex flex-wrap',
        bordered ? 'overflow-hidden rounded-sm border border-[#DDDCD8] bg-white' : 'gap-1',
      )}
    >
      {mark && (
        <span
          aria-hidden
          className={cn(
            'absolute inset-y-0 -z-10 transition-[left,width,background-color] duration-300 ease-gentle',
            bordered ? '' : 'rounded-sm',
            muted ? 'bg-[#E9E8E4]' : 'bg-navy-900',
          )}
          style={{ left: mark.left, width: mark.width }}
        />
      )}
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role={role === 'tablist' ? 'tab' : 'radio'}
            aria-selected={role === 'tablist' ? on : undefined}
            aria-checked={role === 'radiogroup' ? on : undefined}
            data-on={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex items-center font-semibold transition-colors duration-200',
              small ? 'min-h-[30px] px-2 text-[0.75rem]' : 'min-h-[32px] px-3 text-[0.76rem]',
              bordered && 'border-l border-[#DDDCD8] first:border-l-0',
              on
                ? muted
                  ? 'text-navy-900'
                  : 'text-cream'
                : 'text-slate hover:bg-black/[0.03] hover:text-navy-900',
              !bordered && 'rounded-sm',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
