import { API_BASE } from '@/services/api'

export interface CheckInResult {
  fullName: string
  reference: string
  alreadyCheckedIn: boolean
  checkedInAt: string
}

export class CheckInError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'CheckInError'
  }
}

async function call<T>(method: 'GET' | 'POST', body?: object): Promise<T> {
  const res = await fetch(`${API_BASE}/api/checkin`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) throw new CheckInError((payload as { message?: string }).message ?? '', res.status)
  return payload as T
}

export const checkInApi = {
  status: () => call<{ open: boolean }>('GET'),
  checkIn: (contact: string) => call<CheckInResult>('POST', { contact }),
}
