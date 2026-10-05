import { useState } from 'react'
import { cn } from '@/lib/cn'
import {
  adminApi,
  AdminError,
  toLocalized,
  type AdminSurveyQuestion,
  type Locale,
  type Localized,
  type SurveyQuestionType,
} from './client'
import { AdminButton, AdminCard, LocalizedFieldset, Notice } from './ui'

const TYPES: { value: SurveyQuestionType; label: string; hint: string }[] = [
  { value: 'choice', label: 'Multiple choice', hint: 'Pick one option' },
  { value: 'rating', label: 'Rating', hint: '1 to 5 stars' },
  { value: 'text', label: 'Text', hint: 'A written answer' },
]

export function SurveyQuestionForm({
  surveyId,
  question,
  onCancel,
  onSaved,
}: {
  surveyId: number
  question: AdminSurveyQuestion | null
  onCancel: () => void
  onSaved: () => void
}) {
  // Answered questions keep their type and options, or old answers would
  // point at different options. The API refuses it too; this just says so first.
  const locked = (question?.responses_count ?? 0) > 0
  const [type, setType] = useState<SurveyQuestionType>(question?.type ?? 'choice')
  const [text, setText] = useState<Localized>(toLocalized(question?.question))
  const [options, setOptions] = useState<Localized[]>(
    question?.options?.map(toLocalized) ?? [toLocalized(null), toLocalized(null)],
  )
  const [required, setRequired] = useState(question?.is_required ?? true)
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
        options: type === 'choice' ? options : null,
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

        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#C9A227]"
          />
          <span className="text-small text-navy-800">
            Required
            <span className="block text-micro text-slate">
              Untick to let attendees skip this question.
            </span>
          </span>
        </label>

        {type === 'choice' && (
          <div className="space-y-3">
            {options.map((opt, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1">
                  <LocalizedFieldset
                    label={`Option ${i + 1}`}
                    value={opt}
                    onChange={(v) => setOptions((all) => all.map((o, j) => (j === i ? v : o)))}
                    errors={localeErrors(`options.${i}`)}
                  />
                </div>
                <AdminButton
                  variant="danger"
                  disabled={locked || options.length <= 2}
                  onClick={() => setOptions((all) => all.filter((_, j) => j !== i))}
                  className="mt-3"
                >
                  Remove
                </AdminButton>
              </div>
            ))}
            <AdminButton
              variant="quiet"
              disabled={locked || options.length >= 10}
              onClick={() => setOptions((all) => [...all, toLocalized(null)])}
            >
              Add option
            </AdminButton>
          </div>
        )}
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
