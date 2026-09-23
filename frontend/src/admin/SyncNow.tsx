import { useEffect, useRef, useState } from 'react'
import { adminApi, reachable } from './client'
import { AdminButton } from './ui'
import { useToast } from './Toast'

type State = 'idle' | 'starting' | 'running' | 'done' | 'stalled'

interface Status {
  state: State
  received?: number
  created?: number
}

/**
 * "Sync from Google Form": the script on the team's form sends every
 * response again, and this shows them arriving.
 *
 * Pressing it more than once does no harm. While a sync is under way the
 * button is disabled and the server only reports on it; and a response that
 * arrives twice updates its row rather than adding one.
 */
export function SyncNow({ onProgress }: { onProgress: () => void }) {
  const toast = useToast()
  const [status, setStatus] = useState<Status>({ state: 'idle' })
  const [asking, setAsking] = useState(false)
  const seen = useRef(-1)

  const active = status.state === 'starting' || status.state === 'running'

  // Picks up a sync already under way, e.g. started in another tab.
  useEffect(() => {
    adminApi
      .get<Status>('/admin/google-form/sync')
      .then(setStatus)
      .catch(() => {})
  }, [])

  // While it runs, look every few seconds, and refresh the list whenever
  // more have arrived, so the entries appear as they come in.
  useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => {
      adminApi
        .get<Status>('/admin/google-form/sync')
        .then((s) => {
          setStatus(s)
          if ((s.received ?? 0) !== seen.current) {
            seen.current = s.received ?? 0
            onProgress()
          }
        })
        .catch(() => {})
    }, 3000)
    return () => window.clearInterval(timer)
  }, [active, onProgress])

  useEffect(() => {
    if (status.state === 'done') onProgress()
  }, [status.state, onProgress])

  async function start() {
    setAsking(true)
    try {
      seen.current = -1
      setStatus(await adminApi.post<Status>('/admin/google-form/sync'))
    } catch (e) {
      toast.error(reachable(e))
    } finally {
      setAsking(false)
    }
  }

  const received = status.received ?? 0
  const created = status.created ?? 0
  const line = {
    idle: null,
    starting: 'Starting… Google usually begins within a minute.',
    running: `Syncing… ${received} received · ${created} new`,
    done: `Up to date · ${received} checked · ${created} new`,
    stalled:
      received > 0
        ? `Stopped after ${received} (${created} new). Press again to carry on — nothing is added twice.`
        : 'Google did not start it. Check the script’s Executions in Apps Script, then try again.',
  }[status.state]

  return (
    <div className="flex flex-wrap items-center gap-3">
      {line && (
        <span
          role="status"
          className={
            'text-[0.78rem] ' +
            (status.state === 'stalled'
              ? 'text-red-700'
              : status.state === 'done'
                ? 'text-green-700'
                : 'text-slate')
          }
        >
          {active && (
            <span
              aria-hidden
              className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-gold-500 align-middle"
            />
          )}
          {line}
        </span>
      )}
      <AdminButton variant="quiet" onClick={start} disabled={asking || active}>
        {active ? 'Syncing…' : 'Sync from Google Form'}
      </AdminButton>
    </div>
  )
}
