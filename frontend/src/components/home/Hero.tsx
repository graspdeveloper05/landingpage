import { useI18n } from '@/i18n'
import { ButtonLink } from '@/components/ui/Button'
import { Ornament } from '@/components/ui/Ornament'
import { CalendarIcon, ChevronDown, ClockIcon, PinIcon } from '@/components/ui/Icons'
import { RevealLines } from '@/components/ui/Reveal'
import { SmartImage } from '@/components/ui/SmartImage'
import { useParallax } from '@/lib/animation'

/**
 * §6 — the visitor must immediately grasp what this is, why it matters, when
 * and where it happens, and how to attend. Layout follows the approved concept:
 * the city and heritage scene behind, attendees on the right, headline left.
 */
export function Hero() {
  const { t } = useI18n()
  const sceneRef = useParallax(0.16, 80)
  // The copy drifts a little slower than the scene behind it.
  const copyRef = useParallax(-0.05, 40)

  return (
    <section className="relative isolate overflow-hidden bg-cream">
      {/* Scene */}
      <div className="absolute inset-0 -z-10">
        <div ref={sceneRef} className="absolute inset-0 will-change-transform">
          <SmartImage
            src="/hero/hero-scene.svg"
            alt={t('hero.imageAlt')}
            width={1600}
            height={900}
            className="anim-pan h-full w-full object-cover object-bottom"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/85 to-cream/25" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-cream" />
      </div>

      <div className="shell relative pb-24 pt-16 sm:pb-28 lg:pb-32 lg:pt-24">
        <div ref={copyRef} className="max-w-2xl">
          <RevealLines
            as="h1"
            className="font-display text-hero font-bold uppercase"
            lines={[
              { text: t('hero.line1'), className: 'block text-navy-900' },
              { text: t('hero.line2'), className: 'block text-gold-600' },
            ]}
          />

          <p
            className="anim-rise mt-6 font-display text-h3 font-semibold uppercase tracking-[0.11em] text-navy-800"
            style={{ animationDelay: '0.26s' }}
          >
            {t('hero.eventName')}
          </p>

          <Ornament className="anim-rise mt-4 !justify-start" />

          <p
            className="anim-rise mt-4 text-small font-medium uppercase tracking-[0.2em] text-slate"
            style={{ animationDelay: '0.36s' }}
          >
            {t('hero.subtitle')}
          </p>

          <dl className="anim-rise mt-9 space-y-3.5" style={{ animationDelay: '0.46s' }}>
            <Detail icon={<CalendarIcon className="h-full w-full" />} label={t('eventInfo.dateLabel')} value={t('hero.date')} />
            <Detail icon={<ClockIcon className="h-full w-full" />} label={t('eventInfo.timeLabel')} value={t('hero.time')} />
            <Detail icon={<PinIcon className="h-full w-full" />} label={t('eventInfo.venueLabel')} value={t('hero.venue')} />
          </dl>

          <div className="anim-rise mt-10" style={{ animationDelay: '0.58s' }}>
            <ButtonLink to="/rsvp" withArrow>
              {t('hero.cta')}
            </ButtonLink>
          </div>
        </div>

        <p className="anim-fade mt-14 text-right text-micro font-medium uppercase leading-relaxed tracking-[0.16em] text-navy-800/70 lg:absolute lg:bottom-28 lg:right-12 lg:mt-0" style={{ animationDelay: '0.8s' }}>
          {t('hero.merdeka')}
        </p>
      </div>

      <a
        href="#pillars"
        className="anim-float absolute bottom-5 left-1/2 z-10 hidden h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border border-navy-900/20 text-navy-800 transition-colors hover:border-gold-500 hover:text-gold-600 sm:flex"
      >
        <span className="sr-only">{t('hero.scroll')}</span>
        <ChevronDown className="h-5 w-5" />
      </a>
    </section>
  )
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  // A <dl> may contain only dt/dd pairs, optionally wrapped in a div, so the
  // icon lives inside the <dt> rather than as a sibling span.
  return (
    <div className="flex items-center gap-3.5">
      <dt className="flex items-center">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold-500/50 p-1.5 text-gold-600">
          {icon}
        </span>
        <span className="sr-only">{label}</span>
      </dt>
      <dd className="text-small font-medium uppercase tracking-[0.13em] text-navy-900">{value}</dd>
    </div>
  )
}
