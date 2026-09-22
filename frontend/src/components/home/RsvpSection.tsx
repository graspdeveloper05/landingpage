import { useState } from 'react'
import { useI18n } from '@/i18n'
import { Reveal } from '@/components/ui/Reveal'
import { Ornament } from '@/components/ui/Ornament'
import { CalendarIcon, ClockIcon, PinIcon } from '@/components/ui/Icons'
import { RsvpForm } from '@/components/rsvp/RsvpForm'
import { SuccessPanel } from '@/components/rsvp/SuccessPanel'
import { useParallax } from '@/lib/animation'
import { useEventLabels } from '@/lib/useContent'
import type { RegistrationRecord } from '@/data/types'
import type { EventStatus } from '@/services/api'

/**
 * §9 -- registration, on the site's own form.
 *
 * Each registration is saved here -- the admin list, the CSV, the
 * confirmation email -- and a copy is submitted to the organising team's
 * Google Form, so their response sheet holds everyone too. The seat counter
 * stays off at the client's request; capacity is still enforced by the server.
 *
 * The date, time and venue come from the live event record, the same source
 * as the hero.
 */
export function RsvpSection({
  status,
  refresh,
  showHeading = true,
}: {
  status: EventStatus | null
  refresh?: () => void
  /** False on /rsvp, where PageHero already carries the title. */
  showHeading?: boolean
}) {
  const { t } = useI18n()
  const { event, date, time } = useEventLabels()
  const washRef = useParallax<HTMLImageElement>(0.07, 50)
  const [record, setRecord] = useState<RegistrationRecord | null>(null)
  const [full, setFull] = useState(false)

  // `full` is set when a submission comes back 409 mid-session -- the last
  // seat went while this visitor was filling the form in. The server's reason
  // covers the rest: the team closing registration, and the day having passed.
  const closedReason = full ? 'full' : (status?.closedReason ?? null)

  return (
    <section id="rsvp" className="relative scroll-mt-24 overflow-hidden bg-navy-900 py-section">
      <img
        ref={washRef}
        src="/scenes/interior.jpg"
        alt=""
        width={1672}
        height={941}
        loading="lazy"
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-[0.07]"
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
                refresh?.()
              }}
            />
          ) : closedReason ? (
            <div className="mx-auto max-w-xl border-l-2 border-gold-500 pl-6 text-cream">
              <h3 className="font-display text-h3 font-semibold">
                {t(`rsvp.${closedReason}.title`)}
              </h3>
              <p className="mt-3 text-body text-cream/70">{t(`rsvp.${closedReason}.body`)}</p>
            </div>
          ) : (
            <div className="grid items-center gap-12 lg:grid-cols-12">
              <Reveal variant="left" className="lg:col-span-5">
                <dl className="divide-y divide-cream/10 border-y border-cream/10 [&>div]:py-5">
                  <Detail icon={<CalendarIcon className="h-full w-full" />} label={t('eventInfo.dateLabel')} value={date} />
                  <Detail icon={<ClockIcon className="h-full w-full" />} label={t('eventInfo.timeLabel')} value={time} />
                  <Detail
                    icon={<PinIcon className="h-full w-full" />}
                    label={t('eventInfo.venueLabel')}
                    value={event.venue}
                    extra={event.venueAddress}
                  />
                </dl>
              </Reveal>

              <Reveal variant="right" delay={140} className="lg:col-span-7">
                <div className="border border-gold-500/30 bg-navy-950/40 px-6 py-8 backdrop-blur-[2px] sm:px-10 sm:py-10">
                  <p className="mb-7 font-display text-h3 italic leading-snug text-cream">{t('rsvp.note')}</p>
                  <RsvpForm
                    onRegistered={(r) => {
                      setRecord(r)
                      refresh?.()
                    }}
                    onFull={() => setFull(true)}
                  />
                </div>
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
    // The icon spans both rows and sits centred on the label-and-value block,
    // so it lines up with the whole entry rather than floating by the label.
    <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-4 gap-y-1">
      <span
        aria-hidden
        className="row-span-2 flex h-11 w-11 items-center justify-center self-center rounded-full border border-gold-500/45 p-2.5 text-gold-500"
      >
        {icon}
      </span>
      <dt className="self-end text-micro font-medium uppercase tracking-[0.13em] text-cream/65">{label}</dt>
      <dd className="text-pretty text-body leading-snug text-cream">
        {value}
        {extra && <span className="mt-0.5 block text-small leading-snug text-cream/70">{extra}</span>}
      </dd>
    </div>
  )
}
