import { useI18n } from '@/i18n'
import { Button } from '@/components/ui/Button'
import { Ornament } from '@/components/ui/Ornament'
import type { RegistrationRecord } from '@/data/types'

/**
 * §9 — automated confirmation. Until the Laravel mailer exists the reference
 * shown here is the confirmation, and it is what the door will ask for.
 */
export function SuccessPanel({
  record,
  onAddAnother,
}: {
  record: RegistrationRecord
  onAddAnother: () => void
}) {
  const { t } = useI18n()

  return (
    <div role="status" className="anim-rise mx-auto max-w-xl text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-500 text-gold-500">
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden fill="none">
          <path d="M4 12.5l5.2 5.2L20 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>

      <h2 className="mt-6 font-display text-section font-semibold text-cream">
        {t('rsvp.success.title')}
      </h2>
      <Ornament className="mt-4" tone="light" />
      <p className="mx-auto mt-5 max-w-measure text-body text-cream/70">{t('rsvp.success.body')}</p>

      <div className="mt-8 rounded-sm border border-gold-500/35 bg-navy-950/40 py-7">
        <p className="text-micro font-medium uppercase tracking-[0.16em] text-cream/70">
          {t('rsvp.success.referenceLabel')}
        </p>
        <p className="tnum mt-2 font-display text-[2rem] font-semibold leading-none text-gold-500">
          {record.reference}
        </p>
      </div>

      <Button variant="outlineGold" onClick={onAddAnother} className="mt-8">
        {t('rsvp.success.addAnother')}
      </Button>
    </div>
  )
}
