import { API_BASE } from '@/services/api'

/** Only English is required; other languages may be empty. */
export type Text = { en: string } & Partial<Record<'ms' | 'zh' | 'ta', string | null>>

export interface PublicQuestion {
  id: number
  type: 'choice' | 'checkbox' | 'rating' | 'text'
  question: Text
  options: Text[] | null
  /** Optional questions can be left blank; the skip is still sent. */
  is_required: boolean
  answered: boolean
}

export interface PublicSurvey {
  id: number
  form_type: 'survey' | 'feedback'
  title: Text
  description: Text | null
  status: 'draft' | 'open' | 'closed'
  questions: PublicQuestion[]
}

/** What the person types before answering; kept with each answer. */
export interface Identity {
  email: string
  mobile: string
}

export type TestimonialCredit = 'anonymous' | 'first_name' | 'full_name' | 'full_name_org'

/** The testimonial part every feedback form ends with. */
export interface TestimonialEntry {
  quote: string
  credit: TestimonialCredit
  name: string
  organisation: string
  consent: boolean
}

export class SurveyError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'SurveyError'
  }
}

/**
 * Details are remembered per survey, so each survey or feedback form opens on
 * its own details step, while a reload part-way through does not lose them.
 */
const identityKey = (surveyId: string) => `snd.survey.${surveyId}`

const isIdentity = (v: unknown): v is Identity =>
  !!v &&
  typeof v === 'object' &&
  ['email', 'mobile'].every(
    (k) =>
      typeof (v as Record<string, unknown>)[k] === 'string' &&
      (v as Record<string, string>)[k].trim() !== '',
  )

/** The details typed for this survey on this phone, if both are there. */
export function savedIdentity(surveyId: string): Identity | null {
  try {
    // The sign-in used to keep a token under one shared key; it means nothing now.
    localStorage.removeItem('snd.survey')
    const raw = localStorage.getItem(identityKey(surveyId))
    const parsed: unknown = raw ? JSON.parse(raw) : null
    return isIdentity(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveIdentity(surveyId: string, identity: Identity | null) {
  try {
    if (identity) localStorage.setItem(identityKey(surveyId), JSON.stringify(identity))
    else localStorage.removeItem(identityKey(surveyId))
  } catch {
    // Private browsing: the details are typed again on the next visit.
  }
}

async function call<T>(method: 'GET' | 'POST', path: string, body?: object): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) throw new SurveyError((payload as { message?: string }).message ?? '', res.status)
  return payload as T
}

// Details travel in the body or the query string: the API's CORS rules
// allow only standard headers.
export const surveyApi = {
  get: (surveyId: string, email: string | undefined) =>
    call<PublicSurvey>(
      'GET',
      `/survey/${encodeURIComponent(surveyId)}?email=${encodeURIComponent(email ?? '')}`,
    ),
  testimonial: (surveyId: string, who: Identity, entry: TestimonialEntry) =>
    call<{ message: string }>('POST', `/survey/${encodeURIComponent(surveyId)}/testimonial`, {
      ...who,
      ...entry,
    }),
  answer: (questionId: number, who: Identity, answer: string) =>
    call<{ message: string }>('POST', `/survey/questions/${questionId}/answer`, { ...who, answer }),
}

/** The text in the reader's language, or the English when that one is empty. */
export function pick(text: Text | null | undefined, locale: string): string {
  if (!text) return ''
  const value = (text as Record<string, string | null | undefined>)[locale]
  return value && value.trim() ? value : text.en
}
