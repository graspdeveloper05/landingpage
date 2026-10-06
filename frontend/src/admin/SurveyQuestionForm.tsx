import { useState } from 'react'
import { cn } from '@/lib/cn'
import {
  adminApi,
  AdminError,
  toLocalized,
  type AdminSurveyQuestion,
  type FormType,
  type Locale,
  type Localized,
  type SurveyQuestionType,
} from './client'
import { AdminButton, AdminCard, LocalizedFieldset, Notice } from './ui'

const TYPES: { value: SurveyQuestionType; label: string; hint: string }[] = [
  { value: 'choice', label: 'Multiple choice', hint: 'Pick one option' },
  { value: 'checkbox', label: 'Checkboxes', hint: 'Pick any options' },
  { value: 'grid', label: 'Statement table', hint: 'One choice per statement' },
  { value: 'rating', label: 'Rating', hint: '1 to 5 stars' },
  { value: 'text', label: 'Text', hint: 'A written answer' },
]

const numberClass =
  'block w-24 rounded-sm border border-[#DDDCD8] px-2.5 py-1.5 text-[0.85rem] focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/35'

export function SurveyQuestionForm({
  surveyId,
  formType,
  question,
  onCancel,
  onSaved,
}: {
  surveyId: number
  /** Feedback forms may have a single tickbox, e.g. consent to publish. */
  formType: FormType
  question: AdminSurveyQuestion | null
  onCancel: () => void
  onSaved: () => void
}) {
  // Answered questions keep their type and options, or old answers would
  // point at different options. The API refuses it too; this just says so first.
  const locked = (question?.responses_count ?? 0) > 0
  const [type, setType] = useState<SurveyQuestionType>(question?.type ?? 'choice')
  const hasOptions = type === 'choice' || type === 'checkbox' || type === 'grid'
  const minOptions = type === 'checkbox' && formType === 'feedback' ? 1 : 2
  const [text, setText] = useState<Localized>(toLocalized(question?.question))
  const [help, setHelp] = useState<Localized>(toLocalized(question?.help))
  const [sectionTitle, setSectionTitle] = useState<Localized>(toLocalized(question?.section?.title))
  const [sectionIntro, setSectionIntro] = useState<Localized>(toLocalized(question?.section?.intro))
  const [options, setOptions] = useState<Localized[]>(
    question?.options?.map(toLocalized) ?? [toLocalized(null), toLocalized(null)],
  )
  const [statements, setStatements] = useState<Localized[]>(
    question?.statements?.map(toLocalized) ?? [toLocalized(null), toLocalized(null)],
  )
  const [scale, setScale] = useState(question?.layout === 'scale')
  const [maxChoices, setMaxChoices] = useState(question?.max_choices ?? 0)
  const [hasOther, setHasOther] = useState(question?.has_other ?? false)
  const [maxLength, setMaxLength] = useState(question?.max_length ?? 0)
  const [required, setRequired] = useState(question?.is_required ?? false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const localeErrors = (prefix: string) =>
    Object.fromEntries(
      Object.entries(fieldErrors)
        .filter(([k]) => k.startsWith(`${prefix}.`))
        .map(([k, v]) => [k.slice(prefix.length + 1) as Locale, v]),
    ) as Partial<Record<Locale, string>>

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setFieldErrors({})
    try {
      const payload = {
        type,
        question: text,
        help,
        section: sectionTitle.en.trim() ? { title: sectionTitle, intro: sectionIntro } : null,
        options: hasOptions ? options : null,
        statements: type === 'grid' ? statements : null,
        layout: type === 'choice' && scale ? 'scale' : null,
        max_choices: type === 'checkbox' && maxChoices > 0 ? maxChoices : null,
        has_other: (type === 'choice' || type === 'checkbox') && hasOther,
        max_length: type === 'text' && maxLength > 0 ? maxLength : null,
        is_required: required,
        ...(question ? { status: question.status } : {}),
      }
      if (question) await adminApi.put(`/admin/survey-questions/${question.id}`, payload)
      else await adminApi.post(`/admin/surveys/${surveyId}/questions`, payload)
      onSaved()
    } catch (e) {
      if (e instanceof AdminError) {
        setFieldErrors(e.fields)
        setError(
          e.fields.options ??
            e.fields.statements ??
            e.fields.type ??
            (Object.keys(e.fields).length > 0
              ? 'Some fields need attention — see below.'
              : e.message),
        )
      } else {
        setError('Could not save.')
      }
    } finally {
      setBusy(false)
    }
  }

  /** A list of translated lines that can grow and shrink: options or statements. */
  const list = (
    label: string,
    items: Localized[],
    set: React.Dispatch<React.SetStateAction<Localized[]>>,
    prefix: string,
    min: number,
    max: number,
    adding: string,
  ) => (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1">
            <LocalizedFieldset
              label={`${label} ${i + 1}`}
              value={item}
              onChange={(v) => set((all) => all.map((o, j) => (j === i ? v : o)))}
              errors={localeErrors(`${prefix}.${i}`)}
            />
          </div>
          <AdminButton
            variant="danger"
            disabled={locked || items.length <= min}
            onClick={() => set((all) => all.filter((_, j) => j !== i))}
            className="mt-3"
          >
            Remove
          </AdminButton>
        </div>
      ))}
      <AdminButton
        variant="quiet"
        disabled={locked || items.length >= max}
        onClick={() => set((all) => [...all, toLocalized(null)])}
      >
        {adding}
      </AdminButton>
    </div>
  )

  const tick = (
    checked: boolean,
    onChange: (v: boolean) => void,
    label: string,
    hint: string,
    disabled = false,
  ) => (
    <label className="flex items-start gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[#C9A227]"
      />
      <span className="text-small text-navy-800">
        {label}
        <span className="block text-micro text-slate">{hint}</span>
      </span>
    </label>
  )

  return (
    <form onSubmit={save}>
      <h2 className="mb-4 text-[0.95rem] font-semibold text-navy-950">
        {question ? 'Edit question' : 'Add question'}
      </h2>

      <AdminCard className="space-y-4">
        {locked && (
          <Notice kind="error">
            People have answered this question. You can change the wording and translations, but not
            the type or the number and order of options.
          </Notice>
        )}

        <fieldset>
          <legend className="mb-1 text-[0.78rem] font-semibold text-navy-900">Type</legend>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                disabled={locked}
                onClick={() => setType(t.value)}
                className={cn(
                  'rounded-sm border px-3 py-1.5 text-left disabled:cursor-not-allowed disabled:opacity-60',
                  type === t.value
                    ? 'border-navy-900 bg-navy-900 text-cream'
                    : 'border-[#DDDCD8] bg-white text-navy-900 hover:border-gold-500',
                )}
              >
                <span className="block text-[0.78rem] font-semibold">{t.label}</span>
                <span className="block text-micro opacity-75">{t.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <LocalizedFieldset
          label="Question"
          hint="Only English is required; empty languages show the English."
          value={text}
          onChange={setText}
          errors={localeErrors('question')}
        />

        <LocalizedFieldset
          label="Note under the question (optional)"
          hint="E.g. what a word means, or 'Similar questions may be grouped.'"
          value={help}
          onChange={setHelp}
          errors={localeErrors('help')}
        />

        {tick(
          required,
          setRequired,
          'Required',
          'Tick if attendees must answer this question before submitting.',
        )}

        {type === 'grid' &&
          list('Statement', statements, setStatements, 'statements', 1, 10, 'Add statement')}

        {hasOptions && (
          <div>
            {type === 'grid' && (
              <p className="mb-2 text-micro text-slate">
                The options below are the scale each statement is answered on, e.g. Strongly agree …
                Strongly disagree.
              </p>
            )}
            {list(
              type === 'grid' ? 'Scale option' : 'Option',
              options,
              setOptions,
              'options',
              minOptions,
              15,
              'Add option',
            )}
          </div>
        )}

        {type === 'choice' &&
          tick(
            scale,
            setScale,
            'Show as a numbered scale',
            "Options appear as numbered cards, 1 to 5 across. An option starting 'Not sure' or 'N/A' stands apart, unnumbered.",
          )}

        {(type === 'choice' || type === 'checkbox') &&
          tick(
            hasOther,
            setHasOther,
            "Add 'Other' with a text box",
            'Shown after the last option; attendees type what it is.',
            locked,
          )}

        {type === 'checkbox' && (
          <label className="block">
            <span className="text-[0.78rem] font-semibold text-navy-900">
              Maximum choices (optional)
            </span>
            <span className="block text-micro text-slate">
              E.g. 3 for "Select up to three". Leave 0 for no limit.
            </span>
            <input
              type="number"
              min={0}
              max={10}
              value={maxChoices}
              onChange={(e) => setMaxChoices(Number(e.target.value))}
              className={cn(numberClass, 'mt-1')}
            />
          </label>
        )}

        {type === 'text' && (
          <label className="block">
            <span className="text-[0.78rem] font-semibold text-navy-900">
              Maximum characters (optional)
            </span>
            <span className="block text-micro text-slate">
              E.g. 300. Leave 0 for the usual 1,000.
            </span>
            <input
              type="number"
              min={0}
              max={2000}
              value={maxLength}
              onChange={(e) => setMaxLength(Number(e.target.value))}
              className={cn(numberClass, 'mt-1')}
            />
          </label>
        )}

        <details
          className="rounded-sm border border-[#DDDCD8] px-3 py-2"
          open={!!question?.section}
        >
          <summary className="cursor-pointer text-[0.78rem] font-semibold text-navy-900">
            Start a new page here (optional)
          </summary>
          <div className="mt-3 space-y-3">
            <p className="text-micro text-slate">
              A section heading starts a new page at this question; it shows in the dark band at the
              top. Leave the English empty for no new page.
            </p>
            <LocalizedFieldset
              label="Section heading"
              value={sectionTitle}
              onChange={setSectionTitle}
              errors={localeErrors('section.title')}
            />
            <LocalizedFieldset
              label="Section introduction (optional)"
              value={sectionIntro}
              onChange={setSectionIntro}
              errors={localeErrors('section.intro')}
            />
          </div>
        </details>
      </AdminCard>

      <div className="sticky bottom-0 -mx-4 -mb-4 mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-[#DDDCD8] bg-white px-4 py-3 shadow-[0_-6px_16px_-8px_rgba(11,33,64,0.25)] sm:-mx-6 sm:-mb-6 sm:px-6">
        {error && <Notice kind="error">{error}</Notice>}
        <AdminButton variant="quiet" onClick={onCancel}>
          Cancel
        </AdminButton>
        <AdminButton type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </AdminButton>
      </div>
    </form>
  )
}
