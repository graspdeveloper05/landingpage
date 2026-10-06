import { useEffect, useState } from 'react'
import {
  adminApi,
  reachable,
  type AdminSurvey,
  type AdminSurveyQuestion,
  type SurveyRespondent,
  type SurveyRespondentDetail,
} from './client'
import { AdminButton, AdminCard, Notice } from './ui'
import { SkeletonRows } from './Loading'

const when = (iso: string | null) =>
  iso
    ? new Date(iso.replace(' ', 'T') + (iso.includes('T') ? '' : 'Z')).toLocaleString('en-MY', {
        timeZone: 'Asia/Kuala_Lumpur',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : ''

/** Everyone who filled a survey in; pick one to read all their answers. */
export function SurveyResponses({ survey, onBack }: { survey: AdminSurvey; onBack: () => void }) {
  const [list, setList] = useState<SurveyRespondent[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [openKey, setOpenKey] = useState<string | null>(null)
  // The questions head the columns, so each response reads across one row.
  const [questions, setQuestions] = useState<AdminSurveyQuestion[]>([])
  // Which details this form asks, as the API reads them: a form that never
  // chose asks email and phone, or nothing for feedback.
  const asked = {
    name: 'off',
    email: 'off',
    mobile: 'off',
    organisation: 'off',
    ...(survey.fields ??
      (survey.form_type === 'feedback' ? {} : { email: 'required', mobile: 'required' })),
  }
  const anonymous = asked.name === 'off' && asked.email === 'off'
  const hasOrganisation = asked.organisation !== 'off'

  const load = () => {
    setError(null)
    adminApi
      .get<SurveyRespondent[]>(`/admin/surveys/${survey.id}/respondents`)
      .then(setList)
      .catch((e) => {
        setList([])
        setError(reachable(e))
      })
  }

  useEffect(load, [survey.id])

  // While the form is taking answers (questions from the floor, say), the
  // list keeps itself current for whoever is watching it.
  useEffect(() => {
    if (survey.status !== 'open' || openKey !== null) return
    const timer = window.setInterval(() => {
      if (document.hidden) return
      adminApi
        .get<SurveyRespondent[]>(`/admin/surveys/${survey.id}/respondents`)
        .then(setList)
        .catch(() => {})
    }, 15000)
    return () => window.clearInterval(timer)
  }, [survey.id, survey.status, openKey])
  useEffect(() => {
    adminApi
      .get<AdminSurvey>(`/admin/surveys/${survey.id}`)
      .then((s) => setQuestions(s.questions ?? []))
      .catch(() => setQuestions([]))
  }, [survey.id])

  // Anonymous feedback, numbered oldest first: Anonymous response 1, 2, ...
  const labels = new Map(
    [...(list ?? [])]
      .filter((r) => !r.email)
      .reverse()
      .map((r, i) => [r.key, `Anonymous response ${i + 1}`]),
  )
  const label = (r: SurveyRespondent) => r.name || r.email || labels.get(r.key) || 'Anonymous'

  if (openKey !== null) {
    const r = list?.find((x) => x.key === openKey)
    return (
      <Respondent
        surveyId={survey.id}
        respondentKey={openKey}
        title={r ? label(r) : ''}
        onBack={() => setOpenKey(null)}
      />
    )
  }

  const q = search.trim().toLowerCase()
  const shown = (list ?? []).filter(
    (r) =>
      !q ||
      [label(r), r.email, r.mobile, ...Object.values(r.values ?? {})].some((v) =>
        v?.toLowerCase().includes(q),
      ),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <AdminButton variant="quiet" onClick={onBack}>
          ← All surveys
        </AdminButton>
        <h2 className="flex-1 text-[0.95rem] font-semibold text-navy-950">
          {survey.title.en}: responses
        </h2>
        {list && (
          <span className="text-micro text-slate">
            {list.length} {list.length === 1 ? 'response' : 'responses'}
          </span>
        )}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={anonymous ? 'Search answers' : 'Name, email, phone or answer'}
        aria-label="Search responses"
        className="block w-full max-w-sm rounded-sm border border-[#DDDCD8] bg-white px-2.5 py-1.5 text-[0.85rem] focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/35"
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
          <p className="text-small text-slate">No one has answered this survey yet.</p>
        </AdminCard>
      )}

      {shown.length > 0 && (
        <div className="overflow-x-auto rounded-sm border border-[#DDDCD8] bg-white">
          <table className="w-full min-w-[40rem] text-left text-[0.82rem]">
            <thead className="border-b border-[#DDDCD8] bg-[#FAFAF8] text-micro text-slate">
              <tr>
                <th className="px-3 py-2 font-semibold">{anonymous ? 'Response' : 'Name'}</th>
                {asked.email !== 'off' && <th className="px-3 py-2 font-semibold">Email</th>}
                {asked.mobile !== 'off' && <th className="px-3 py-2 font-semibold">Phone</th>}
                {hasOrganisation && <th className="px-3 py-2 font-semibold">Organisation</th>}
                {questions.map((qq, i) => (
                  <th
                    key={qq.id}
                    title={qq.question.en}
                    className="max-w-[14rem] px-3 py-2 align-bottom font-semibold"
                  >
                    <span className="line-clamp-2">
                      {i + 1}. {qq.question.en}
                    </span>
                  </th>
                ))}
                <th className="whitespace-nowrap px-3 py-2 font-semibold">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr
                  key={r.key}
                  onClick={() => setOpenKey(r.key)}
                  className="cursor-pointer border-b border-[#EEEDEA] last:border-0 hover:bg-[#FAFAF8]"
                >
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenKey(r.key)
                      }}
                      className="font-semibold text-navy-950 underline decoration-[#DDDCD8] underline-offset-4 hover:decoration-gold-500"
                    >
                      {label(r)}
                    </button>
                  </td>
                  {asked.email !== 'off' && (
                    <td className="px-3 py-2.5 text-navy-800">{r.email}</td>
                  )}
                  {asked.mobile !== 'off' && (
                    <td className="tnum px-3 py-2.5 text-slate">{r.mobile}</td>
                  )}
                  {hasOrganisation && (
                    <td className="px-3 py-2.5 text-navy-800">{r.organisation ?? '—'}</td>
                  )}
                  {questions.map((qq) => {
                    const v = r.values?.[qq.id]
                    return (
                      <td key={qq.id} className="max-w-[14rem] px-3 py-2.5 align-top text-navy-900">
                        {v === undefined ? (
                          <span className="text-slate">—</span>
                        ) : qq.type === 'rating' ? (
                          <span className="tnum whitespace-nowrap">
                            <span className="text-gold-600">{'★'.repeat(Number(v))}</span> {v}/5
                          </span>
                        ) : (
                          <span className="line-clamp-3" title={v}>
                            {v}
                          </span>
                        )}
                      </td>
                    )
                  })}
                  <td className="whitespace-nowrap px-3 py-2.5 align-top text-slate">
                    {when(r.last_answered_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {list && list.length > 0 && shown.length === 0 && (
        <p className="text-small text-slate">No one matches “{search}”.</p>
      )}
    </div>
  )
}

/** One person's answers to every question, in the survey's order. */
function Respondent({
  surveyId,
  respondentKey,
  title,
  onBack,
}: {
  surveyId: number
  respondentKey: string
  title: string
  onBack: () => void
}) {
  const [data, setData] = useState<SurveyRespondentDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminApi
      .get<SurveyRespondentDetail>(
        `/admin/surveys/${surveyId}/respondents/${encodeURIComponent(respondentKey)}`,
      )
      .then(setData)
      .catch((e) => setError(reachable(e)))
  }, [surveyId, respondentKey])

  return (
    <div className="space-y-4">
      <AdminButton variant="quiet" onClick={onBack}>
        ← All responses
      </AdminButton>

      {error && <Notice kind="error">{error}</Notice>}
      {!data && !error && <SkeletonRows count={4} />}

      {data && (
        <>
          <AdminCard>
            <p className="text-[0.95rem] font-semibold text-navy-950">
              {data.respondent.name || data.respondent.email || title}
            </p>
            <dl className="mt-2 grid gap-x-6 gap-y-1 text-[0.8rem] sm:grid-cols-2">
              <Item label="Email" value={data.respondent.email} />
              <Item label="Mobile" value={data.respondent.mobile} />
            </dl>
          </AdminCard>

          <ol className="space-y-2">
            {data.answers.map((a, i) => (
              <li key={a.question_id}>
                <AdminCard>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[0.85rem] font-semibold text-navy-950">
                      <span className="tnum mr-2 text-gold-700">{i + 1}</span>
                      {a.question.en}
                    </p>
                    {a.answered_at && (
                      <p className="text-micro text-slate">{when(a.answered_at)}</p>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-line text-[0.85rem]">
                    {a.answer !== null ? (
                      <span className="text-navy-900">
                        {a.type === 'rating'
                          ? `${'★'.repeat(Number(a.answer))} (${a.answer} of 5)`
                          : a.answer}
                      </span>
                    ) : a.skipped ? (
                      <span className="italic text-slate">Skipped (optional)</span>
                    ) : (
                      <span className="italic text-slate">Not answered</span>
                    )}
                  </p>
                </AdminCard>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}

function Item({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-2">
      <dt className="text-slate">{label}</dt>
      <dd className="text-navy-900">{value}</dd>
    </div>
  )
}
