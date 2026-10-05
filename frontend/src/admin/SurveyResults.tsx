import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { adminApi, reachable, type SurveyResult, type SurveyStatus } from './client'
import { AdminCard, Notice } from './ui'

export function StatusChip({ status }: { status: SurveyStatus }) {
  const styles = {
    draft: 'border-[#DDDCD8] bg-[#F1F1EF] text-slate',
    open: 'border-green-300 bg-green-50 text-green-800',
    closed: 'border-navy-200 bg-white text-navy-800',
  }[status]
  const label = { draft: 'Draft', open: 'Open', closed: 'Closed' }[status]
  return (
    <span className={cn('rounded-full border px-2 py-0.5 text-micro font-semibold', styles)}>
      {label}
    </span>
  )
}

/** Live counts while the survey is open; refreshed every five seconds. */
export function SurveyResults({ surveyId, live }: { surveyId: number; live: boolean }) {
  const [results, setResults] = useState<SurveyResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stopped = false
    const load = () =>
      adminApi
        .get<{ questions: SurveyResult[] }>(`/admin/surveys/${surveyId}/results`)
        .then((r) => {
          if (stopped) return
          setResults(r.questions)
          setError(null)
        })
        .catch((e) => {
          if (!stopped) setError(reachable(e))
        })

    load()
    const timer = live ? window.setInterval(load, 5000) : undefined
    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [surveyId, live])

  if (error) return <Notice kind="error">{error}</Notice>
  if (!results) return null
  if (results.length === 0) return <p className="text-small text-slate">No questions yet.</p>

  return (
    <div className="space-y-3">
      {results.map((r, i) => (
        <AdminCard key={r.id}>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[0.85rem] font-semibold text-navy-950">
              {i + 1}. {r.question.en}
            </p>
            <p className="text-micro text-slate">
              {r.total} {r.total === 1 ? 'answer' : 'answers'}
            </p>
          </div>

          {r.options && <Bars rows={r.options} total={r.total} />}

          {r.ratings && (
            <>
              <Bars
                rows={(['5', '4', '3', '2', '1'] as const).map((n) => ({
                  label: `${n} ★`,
                  count: r.ratings![n],
                }))}
                total={r.total}
              />
              <p className="mt-2 text-micro text-slate">Average: {r.average ?? '—'}</p>
            </>
          )}

          {r.answers && (
            <ul className="max-h-64 space-y-1.5 overflow-y-auto">
              {r.answers.length === 0 && <li className="text-small text-slate">No answers yet.</li>}
              {r.answers.map((a, j) => (
                <li
                  key={j}
                  className="rounded-sm bg-[#FAFAF8] px-2.5 py-1.5 text-small text-navy-900"
                >
                  {a.answer}
                  <span className="block text-micro text-slate">
                    {a.name} · {a.email}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      ))}
    </div>
  )
}

function Bars({ rows, total }: { rows: { label: string; count: number }[]; total: number }) {
  return (
    <div className="space-y-1.5">
      {rows.map((row, i) => {
        const pct = total ? Math.round((row.count / total) * 100) : 0
        return (
          <div
            key={i}
            className="grid grid-cols-[minmax(5rem,10rem)_1fr_3.5rem] items-center gap-2"
          >
            <span className="truncate text-small text-navy-900">{row.label}</span>
            <span className="h-2.5 overflow-hidden rounded-full bg-[#EEEDEA]">
              <span
                className="block h-full bg-gold-500 transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </span>
            <span className="tnum text-right text-micro text-slate">
              {row.count} · {pct}%
            </span>
          </div>
        )
      })}
    </div>
  )
}
