import { API_BASE } from '@/services/api'

/** Only English is required; other languages may be empty. */
export type Text = { en: string } & Partial<Record<'ms' | 'zh' | 'ta', string | null>>

export interface PublicQuestion {
  id: number
  type: 'choice' | 'rating' | 'text'
  question: Text
  options: Text[] | null
  /** Optional questions can be left blank; the skip is still sent. */
  is_required: boolean
  answered: boolean
}

export interface PublicSurvey {
  id: number
  title: Text
  description: Text | null
  status: 'draft' | 'open' | 'closed'
  questions: PublicQuestion[]
}

export interface Identity {
  token: string
  firstName: string
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

/** Who answered on this phone before, so they identify once, not per survey. */
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
    // Private browsing: the person identifies again on their next visit.
  }
}

async function call<T>(method: 'GET' | 'POST', path: string, body?: object): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) throw new SurveyError((payload as { message?: string }).message ?? '', res.status)
  return payload as T
}

// The token travels in the body or the query string: the API's CORS rules
// allow only standard headers.
export const surveyApi = {
  identify: (contact: string) => call<Identity>('POST', '/survey/identify', { contact }),
  get: (surveyId: string, token: string | undefined) =>
    call<PublicSurvey>('GET', `/survey/${encodeURIComponent(surveyId)}?token=${encodeURIComponent(token ?? '')}`),
  answer: (questionId: number, token: string, answer: string) =>
    call<{ message: string }>('POST', `/survey/questions/${questionId}/answer`, { token, answer }),
}

/** The text in the reader's language, or the English when that one is empty. */
export function pick(text: Text | null | undefined, locale: string): string {
  if (!text) return ''
  const value = (text as Record<string, string | null | undefined>)[locale]
  return value && value.trim() ? value : text.en
}
