import type { AdminSurvey } from './client'
import { surveyUrl } from './SurveyShare'

/**
 * The forms list's filters, sort and pages, kept apart from the page so the
 * rules read in one place.
 */

export type StatusFilter = 'all' | 'active' | 'inactive'
export type TypeFilter = 'all' | 'survey' | 'feedback'
export type DateField = 'created' | 'answered'
export type DatePreset = 'any' | 'today' | '7d' | '30d' | 'month' | 'custom'
export type SortBy = 'newest' | 'oldest' | 'answers' | 'name'

export interface ListFilters {
  search: string
  status: StatusFilter
  type: TypeFilter
  dateField: DateField
  preset: DatePreset
  /** For a custom range: yyyy-mm-dd, either end may be left open. */
  from: string
  to: string
  sort: SortBy
}

export const NO_FILTERS: ListFilters = {
  search: '',
  status: 'all',
  type: 'all',
  dateField: 'created',
  preset: 'any',
  from: '',
  to: '',
  sort: 'newest',
}

export const PAGE_SIZE = 10

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'month', label: 'This month' },
  { value: 'custom', label: 'Custom range' },
]

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const day = 24 * 60 * 60 * 1000

/** Midnight at the start of a yyyy-mm-dd day, in local time. */
const fromInput = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * The window a date filter covers, as [start, end): local days, the end
 * exclusive. Null ends are open. "Any time" is no window at all.
 */
export function dateWindow(
  f: Pick<ListFilters, 'preset' | 'from' | 'to'>,
  now = new Date(),
): [Date | null, Date | null] | null {
  const today = startOfDay(now)
  const tomorrow = new Date(today.getTime() + day)
  switch (f.preset) {
    case 'today':
      return [today, tomorrow]
    case '7d':
      return [new Date(today.getTime() - 6 * day), tomorrow]
    case '30d':
      return [new Date(today.getTime() - 29 * day), tomorrow]
    case 'month':
      return [new Date(today.getFullYear(), today.getMonth(), 1), tomorrow]
    case 'custom': {
      if (!f.from && !f.to) return null
      const start = f.from ? fromInput(f.from) : null
      const end = f.to ? new Date(fromInput(f.to).getTime() + day) : null
      return [start, end]
    }
    default:
      return null
  }
}

/** The date a form is filtered and shown by: made, or last answered. */
export const dateOf = (s: AdminSurvey, field: DateField): Date | null => {
  const raw = field === 'created' ? s.created_at : s.last_answer_at
  return raw ? new Date(raw) : null
}

export function applyFilters(list: AdminSurvey[], f: ListFilters, now = new Date()) {
  const words = f.search.trim().toLowerCase()
  const window = dateWindow(f, now)

  const kept = list.filter((s) => {
    if (f.status === 'active' && s.status !== 'open') return false
    if (f.status === 'inactive' && s.status === 'open') return false
    if (f.type !== 'all' && s.form_type !== f.type) return false
    if (words) {
      const hay = `${s.title.en} ${s.slug ?? ''} ${surveyUrl(s)}`.toLowerCase()
      if (!hay.includes(words)) return false
    }
    if (window) {
      // A form never answered has no "last answered" date, so a date window
      // on answers leaves it out.
      const at = dateOf(s, f.dateField)
      if (!at) return false
      const [start, end] = window
      if (start && at < start) return false
      if (end && at >= end) return false
    }
    return true
  })

  const time = (s: AdminSurvey) => (s.created_at ? Date.parse(s.created_at) : s.id)
  return [...kept].sort((a, b) => {
    switch (f.sort) {
      case 'oldest':
        return time(a) - time(b) || a.id - b.id
      case 'answers':
        return (b.responses_count ?? 0) - (a.responses_count ?? 0) || b.id - a.id
      case 'name':
        return a.title.en.localeCompare(b.title.en)
      default:
        return time(b) - time(a) || b.id - a.id
    }
  })
}

/** Filters that narrow the list (the sort order does not count). */
export function activeFilterCount(f: ListFilters): number {
  return (
    (f.search.trim() ? 1 : 0) +
    (f.status !== 'all' ? 1 : 0) +
    (f.type !== 'all' ? 1 : 0) +
    (dateWindow(f) ? 1 : 0)
  )
}

/** The page numbers to offer: all of them when few, else the ends and around here. */
export function pageNumbers(page: number, pages: number): (number | 'gap')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  const near = [1, page - 1, page, page + 1, pages].filter((n) => n >= 1 && n <= pages)
  const unique = [...new Set(near)].sort((a, b) => a - b)
  const out: (number | 'gap')[] = []
  unique.forEach((n, i) => {
    if (i > 0 && n - unique[i - 1] > 1) out.push('gap')
    out.push(n)
  })
  return out
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit' })

/** "1 Oct 2026". */
export const showDate = (d: Date) => dateFormat.format(d)

/** "Today, 2:30 pm", "Yesterday, 9:05 am" or "3 Oct 2026". */
export function showWhen(d: Date, now = new Date()): string {
  const today = startOfDay(now).getTime()
  const that = startOfDay(d).getTime()
  if (that === today) return `Today, ${timeFormat.format(d)}`
  if (that === today - day) return `Yesterday, ${timeFormat.format(d)}`
  return showDate(d)
}
