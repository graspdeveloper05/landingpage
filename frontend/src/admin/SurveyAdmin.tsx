import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import { adminApi, AdminError, reachable, type AdminSurvey } from './client'
import { AdminButton, AdminCard, Notice } from './ui'
import { useToast } from './Toast'
import { SkeletonRows } from './Loading'
import { SurveyDetail } from './SurveyDetail'
import { surveyUrl } from './SurveyShare'
import { SurveyResponses } from './SurveyResponses'
import { SurveyForm } from './FormSettings'
import { Switch, usePopover } from './QuestionCard'
import {
  DATE_PRESETS,
  NO_FILTERS,
  PAGE_SIZE,
  activeFilterCount,
  applyFilters,
  dateOf,
  dateWindow,
  pageNumbers,
  showDate,
  showWhen,
  type DatePreset,
  type ListFilters,
  type SortBy,
} from './formList'

/**
 * Every form, newest first: search, filters (active or not, survey or
 * feedback, a date range on when it was made or last answered), a sort and
 * pages of ten. Each row switches its form on or off, opens its responses,
 * or opens it to edit.
 */
export function SurveyAdmin() {
  const [list, setList] = useState<AdminSurvey[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Existing forms are edited on their own page (SurveyDetail); only a new
  // one starts from the bare settings here.
  const [adding, setAdding] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)
  const [viewing, setViewing] = useState<AdminSurvey | null>(null)
  // The form being switched on or off, so its switch cannot be pressed twice.
  const [switching, setSwitching] = useState<number | null>(null)
  // Kept while a form is open, so coming back finds the list as it was left.
  const [filters, setFilters] = useState<ListFilters>(NO_FILTERS)
  const [page, setPage] = useState(1)
  const toast = useToast()

  // A failure clears `list` to [] as well as setting the error: leaving it
  // null shows the error with the skeleton under it forever.
  const load = () => {
    setError(null)
    return adminApi
      .get<AdminSurvey[]>('/admin/surveys')
      .then(setList)
      .catch((e) => {
        setList([])
        setError(reachable(e))
      })
  }

  useEffect(() => {
    load()
  }, [])

  const shown = useMemo(() => applyFilters(list ?? [], filters), [list, filters])
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const onPage = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const narrowed = activeFilterCount(filters)

  /** Any change of filter starts again at page one. */
  const refine = (patch: Partial<ListFilters>) => {
    setFilters((f) => ({ ...f, ...patch }))
    setPage(1)
  }

  /** Active takes answers; Inactive stops them. Same call as the form's own page. */
  async function setActive(survey: AdminSurvey, active: boolean) {
    setSwitching(survey.id)
    try {
      const saved = await adminApi.put<AdminSurvey>(`/admin/surveys/${survey.id}`, {
        title: survey.title,
        description: survey.description,
        status: active ? 'open' : 'closed',
      })
      setList(
        (all) => all?.map((x) => (x.id === saved.id ? { ...x, status: saved.status } : x)) ?? all,
      )
      toast.success(
        active ? `"${survey.title.en}" is active.` : `"${survey.title.en}" is inactive.`,
      )
    } catch (e) {
      toast.error(e instanceof AdminError ? e.message : 'Could not change the form.')
    } finally {
      setSwitching(null)
    }
  }

  async function remove(survey: AdminSurvey) {
    if (!confirm(`Delete "${survey.title.en}" and all its answers? This cannot be undone.`)) return
    try {
      await adminApi.del(`/admin/surveys/${survey.id}`)
      toast.success('Form deleted.')
      load()
    } catch (e) {
      toast.error(e instanceof AdminError ? e.message : 'Could not delete that form.')
    }
  }

  async function copyLink(survey: AdminSurvey) {
    try {
      await navigator.clipboard.writeText(surveyUrl(survey))
      toast.success('Link copied.')
    } catch {
      toast.error('Could not copy. Select the link and copy it instead.')
    }
  }

  if (viewing) {
    return (
      <SurveyResponses
        survey={viewing}
        onBack={() => {
          setViewing(null)
          load()
        }}
      />
    )
  }

  if (openId !== null) {
    return (
      <SurveyDetail
        id={openId}
        onBack={() => {
          setOpenId(null)
          load()
        }}
      />
    )
  }

  if (adding) {
    return (
      <SurveyForm
        survey={null}
        onCancel={() => setAdding(false)}
        onSaved={(saved) => {
          setAdding(false)
          toast.success('Form created. Now add its questions.')
          // A new form has no questions yet, so go straight to adding them.
          setOpenId(saved.id)
        }}
      />
    )
  }

  const all = list ?? []
  const activeCount = all.filter((s) => s.status === 'open').length
  const answerCount = all.reduce((n, s) => n + (s.responses_count ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="admin-rise flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.78rem] text-slate">
            Each form has its own link and QR code. Open one to edit its questions and see its
            results.
          </p>
          {list && (
            <p className="tnum mt-1 text-[0.82rem] font-semibold text-navy-950">
              {all.length} {all.length === 1 ? 'form' : 'forms'}
              <span className="font-normal text-slate"> · </span>
              <span className="text-green-700">{activeCount} active</span>
              <span className="font-normal text-slate"> · </span>
              {answerCount} {answerCount === 1 ? 'answer' : 'answers'}
            </p>
          )}
        </div>
        <AdminButton onClick={() => setAdding(true)}>+ New form</AdminButton>
      </div>

      <Toolbar
        filters={filters}
        counts={{
          all: all.length,
          active: activeCount,
          inactive: all.length - activeCount,
        }}
        onChange={refine}
      />

      {error && (
        <div className="flex flex-wrap items-center gap-3">
          <Notice kind="error">{error}</Notice>
          <AdminButton variant="quiet" onClick={load}>
            Try again
          </AdminButton>
        </div>
      )}
      {!list && <SkeletonRows count={4} />}

      {list && list.length === 0 && !error && (
        <AdminCard>
          <p className="text-small text-slate">
            No forms yet. Add the first one with “+ New form”.
          </p>
        </AdminCard>
      )}

      {list && list.length > 0 && shown.length === 0 && (
        <div className="admin-fade rounded-sm border border-dashed border-[#CFCDC7] bg-white px-6 py-10 text-center">
          <p className="text-[0.88rem] font-semibold text-navy-950">
            No forms match these filters.
          </p>
          <p className="mt-1 text-[0.78rem] text-slate">
            Try a wider date range or another word, or clear the filters.
          </p>
          <button
            type="button"
            onClick={() => refine(NO_FILTERS)}
            className="mt-4 min-h-[34px] rounded-sm border border-[#DDDCD8] bg-white px-4 text-[0.78rem] font-semibold text-navy-900 hover:border-navy-600"
          >
            Clear filters
          </button>
        </div>
      )}

      {onPage.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[0.78rem] text-slate">
              {narrowed > 0 ? (
                <>
                  <span className="tnum font-semibold text-navy-950">{shown.length}</span> of{' '}
                  {all.length} {all.length === 1 ? 'form' : 'forms'} match.{' '}
                  <button
                    type="button"
                    onClick={() => refine({ ...NO_FILTERS, sort: filters.sort })}
                    className="font-semibold text-navy-900 underline-offset-2 hover:underline"
                  >
                    Clear filters
                  </button>
                </>
              ) : (
                <>All forms</>
              )}
            </p>
            <SortSelect
              value={filters.sort}
              onChange={(sort) => setFilters((f) => ({ ...f, sort }))}
            />
          </div>

          {/* Keyed by what is shown, so a new page or filter deals its rows in. */}
          <ul key={`${current}-${JSON.stringify(filters)}`} className="space-y-2">
            {onPage.map((s, i) => (
              <li
                key={s.id}
                // Raised while its menu is open, above the rows after it.
                className="admin-card-in relative has-[[aria-expanded=true]]:z-20"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <FormRow
                  survey={s}
                  switching={switching === s.id}
                  onActive={(on) => setActive(s, on)}
                  onResponses={() => setViewing(s)}
                  onEdit={() => setOpenId(s.id)}
                  onCopy={() => copyLink(s)}
                  onDelete={() => remove(s)}
                />
              </li>
            ))}
          </ul>

          <Pager
            page={current}
            pages={pages}
            total={shown.length}
            onPage={(n) => {
              setPage(n)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ toolbar */

function Toolbar({
  filters,
  counts,
  onChange,
}: {
  filters: ListFilters
  counts: { all: number; active: number; inactive: number }
  onChange: (patch: Partial<ListFilters>) => void
}) {
  return (
    <div className="admin-rise relative z-20 flex flex-wrap items-center gap-2 rounded-sm border border-[#E6E5E1] bg-white p-2 [animation-delay:60ms]">
      <label className="relative min-w-[13rem] flex-1">
        <span className="sr-only">Search forms</span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
        >
          <circle cx="9" cy="9" r="5.5" />
          <path d="M13.2 13.2L17 17" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Search by name or link"
          className="block min-h-[36px] w-full rounded-sm border border-[#DDDCD8] bg-[#FAFAF8] pl-9 pr-3 text-[0.82rem] text-navy-950 placeholder:text-slate/70 focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/30"
        />
      </label>

      <Segmented
        label="Status"
        value={filters.status}
        onChange={(status) => onChange({ status })}
        options={[
          { value: 'all', label: 'All', count: counts.all },
          { value: 'active', label: 'Active', count: counts.active },
          { value: 'inactive', label: 'Inactive', count: counts.inactive },
        ]}
      />

      <Segmented
        label="Form type"
        value={filters.type}
        onChange={(type) => onChange({ type })}
        options={[
          { value: 'all', label: 'All types' },
          { value: 'survey', label: 'Surveys' },
          { value: 'feedback', label: 'Feedback' },
        ]}
      />

      <DateFilter filters={filters} onChange={onChange} />
    </div>
  )
}

function SortSelect({ value, onChange }: { value: SortBy; onChange: (sort: SortBy) => void }) {
  return (
    <label className="flex items-center gap-1.5 text-[0.78rem] text-slate">
      <span>Sort</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortBy)}
        className="min-h-[32px] rounded-sm border border-[#DDDCD8] bg-white px-2 text-[0.78rem] font-semibold text-navy-900 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="answers">Most answers</option>
        <option value="name">Name A–Z</option>
      </select>
    </label>
  )
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string; count?: number }[]
  onChange: (value: T) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-sm border border-[#DDDCD8] bg-[#F4F4F2] p-0.5"
    >
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex min-h-[30px] items-center gap-1.5 rounded-[3px] px-2.5 text-[0.78rem] font-semibold transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50',
              on
                ? 'bg-white text-navy-950 shadow-[0_1px_3px_rgba(10,22,40,0.15)]'
                : 'text-slate hover:text-navy-950',
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span
                className={cn(
                  'tnum rounded-full px-1.5 text-[0.7rem]',
                  on ? 'bg-gold-500/15 text-gold-700' : 'bg-[#E8E7E3] text-slate',
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** When: made or last answered, within a preset or a range of days. */
function DateFilter({
  filters,
  onChange,
}: {
  filters: ListFilters
  onChange: (patch: Partial<ListFilters>) => void
}) {
  const { open, setOpen, ref } = usePopover()
  const on = dateWindow(filters) !== null
  const preset = DATE_PRESETS.find((p) => p.value === filters.preset)
  const summary = !on
    ? 'Any date'
    : filters.preset === 'custom'
      ? [filters.from && showInput(filters.from), filters.to && showInput(filters.to)]
          .map((x) => x || '…')
          .join(' – ')
      : preset?.label

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={cn(
          'flex min-h-[36px] items-center gap-2 rounded-sm border px-3 text-[0.8rem] font-semibold transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50',
          on
            ? 'border-gold-500 bg-gold-500/10 text-navy-950'
            : 'border-[#DDDCD8] bg-white text-navy-900 hover:border-navy-600',
        )}
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden
          className="h-4 w-4 shrink-0"
        >
          <rect x="3" y="4.5" width="14" height="12.5" rx="1.5" />
          <path d="M3 8.5h14M7 3v3M13 3v3" strokeLinecap="round" />
        </svg>
        <span className="text-slate">
          {filters.dateField === 'created' ? 'Created' : 'Answered'}:
        </span>
        {summary}
        <svg
          viewBox="0 0 12 12"
          aria-hidden
          className={cn('h-3 w-3 transition-transform', open && 'rotate-180')}
        >
          <path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Filter by date"
          className="admin-pop absolute right-0 z-30 mt-1.5 w-[17.5rem] origin-top-right rounded-sm border border-[#DDDCD8] bg-white p-3 shadow-[0_12px_32px_-12px_rgba(10,22,40,0.35)] max-sm:left-0 max-sm:right-auto max-sm:origin-top-left"
          style={{ animationDuration: '0.2s' }}
        >
          <p className="text-[0.72rem] font-semibold text-slate">Filter by</p>
          <div className="mt-1.5">
            <Segmented
              label="Date to filter by"
              value={filters.dateField}
              onChange={(dateField) => onChange({ dateField })}
              options={[
                { value: 'created', label: 'Date created' },
                { value: 'answered', label: 'Last answer' },
              ]}
            />
          </div>

          <div role="radiogroup" aria-label="When" className="mt-3 grid grid-cols-2 gap-1">
            {DATE_PRESETS.map((p) => {
              const chosen = filters.preset === p.value
              return (
                <button
                  key={p.value}
                  type="button"
                  role="radio"
                  aria-checked={chosen}
                  onClick={() => {
                    onChange({ preset: p.value as DatePreset })
                    if (p.value !== 'custom') setOpen(false)
                  }}
                  className={cn(
                    'min-h-[32px] rounded-sm px-2.5 text-left text-[0.78rem] transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50',
                    chosen
                      ? 'bg-navy-900 font-semibold text-cream'
                      : 'text-navy-900 hover:bg-[#F1F1EF]',
                  )}
                >
                  {p.label}
                </button>
              )
            })}
          </div>

          <div className={cn('admin-collapse', filters.preset === 'custom' && 'is-open')}>
            <div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#EEEDEA] pt-3">
                <label className="text-[0.72rem] font-semibold text-slate">
                  From
                  <input
                    type="date"
                    value={filters.from}
                    max={filters.to || undefined}
                    onChange={(e) => onChange({ from: e.target.value })}
                    className="mt-1 block min-h-[34px] w-full rounded-sm border border-[#DDDCD8] px-2 text-[0.78rem] text-navy-950 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
                  />
                </label>
                <label className="text-[0.72rem] font-semibold text-slate">
                  To
                  <input
                    type="date"
                    value={filters.to}
                    min={filters.from || undefined}
                    onChange={(e) => onChange({ to: e.target.value })}
                    className="mt-1 block min-h-[34px] w-full rounded-sm border border-[#DDDCD8] px-2 text-[0.78rem] text-navy-950 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
                  />
                </label>
              </div>
            </div>
          </div>

          {filters.dateField === 'answered' && on && (
            <p className="mt-3 text-[0.72rem] text-slate">
              Forms with no answers yet are left out.
            </p>
          )}

          <div className="mt-3 flex justify-between border-t border-[#EEEDEA] pt-2.5">
            <button
              type="button"
              onClick={() => onChange({ preset: 'any', from: '', to: '' })}
              className="text-[0.78rem] font-semibold text-slate hover:text-navy-950"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-[30px] rounded-sm bg-navy-900 px-3 text-[0.78rem] font-semibold text-cream hover:bg-navy-800"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** A yyyy-mm-dd from a date box as "1 Oct 2026". */
const showInput = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return showDate(new Date(y, m - 1, d))
}

/* --------------------------------------------------------------------- rows */

function FormRow({
  survey: s,
  switching,
  onActive,
  onResponses,
  onEdit,
  onCopy,
  onDelete,
}: {
  survey: AdminSurvey
  switching: boolean
  onActive: (on: boolean) => void
  onResponses: () => void
  onEdit: () => void
  onCopy: () => void
  onDelete: () => void
}) {
  const active = s.status === 'open'
  const feedback = s.form_type === 'feedback'
  const created = dateOf(s, 'created')
  const answered = dateOf(s, 'answered')
  const link = surveyUrl(s)

  return (
    <div
      className={cn(
        'group relative grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 rounded-sm border border-[#E6E5E1] py-3.5 pl-4 pr-3 xl:grid-cols-[2.5rem_minmax(0,1fr)_auto_auto] transition-[border-color,box-shadow] duration-200',
        'hover:border-[#CFCDC7] hover:shadow-[0_6px_18px_-12px_rgba(10,22,40,0.35)]',
        active ? 'bg-white' : 'bg-[#FCFCFB]',
      )}
    >
      {/* A gold edge on forms taking answers now. */}
      <span
        aria-hidden
        className={cn(
          'absolute inset-y-0 left-0 w-[3px] rounded-l-sm transition-colors duration-300',
          active ? 'bg-gold-500' : 'bg-transparent',
        )}
      />

      <span
        aria-hidden
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-sm transition-colors',
          feedback ? 'bg-[#EEF1F7] text-navy-800' : 'bg-gold-500/10 text-gold-700',
          !active && 'opacity-60',
        )}
      >
        {feedback ? (
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-5 w-5"
          >
            <path
              d="M3.5 5a1.5 1.5 0 0 1 1.5-1.5h10A1.5 1.5 0 0 1 16.5 5v7a1.5 1.5 0 0 1-1.5 1.5H9l-3.5 3v-3H5A1.5 1.5 0 0 1 3.5 12z"
              strokeLinejoin="round"
            />
            <path d="M7 7.5h6M7 10h4" strokeLinecap="round" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-5 w-5"
          >
            <rect x="4" y="3.5" width="12" height="14" rx="1.5" />
            <path d="M7.5 3.5V2.5h5v1M7 8h6M7 11h6M7 14h3.5" strokeLinecap="round" />
          </svg>
        )}
      </span>

      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="text-left text-[0.9rem] font-semibold text-navy-950 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
          >
            {s.title.en}
          </button>
          <span className="rounded-full border border-[#DDDCD8] px-2 py-px text-[0.7rem] font-semibold text-slate">
            {feedback ? 'Feedback' : 'Survey'}
          </span>
        </p>
        <p className="mt-0.5 flex min-w-0 items-center gap-1 text-[0.74rem] text-slate">
          <span className="truncate">{link.replace(/^https?:\/\//, '')}</span>
          <button
            type="button"
            onClick={onCopy}
            aria-label={`Copy the link to ${s.title.en}`}
            title="Copy link"
            className="grid h-6 w-6 shrink-0 place-items-center rounded-sm text-slate opacity-60 transition hover:bg-[#F1F1EF] hover:text-navy-950 hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 group-hover:opacity-100"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="h-3.5 w-3.5"
            >
              <rect x="6.5" y="6.5" width="10" height="10" rx="1.5" />
              <path d="M13.5 6.5V4.5a1 1 0 0 0-1-1h-8a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2" />
            </svg>
          </button>
        </p>
      </div>

      {/* Fixed columns, so the numbers line up from row to row. */}
      <dl className="tnum col-start-2 grid grid-cols-[4rem_4rem_6rem_7.5rem] gap-x-3 gap-y-2 text-[0.74rem] max-sm:grid-cols-2 xl:col-start-auto">
        <div>
          <dt className="text-slate">Questions</dt>
          <dd className="font-semibold text-navy-950">{s.questions_count ?? 0}</dd>
        </div>
        <div>
          <dt className="text-slate">Answers</dt>
          <dd className="font-semibold text-navy-950">{s.responses_count ?? 0}</dd>
        </div>
        <div>
          <dt className="text-slate">Created</dt>
          <dd className="font-semibold text-navy-950">{created ? showDate(created) : '—'}</dd>
        </div>
        <div>
          <dt className="text-slate">Last answer</dt>
          <dd
            className={cn('font-semibold', answered ? 'text-navy-950' : 'font-normal text-slate')}
          >
            {answered ? showWhen(answered) : 'None yet'}
          </dd>
        </div>
      </dl>

      <div className="col-start-2 flex items-center gap-1 xl:col-start-auto">
        {/* As wide for "Active" as for "Inactive", so the buttons stay put. */}
        <div
          className={cn(
            'mr-1 flex min-w-[7rem] justify-end',
            switching && 'pointer-events-none opacity-50',
          )}
        >
          <Switch checked={active} onChange={onActive} label={active ? 'Active' : 'Inactive'} />
        </div>
        <button
          type="button"
          onClick={onResponses}
          aria-label={`View responses to ${s.title.en}`}
          title="View responses"
          className="grid h-[34px] w-[34px] place-items-center rounded-sm border border-[#DDDCD8] bg-white text-navy-900 transition-colors hover:border-navy-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/35"
        >
          <ResponsesIcon />
        </button>
        <AdminButton onClick={onEdit}>Edit</AdminButton>
        <RowMenu survey={s} link={link} onCopy={onCopy} onDelete={onDelete} />
      </div>
    </div>
  )
}

/** The less frequent actions: open the form, copy its link, delete it. */
function RowMenu({
  survey,
  link,
  onCopy,
  onDelete,
}: {
  survey: AdminSurvey
  link: string
  onCopy: () => void
  onDelete: () => void
}) {
  const { open, setOpen, ref } = usePopover()
  const item =
    'flex w-full min-h-[34px] items-center gap-2.5 rounded-sm px-2.5 text-left text-[0.8rem] transition-colors focus:outline-none focus-visible:bg-[#F1F1EF]'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More for ${survey.title.en}`}
        onClick={() => setOpen(!open)}
        className="grid h-[34px] w-[34px] place-items-center rounded-sm text-slate transition-colors hover:bg-[#F1F1EF] hover:text-navy-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-[18px] w-[18px]">
          <circle cx="10" cy="4.5" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="10" cy="15.5" r="1.5" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="admin-pop absolute right-0 z-30 mt-1 w-48 origin-top-right rounded-sm border border-[#DDDCD8] bg-white p-1 shadow-[0_12px_32px_-12px_rgba(10,22,40,0.35)]"
          style={{ animationDuration: '0.2s' }}
        >
          <a
            role="menuitem"
            href={link}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className={cn(item, 'text-navy-900 hover:bg-[#F1F1EF]')}
          >
            Open the form ↗
          </a>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onCopy()
            }}
            className={cn(item, 'text-navy-900 hover:bg-[#F1F1EF]')}
          >
            Copy link
          </button>
          <div className="my-1 h-px bg-[#EEEDEA]" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
            className={cn(item, 'text-red-700 hover:bg-red-50')}
          >
            Delete form…
          </button>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------- pager */

function Pager({
  page,
  pages,
  total,
  onPage,
}: {
  page: number
  pages: number
  total: number
  onPage: (n: number) => void
}) {
  const from = (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)
  const step =
    'grid h-[34px] min-w-[34px] place-items-center rounded-sm px-2 text-[0.8rem] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 disabled:cursor-not-allowed disabled:opacity-35'

  return (
    <nav
      aria-label="Pages of forms"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E6E5E1] pt-3"
    >
      <p className="tnum text-[0.78rem] text-slate">
        Showing <span className="font-semibold text-navy-950">{from}</span>–
        <span className="font-semibold text-navy-950">{to}</span> of{' '}
        <span className="font-semibold text-navy-950">{total}</span>
      </p>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => onPage(page - 1)}
            className={cn(step, 'text-navy-900 hover:bg-[#F1F1EF]')}
          >
            ← Previous
          </button>
          {pageNumbers(page, pages).map((n, i) =>
            n === 'gap' ? (
              <span key={`gap-${i}`} aria-hidden className="px-1 text-slate">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                aria-current={n === page ? 'page' : undefined}
                aria-label={`Page ${n}`}
                onClick={() => onPage(n)}
                className={cn(
                  step,
                  'tnum',
                  n === page ? 'bg-navy-900 text-cream' : 'text-navy-900 hover:bg-[#F1F1EF]',
                )}
              >
                {n}
              </button>
            ),
          )}
          <button
            type="button"
            disabled={page === pages}
            onClick={() => onPage(page + 1)}
            className={cn(step, 'text-navy-900 hover:bg-[#F1F1EF]')}
          >
            Next →
          </button>
        </div>
      )}
    </nav>
  )
}

/** People with a list beside them: who answered. */
function ResponsesIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden>
      <circle cx="5" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M1.5 13c0-2.2 1.6-3.8 3.5-3.8s3.5 1.6 3.5 3.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M10.5 4.5h4M10.5 8h4M10.5 11.5h3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}
