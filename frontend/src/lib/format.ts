import type { Locale } from '@/data/types'

const INTL_TAG: Record<Locale, string> = {
  en: 'en-MY',
  ms: 'ms-MY',
  zh: 'zh-Hans-MY',
  ta: 'ta-MY',
}

/** "8 October 2026" in the visitor's language. */
export function formatDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(INTL_TAG[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${iso}T00:00:00`))
}

/** "HH:MM" (24h data) rendered as the locale's clock. */
export function formatTime(hhmm: string, locale: Locale) {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return new Intl.DateTimeFormat(INTL_TAG[locale], {
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
}
