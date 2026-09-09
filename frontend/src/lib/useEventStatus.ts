import { useCallback, useEffect, useState } from 'react'
import { getEvent, type EventStatus } from '@/services/api'

/** Single source of the remaining-seats figure, shared by the bar, CTA and form. */
export function useEventStatus() {
  const [status, setStatus] = useState<EventStatus | null>(null)

  const refresh = useCallback(() => {
    getEvent()
      .then(setStatus)
      .catch(() => setStatus(null))
  }, [])

  useEffect(refresh, [refresh])

  return { status, refresh }
}
