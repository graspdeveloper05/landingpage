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
  name: string
  email: string
  mobile: string
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

const IDENTITY_KEY = 'snd.survey'

/** The details typed on this phone, so they are entered once per visit. */
export function savedIdentity(): Identity | null {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY)
    return raw ? (JSON.parse(raw) as Identity) : null
  } catch {
    return null
  }
}

export function saveIdentity(identity: Identity | null) {
  try {
    if (identity) localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity))
    else localStorage.removeItem(IDENTITY_KEY)
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
  answer: (questionId: number, who: Identity, answer: string) =>
    call<{ message: string }>('POST', `/survey/questions/${questionId}/answer`, { ...who, answer }),
}

/** The text in the reader's language, or the English when that one is empty. */
export function pick(text: Text | null | undefined, locale: string): string {
  if (!text) return ''
  const value = (text as Record<string, string | null | undefined>)[locale]
  return value && value.trim() ? value : text.en
}
