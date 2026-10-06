import {
  toLocalized,
  type AdminSurveyQuestion,
  type FormType,
  type Locale,
  type Localized,
  type SurveyQuestionType,
  type SurveyStatus,
} from './client'

/**
 * The kinds of question the builder offers. "Numbered scale" is a single
 * choice shown as numbered cards, so it is stored as a choice with a scale
 * layout; the rest map one to one.
 */
export type QuestionKind = 'choice' | 'checkbox' | 'scale' | 'grid' | 'rating' | 'text'

export const KINDS: { kind: QuestionKind; label: string; hint: string }[] = [
  { kind: 'choice', label: 'Multiple choice', hint: 'Pick one option' },
  { kind: 'checkbox', label: 'Checkboxes', hint: 'Tick one or more' },
  { kind: 'scale', label: 'Numbered scale', hint: '1 to 5, e.g. Very weak … Very strong' },
  { kind: 'grid', label: 'Agree / disagree table', hint: 'One answer for each statement' },
  { kind: 'rating', label: 'Star rating', hint: '1 to 5 stars' },
  { kind: 'text', label: 'Written answer', hint: 'A sentence or a paragraph' },
]

export const LANGUAGES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ms', label: 'Bahasa Malaysia' },
  { code: 'zh', label: '中文' },
  { code: 'ta', label: 'தமிழ்' },
]

/** One question as the builder edits it: every text in all four languages. */
export interface Draft {
  kind: QuestionKind
  question: Localized
  help: Localized
  section: { title: Localized; intro: Localized } | null
  options: Localized[]
  statements: Localized[]
  hasOther: boolean
  maxChoices: number | null
  maxLength: number | null
  required: boolean
  status: SurveyStatus
}

export const localized = (en = ''): Localized => ({ ...toLocalized(null), en })

export function kindOf(q: Pick<AdminSurveyQuestion, 'type' | 'layout'>): QuestionKind {
  if (q.type === 'choice' && q.layout === 'scale') return 'scale'
  return q.type
}

export function typeOf(kind: QuestionKind): SurveyQuestionType {
  return kind === 'scale' ? 'choice' : kind
}

export const hasOptionList = (kind: QuestionKind) =>
  kind === 'choice' || kind === 'checkbox' || kind === 'scale' || kind === 'grid'

export function fromQuestion(q: AdminSurveyQuestion): Draft {
  return {
    kind: kindOf(q),
    question: toLocalized(q.question),
    help: toLocalized(q.help),
    section: q.section
      ? { title: toLocalized(q.section.title), intro: toLocalized(q.section.intro) }
      : null,
    options: (q.options ?? []).map(toLocalized),
    statements: (q.statements ?? []).map(toLocalized),
    hasOther: q.has_other,
    maxChoices: q.max_choices,
    maxLength: q.max_length,
    required: q.is_required,
    status: q.status,
  }
}

/** A new question, ready to type over: Google Forms' "Untitled question". */
export function blankDraft(withSection = false): Draft {
  return {
    kind: 'choice',
    question: localized('Untitled question'),
    help: localized(),
    section: withSection ? { title: localized('New section'), intro: localized() } : null,
    options: [localized('Option 1'), localized('Option 2')],
    statements: [],
    hasOther: false,
    maxChoices: null,
    maxLength: null,
    required: false,
    status: 'open',
  }
}

/**
 * Switching kind keeps what still fits: the options carry over between the
 * kinds that have them, and a kind that needs them starts with two.
 */
export function withKind(d: Draft, kind: QuestionKind): Draft {
  const next: Draft = { ...d, kind }
  if (hasOptionList(kind) && next.options.length === 0) {
    next.options =
      kind === 'grid'
        ? ['Strongly agree', 'Agree', 'Neutral', 'Disagree', 'Strongly disagree'].map((t) =>
            localized(t),
          )
        : [localized('Option 1'), localized('Option 2')]
  }
  if (kind === 'grid' && next.statements.length === 0) {
    next.statements = [localized('Statement 1'), localized('Statement 2')]
  }
  if (kind !== 'choice' && kind !== 'checkbox') next.hasOther = false
  if (kind !== 'checkbox') next.maxChoices = null
  if (kind !== 'text') next.maxLength = null
  return next
}

/** What the API takes for this draft. Every setting is sent, every time. */
export function toPayload(d: Draft) {
  return {
    type: typeOf(d.kind),
    question: d.question,
    help: d.help,
    section: d.section && d.section.title.en.trim() ? d.section : null,
    options: hasOptionList(d.kind) ? d.options : null,
    statements: d.kind === 'grid' ? d.statements : null,
    layout: d.kind === 'scale' ? 'scale' : null,
    max_choices: d.kind === 'checkbox' && d.maxChoices ? d.maxChoices : null,
    has_other: (d.kind === 'choice' || d.kind === 'checkbox') && d.hasOther,
    max_length: d.kind === 'text' && d.maxLength ? d.maxLength : null,
    is_required: d.required,
    status: d.status,
  }
}

/**
 * What would stop this draft saving, in the words the team reads it in.
 * Checked before sending, so autosave never sends something the API refuses.
 */
export function problemsOf(d: Draft, formType: FormType): string[] {
  const out: string[] = []
  if (!d.question.en.trim()) out.push('Type the question in English.')
  if (d.section && !d.section.title.en.trim()) {
    out.push('Give the new page a heading in English, or remove the page break.')
  }
  if (hasOptionList(d.kind)) {
    const min = d.kind === 'checkbox' && formType === 'feedback' ? 1 : 2
    if (d.options.length < min) {
      out.push(min === 1 ? 'Add at least one option.' : 'Add at least two options.')
    } else if (d.options.some((o) => !o.en.trim())) {
      out.push('Fill in or remove the empty option.')
    }
  }
  if (d.kind === 'grid') {
    if (d.statements.length === 0) out.push('Add at least one statement.')
    else if (d.statements.some((s) => !s.en.trim())) {
      out.push('Fill in or remove the empty statement.')
    }
  }
  return out
}

/**
 * Translation progress for one language: how many of the texts written in
 * English have this language filled in too.
 */
export function translated(drafts: Draft[], lang: Locale): { done: number; total: number } {
  let done = 0
  let total = 0
  const count = (v: Localized | null | undefined) => {
    if (!v || !v.en.trim()) return
    total++
    if (v[lang]?.trim()) done++
  }
  for (const d of drafts) {
    count(d.question)
    count(d.help)
    if (d.section) {
      count(d.section.title)
      count(d.section.intro)
    }
    if (hasOptionList(d.kind)) d.options.forEach(count)
    if (d.kind === 'grid') d.statements.forEach(count)
  }
  return { done, total }
}
