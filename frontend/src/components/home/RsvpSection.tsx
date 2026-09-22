import { useI18n } from '@/i18n'
import { Reveal } from '@/components/ui/Reveal'
import { Ornament } from '@/components/ui/Ornament'
import { ButtonLink } from '@/components/ui/Button'
import { CalendarIcon, ClockIcon, PinIcon } from '@/components/ui/Icons'
import { useParallax } from '@/lib/animation'
import { useEventLabels } from '@/lib/useContent'
import { REGISTRATION_URL } from '@/lib/registration'
import type { EventStatus } from '@/services/api'

/**
 * §9 — registration, now through the organising team's Google Form.
 *
 * The client moved registration there and had already started sending the
 * form out, so it holds the attendee list. This panel keeps the event details
 * and hands the visitor to the form, rather than running a second list beside
 * it that would disagree with the first. The seat counter is gone at the
 * client's request: the count lives in their form now, and a number here
 * would be one this site cannot know.
 *
 * The date, time and venue come from the live event record, the same source
 * as the hero. They used to come from the bundled fallback, which would have
 * left this panel on the old start time after the hero had moved on.
 */
export function RsvpSection({
  status,
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

  /*
   * Two reasons still stop registration, both decided by the server: the team
   * closing it from the panel, and the day having passed. "Full" no longer
   * applies -- this site does not see the form's responses, so it cannot know.
   */
  const closedReason =
    status?.closedReason === 'past' || status?.closedReason === 'closed' ? status.closedReason : null

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
          {closedReason ? (
            <div className="mx-auto max-w-xl border-l-2 border-gold-500 pl-6 text-cream">
              <h3 className="font-display text-h3 font-semibold">
                {t(`rsvp.${closedReason}.title`)}
              </h3>
              <p className="mt-3 text-body text-cream/70">{t(`rsvp.${closedReason}.body`)}</p>
            </div>
          ) : (
            <div className="grid items-center gap-12 lg:grid-cols-12">
              <Reveal variant="left" className="lg:col-span-5">
                <dl className="space-y-5">
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
                <div className="border border-gold-500/30 bg-navy-950/40 px-6 py-10 text-center backdrop-blur-[2px] sm:px-10">
                  <p className="mx-auto max-w-md font-display text-h3 italic leading-snug text-cream">
                    {t('rsvp.note')}
                  </p>
                  <div className="mt-8">
                    <ButtonLink href={REGISTRATION_URL} withArrow>
                      {t('rsvp.formCta')}
                    </ButtonLink>
                  </div>
                  <p className="mt-5 text-small text-cream/60">{t('rsvp.formNote')}</p>
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
