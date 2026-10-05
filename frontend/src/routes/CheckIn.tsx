import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Ornament } from '@/components/ui/Ornament'
import { REGISTRATION_PATH } from '@/lib/registration'
import { checkInApi, CheckInError, type CheckInResult } from '@/services/checkin'

/** How long the tick stays up before the page is ready for the next guest. */
const RESET_AFTER_MS = 8000

/**
 * Self check-in, opened from the QR poster at the entrance. The guest types
 * the email or mobile they registered with and shows the usher the tick.
 */
export function CheckIn() {
  const { t } = useI18n()
  const [open, setOpen] = useState<boolean | null>(null)
  const [result, setResult] = useState<CheckInResult | null>(null)

  useEffect(() => {
    checkInApi
      .status()
      .then((s) => setOpen(s.open))
      .catch(() => setOpen(true))
  }, [])

  // Back to the empty form for the next person in the queue.
  useEffect(() => {
    if (!result) return
    const timer = window.setTimeout(() => setResult(null), RESET_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [result])

  return (
    <section className="pb-20 pt-28 sm:pt-32">
      <div className="shell">
        <div className="mx-auto max-w-xl rounded-sm border border-navy-900/10 bg-white px-6 py-10 text-center shadow-[0_18px_50px_-24px_rgba(11,33,64,0.35)] sm:px-12 sm:py-14">
          <h1 className="font-display text-[2rem] font-semibold leading-tight text-navy-950 sm:text-[2.6rem]">
            {t('checkin.title')}
          </h1>
          <Ornament className="mt-6" />

          <div className="mt-8">
            {open === null ? null : !open ? (
              <p className="font-display text-h3 text-navy-950">{t('checkin.closed')}</p>
            ) : result ? (
              <Done result={result} onNext={() => setResult(null)} />
            ) : (
              <Form onCheckedIn={setResult} onClosed={() => setOpen(false)} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function Form({
  onCheckedIn,
  onClosed,
}: {
  onCheckedIn: (result: CheckInResult) => void
  onClosed: () => void
}) {
  const { t } = useI18n()
  const [contact, setContact] = useState('')
  const [error, setError] = useState<'notFound' | 'error' | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!contact.trim()) return
    setBusy(true)
    setError(null)
    try {
      onCheckedIn(await checkInApi.checkIn(contact.trim()))
    } catch (err) {
      if (err instanceof CheckInError && err.status === 423) return onClosed()
      setError(err instanceof CheckInError && err.status === 422 ? 'notFound' : 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <p className="text-body text-navy-900/80">{t('checkin.intro')}</p>

      <label className="mt-8 block">
        <span className="sr-only">{t('survey.contact')}</span>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder={t('survey.contact')}
          autoComplete="email"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'checkin-error' : undefined}
          className={cn(
            'block min-h-[52px] w-full rounded-sm border bg-white px-4 text-center text-body text-navy-950 placeholder:text-slate/60',
            'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold-500/40',
            error
              ? 'border-red-400 bg-red-50'
              : 'border-navy-900/15 hover:border-gold-300 focus:border-gold-500',
          )}
        />
      </label>

      {error && (
        <div id="checkin-error" role="alert" className="mt-3 text-small text-red-700">
          {error === 'notFound' ? (
            <>
              {t('checkin.notFound')}{' '}
              <Link
                to={REGISTRATION_PATH}
                className="font-semibold text-navy-900 underline underline-offset-4"
              >
                {t('checkin.register')}
              </Link>
            </>
          ) : (
            t('survey.error')
          )}
        </div>
      )}

      <Button type="submit" disabled={busy} withArrow className="mt-6 w-full">
        {t('checkin.submit')}
      </Button>
    </form>
  )
}

/** The screen the guest turns round to show the usher. */
function Done({ result, onNext }: { result: CheckInResult; onNext: () => void }) {
  const { t } = useI18n()
  const time = new Date(result.checkedInAt).toLocaleTimeString('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div role="status">
      <span
        aria-hidden
        className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-700 text-[2.5rem] text-white"
      >
        ✓
      </span>
      <p className="mt-6 font-display text-[1.75rem] leading-tight text-navy-950">
        {result.fullName}
      </p>
      <p className="tnum mt-1 text-body text-slate">{result.reference}</p>
      <p className="mt-5 text-lead font-semibold text-green-800">
        {result.alreadyCheckedIn ? t('checkin.already', { time }) : t('checkin.done')}
      </p>
      <Button type="button" variant="outlineNavy" onClick={onNext} className="mt-8">
        {t('checkin.next')}
      </Button>
    </div>
  )
}
