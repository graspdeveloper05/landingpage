import { API_BASE, API_CONFIGURED } from '@/services/api'

/**
 * The admin panel's transport.
 *
 * Authentication is a session cookie, not a token, so nothing here stores a
 * credential: the browser holds an HttpOnly cookie the JavaScript cannot read,
 * which is the point (see bootstrap/app.php). Every call therefore has to send
 * credentials and, for anything that writes, Laravel's CSRF token.
 */

export class AdminError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** Per-field messages from a 422, keyed as the form keys them. */
    readonly fields: Record<string, string> = {},
  ) {
    super(message)
    this.name = 'AdminError'
  }
}

/** Thrown when the session has gone. The panel shows the login screen again. */
export class NotSignedIn extends AdminError {
  constructor() {
    super('Your session has ended. Sign in again.', 401)
    this.name = 'NotSignedIn'
  }
}

function readCookie(name: string) {
  const match = document.cookie.match(new RegExp(`(^|; )${name}=([^;]*)`))
  // Laravel URL-encodes the cookie value; sent back raw it fails to match.
  return match ? decodeURIComponent(match[2]) : null
}

let csrfReady: Promise<void> | null = null

/**
 * Asks Laravel to set the XSRF-TOKEN cookie, once per page load.
 *
 * The promise is cached rather than the boolean: two forms submitting at the
 * same moment would otherwise both see "not ready" and fire two requests, and
 * the second response can rotate the token out from under the first.
 */
function ensureCsrf() {
  csrfReady ??= fetch(`${API_BASE}/sanctum/csrf-cookie`, {
    credentials: 'include',
  }).then(() => undefined)
  return csrfReady
}

type Body = Record<string, unknown> | FormData | undefined

async function request<T>(method: string, path: string, body?: Body): Promise<T> {
  if (!API_CONFIGURED) {
    throw new AdminError(
      'This build has no API configured, so there is nothing to sign in to.',
      0,
    )
  }

  const writing = method !== 'GET'
  if (writing) await ensureCsrf()

  const isForm = body instanceof FormData
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (writing) {
    const token = readCookie('XSRF-TOKEN')
    if (token) headers['X-XSRF-TOKEN'] = token
  }
  // Never set Content-Type on FormData: the browser has to add the multipart
  // boundary itself, and overriding it makes the upload unparseable.
  if (body && !isForm) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    credentials: 'include',
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) throw new NotSignedIn()

  if (res.status === 419) {
    // The CSRF token expired, which happens on a panel left open. Get a fresh
    // one and say so plainly rather than reporting a mysterious failure.
    csrfReady = null
    await ensureCsrf()
    throw new AdminError('That took too long and the page went stale. Try again.', 419)
  }

  if (res.status === 204) return undefined as T

  const payload = await res.json().catch(() => ({}) as Record<string, unknown>)

  if (!res.ok) {
    const errors = (payload as { errors?: Record<string, string[]> }).errors ?? {}
    throw new AdminError(
      (payload as { message?: string }).message ?? 'Something went wrong.',
      res.status,
      Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v[0]])),
    )
  }

  return payload as T
}

/**
 * A message worth showing for a failed request.
 *
 * A dead server rejects fetch with the browser's own "Failed to fetch", which
 * tells an organiser nothing and looks like the panel is broken rather than
 * unreachable. Anything the API itself said is already written for a person,
 * so that is passed through untouched.
 */
export function reachable(error: unknown): string {
  if (error instanceof AdminError && error.status > 0) return error.message
  return 'Could not reach the server. Check your connection, then try again.'
}

export const adminApi = {
  get: <T,>(path: string) => request<T>('GET', path),
  post: <T,>(path: string, body?: Body) => request<T>('POST', path, body),
  put: <T,>(path: string, body?: Body) => request<T>('PUT', path, body),
  del: <T,>(path: string) => request<T>('DELETE', path),
}

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type Locale = 'en' | 'ms' | 'zh' | 'ta'
export type Localized = Record<Locale, string>

/** The four languages of §3, in the order the panel shows them as tabs. */
export const LOCALE_TABS: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ms', label: 'Bahasa Malaysia' },
  { code: 'zh', label: '中文' },
  { code: 'ta', label: 'தமிழ்' },
]

export const EMPTY_LOCALIZED: Localized = { en: '', ms: '', zh: '', ta: '' }

export interface AdminSpeaker {
  id: string
  name: string
  designation: Localized
  organisation: string
  portrait: string
  bio: Localized
  link: { label: string; url: string } | null
  role: 'speaker' | 'moderator'
  placeholder: boolean
  sort_order: number
}

export interface AdminProgrammeItem {
  id: string
  time: string
  title: Localized
  detail: Localized | null
  placeholder: boolean
  sort_order: number
}

export interface AdminUser {
  name: string
  email: string
}
