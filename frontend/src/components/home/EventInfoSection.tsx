import { useI18n } from '@/i18n'
import { useEventLabels } from '@/lib/useContent'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { CalendarIcon, ClockIcon, ExternalIcon, PinIcon } from '@/components/ui/Icons'

/** §6 item 06 — date, time, venue and directions. */
export function EventInfoSection() {
  const { t } = useI18n()
  const { event, date, time } = useEventLabels()

  return (
    <section
      id="event-information"
      className="relative scroll-mt-24 overflow-hidden border-t border-hair bg-cream-deep py-section"
    >
      {/*
        No photograph here on purpose — a map is already a picture, and a
        second image behind it competes. The ground is instead a very faint
        gold hatch, the same 45-degree rhythm as the ornament, so the band
        reads as a considered surface rather than blank cream.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(201,162,39,0.07) 0px, rgba(201,162,39,0.07) 1px, transparent 1px, transparent 11px)',
        }}
      />
      <div className="shell relative">
        <SectionHeading title={t('eventInfo.title')} />

        {/* items-stretch so the details panel matches the map's height
            instead of leaving a column of empty cream beneath it. */}
        <div className="mt-10 grid items-stretch gap-8 lg:grid-cols-12">
          <Reveal variant="left" className="lg:col-span-5">
            <div className="flex h-full flex-col justify-center rounded-sm border border-hair bg-cream/70 p-7 shadow-card sm:p-8">
              <dl className="space-y-5">
                <Row
                  icon={<CalendarIcon className="h-full w-full" />}
                  label={t('eventInfo.dateLabel')}
                >
                  <time dateTime={event.date}>{date}</time>
                </Row>
                <Row
                  icon={<ClockIcon className="h-full w-full" />}
                  label={t('eventInfo.timeLabel')}
                >
                  {time}
                </Row>
                <Row icon={<PinIcon className="h-full w-full" />} label={t('eventInfo.venueLabel')}>
                  {event.venue}
                  <span className="mt-0.5 block text-small leading-snug text-slate">
                    {event.venueAddress}
                  </span>
                </Row>
              </dl>

              <a
                href={event.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-7 inline-flex min-h-[44px] items-center gap-2 text-small font-semibold uppercase tracking-[0.11em] text-gold-700 transition-colors hover:text-navy-900"
              >
                {t('eventInfo.directions')}
                <ExternalIcon className="h-2.5 w-2.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                <span className="sr-only">({t('common.newTab')})</span>
              </a>
            </div>
          </Reveal>

          <Reveal variant="right" delay={140} className="lg:col-span-7">
            <iframe
              title={t('eventInfo.mapTitle')}
              src={event.mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full min-h-[340px] w-full rounded-sm border border-hair shadow-card grayscale-[0.55] lg:min-h-[400px]"
            />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  // Icon in its own column, label stacked over the value in the next, so the
  // venue address wraps against the column edge instead of ragging away from a
  // right margin. The icon is decorative and sits outside the dt/dd pair.
  return (
    <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-4 gap-y-1">
      <span
        aria-hidden
        className="row-span-2 mt-0.5 flex h-10 w-10 items-center justify-center rounded-full border border-gold-500/45 p-2.5 text-gold-600"
      >
        {icon}
      </span>
      <dt className="text-micro font-medium uppercase tracking-[0.13em] text-slate">{label}</dt>
      <dd className="text-pretty text-body leading-snug text-navy-900">{children}</dd>
    </div>
  )
}
