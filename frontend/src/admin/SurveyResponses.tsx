import { useEffect, useState } from 'react'
import {
  adminApi,
  reachable,
  type AdminSurvey,
  type SurveyRespondent,
  type SurveyRespondentDetail,
} from './client'
import { AdminButton, AdminCard, CopyText, Notice } from './ui'
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
  const [openId, setOpenId] = useState<number | null>(null)

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

  if (openId !== null) {
    return (
      <Respondent surveyId={survey.id} registrationId={openId} onBack={() => setOpenId(null)} />
    )
  }

  const q = search.trim().toLowerCase()
  const shown = (list ?? []).filter(
    (r) => !q || [r.name, r.reference, r.email, r.mobile].some((v) => v?.toLowerCase().includes(q)),
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
            {list.length} {list.length === 1 ? 'person' : 'people'}
          </span>
        )}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Name, reference, email or phone"
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
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Reference</th>
                <th className="px-3 py-2 font-semibold">Contact</th>
                <th className="px-3 py-2 font-semibold">Answered</th>
                <th className="px-3 py-2 font-semibold">Last answer</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setOpenId(r.id)}
                  className="cursor-pointer border-b border-[#EEEDEA] last:border-0 hover:bg-[#FAFAF8]"
                >
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenId(r.id)
                      }}
                      className="font-semibold text-navy-950 underline decoration-[#DDDCD8] underline-offset-4 hover:decoration-gold-500"
                    >
                      {r.name ?? '—'}
                    </button>
                  </td>
                  <td className="tnum px-3 py-2.5 text-navy-800">
                    {r.reference && <CopyText text={r.reference} />}
                  </td>
                  <td className="px-3 py-2.5 text-slate">
                    {r.email}
                    {r.mobile && <span className="block">{r.mobile}</span>}
                  </td>
                  <td className="tnum px-3 py-2.5">{r.answers}</td>
                  <td className="px-3 py-2.5 text-slate">{when(r.last_answered_at)}</td>
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
  registrationId,
  onBack,
}: {
  surveyId: number
  registrationId: number
  onBack: () => void
}) {
  const [data, setData] = useState<SurveyRespondentDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminApi
      .get<SurveyRespondentDetail>(`/admin/surveys/${surveyId}/respondents/${registrationId}`)
      .then(setData)
      .catch((e) => setError(reachable(e)))
  }, [surveyId, registrationId])

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
            <p className="text-[0.95rem] font-semibold text-navy-950">{data.respondent.name}</p>
            <dl className="mt-2 grid gap-x-6 gap-y-1 text-[0.8rem] sm:grid-cols-2">
              <Item label="Reference" value={data.respondent.reference} />
              <Item label="Email" value={data.respondent.email} />
              <Item label="Mobile" value={data.respondent.mobile} />
              <Item label="Organisation" value={data.respondent.organisation} />
              <Item label="Designation" value={data.respondent.designation} />
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
