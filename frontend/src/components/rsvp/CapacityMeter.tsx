import { useI18n } from '@/i18n'
import { CountUp } from '@/components/ui/CountUp'

/** §9 — capacity control, stated plainly rather than as urgency. */
export function CapacityMeter({ remaining, total }: { remaining: number; total: number }) {
  const { t } = useI18n()
  const taken = total - remaining
  const pct = Math.min(100, Math.round((taken / total) * 100))

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-micro font-medium uppercase tracking-[0.12em] text-cream/60">
          {t('rsvp.capacityLabel')}
        </p>
        <p className="tnum text-small font-semibold text-gold-500">
          <CountUp to={remaining} /> / {total}
        </p>
      </div>
      <div
        role="progressbar"
        aria-valuenow={taken}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={t('rsvp.capacityLabel')}
        className="mt-2 h-1 w-full overflow-hidden rounded-full bg-cream/15"
      >
        <div
          className="h-full rounded-full bg-gold-500 transition-[width] duration-700 ease-gentle"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
