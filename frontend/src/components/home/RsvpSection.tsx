import { useState } from 'react'
import { useI18n } from '@/i18n'
import { event } from '@/data'
import { Reveal } from '@/components/ui/Reveal'
import { Ornament } from '@/components/ui/Ornament'
import { CalendarIcon, ClockIcon, PinIcon } from '@/components/ui/Icons'
import { useParallax } from '@/lib/animation'
import { RsvpForm } from '@/components/rsvp/RsvpForm'
import { CapacityMeter } from '@/components/rsvp/CapacityMeter'
import { SuccessPanel } from '@/components/rsvp/SuccessPanel'
import type { RegistrationRecord } from '@/data/types'
import type { EventStatus } from '@/services/api'

/**
 * §9 — registration is an essential Phase 1 function. Presented on the navy
 * panel from the concept: event details on the left, the form on the right.
 */
export function RsvpSection({
  status,
  refresh,
  showHeading = true,
}: {
  status: EventStatus | null
  refresh: () => void
  /** False on /rsvp, where PageHero already carries the title. */
  showHeading?: boolean
}) {
  const { t } = useI18n()
  const [record, setRecord] = useState<RegistrationRecord | null>(null)
  const [full, setFull] = useState(false)
  const washRef = useParallax<HTMLImageElement>(0.07, 50)

  const isFull = full || status?.isFull === true

  return (
    <section id="rsvp" className="relative scroll-mt-24 overflow-hidden bg-navy-900 py-section">
      <img
        ref={washRef}
        src="/scenes/colonnade.jpg"
        alt=""
        width={768}
        height={469}
        loading="lazy"
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-[0.06]"
      />

      <div className="shell relative">
        {showHeading && (
          <Reveal className="text-center">
            <h2 className="text-section font-semibold uppercase tracking-[0.06em] text-cream">
              {t('rsvp.title')}
            </h2>
            <p className="mt-3 text-lead text-cream/70">{t('rsvp.sub')}</p>
            <Ornament className="mt-5" tone="light" />
          </Reveal>
        )}

        <div className={showHeading ? 'mt-12' : ''}>
          {record ? (
            <SuccessPanel
              record={record}
              onAddAnother={() => {
                setRecord(null)
                refresh()
              }}
            />
          ) : isFull ? (
            <div className="mx-auto max-w-xl border-l-2 border-gold-500 pl-6 text-cream">
              <h3 className="font-display text-h3 font-semibold">{t('rsvp.full.title')}</h3>
              <p className="mt-3 text-body text-cream/70">{t('rsvp.full.body')}</p>
            </div>
          ) : (
            <div className="grid gap-12 lg:grid-cols-12">
              <Reveal variant="left" className="lg:col-span-4">
                <dl className="space-y-5">
                  <Detail icon={<CalendarIcon className="h-full w-full" />} label={t('eventInfo.dateLabel')} value={t('hero.date')} />
                  <Detail icon={<ClockIcon className="h-full w-full" />} label={t('eventInfo.timeLabel')} value={t('hero.time')} />
                  <Detail
                    icon={<PinIcon className="h-full w-full" />}
                    label={t('eventInfo.venueLabel')}
                    value={event.venue}
                    extra={event.venueAddress}
                  />
                </dl>

                {status && (
                  <div className="mt-9 border-t border-cream/12 pt-6">
                    <CapacityMeter remaining={status.remaining} total={status.capacity} />
                  </div>
                )}

                <p className="mt-6 text-small italic leading-relaxed text-cream/70">
                  {t('rsvp.note')}
                </p>
              </Reveal>

              <Reveal variant="right" delay={140} className="lg:col-span-8">
                <RsvpForm
                  onRegistered={(r) => {
                    setRecord(r)
                    refresh()
                  }}
                  onFull={() => setFull(true)}
                />
              </Reveal>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function Detail({
  icon,
  label,
  value,
  extra,
}: {
  icon: React.ReactNode
  label: string
  value: string
  extra?: string
}) {
  // Icon in its own column, label stacked over the value in the next. Pushing
  // values to the opposite edge left the venue address wrapping ragged against
  // a right margin on a phone, and misaligned label from value at every width.
  return (
    <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-x-3.5 gap-y-1">
      <span
        aria-hidden
        className="row-span-2 mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-gold-500/45 p-2 text-gold-500"
      >
        {icon}
      </span>
      <dt className="text-micro font-medium uppercase tracking-[0.13em] text-cream/65">{label}</dt>
      <dd className="text-pretty text-body leading-snug text-cream">
        {value}
        {extra && <span className="mt-0.5 block text-small leading-snug text-cream/70">{extra}</span>}
      </dd>
    </div>
  )
}
