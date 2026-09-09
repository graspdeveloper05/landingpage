import { useI18n } from '@/i18n'
import { ButtonLink } from '@/components/ui/Button'
import { Ornament } from '@/components/ui/Ornament'
import { CalendarIcon, ChevronDown, ClockIcon, PinIcon } from '@/components/ui/Icons'
import { RevealLines } from '@/components/ui/Reveal'
import { Picture } from '@/components/ui/Picture'
import { useParallax } from '@/lib/animation'

/**
 * §6 — the visitor must immediately grasp what this is, why it matters, when
 * and where it happens, and how to attend. Layout follows the approved concept:
 * the city and heritage scene behind, attendees on the right, headline left.
 */
export function Hero() {
  const { t } = useI18n()
  // No parallax on the scene itself: translating it would slide the image out
  // of its box and clip an edge, and the point of this hero is that the whole
  // picture is visible. The copy still drifts, which reads as depth anyway.
  const copyRef = useParallax<HTMLDivElement>(-0.04, 30)

  return (
    <section className="relative isolate flex flex-col overflow-hidden bg-cream lg:block">
      {/*
        The scene is shown whole, never cropped.

        The image sits in normal flow at its natural aspect, so IT sets the
        section height. Previously the text set the height and the image was
        absolutely positioned to fill it, which meant any picture taller than
        the copy had its bottom clipped — the mansion's garden and foreground
        simply vanished.

        On lg and up the copy is overlaid on the left, where the gradient fades
        the scene into the page. Below lg a 16:9 image is too short to hold the
        copy legibly, so the two stack: text first, then the full picture.
      */}
      <div className="relative order-1 lg:order-none">
        <Picture
          base="/hero/hero-scene"
          narrow="/hero/hero-scene-960"
          alt={t('hero.imageAlt')}
          width={1600}
          height={900}
          className="block w-full"
          imgClassName="block h-auto w-full"
        />
        {/*
          The lift is local to the copy, not a wash across the left half.

          Measured against the scene: the headline sits on bright sunset sky
          and clears 10:1 unaided, but the date, time and venue lines fall on
          dark foliage at 2.2:1 and 3.3:1 — well under the 4.5:1 small text
          needs. A flat gradient strong enough to fix those milks out the whole
          picture, which is the opposite of what the photograph is for.

          So: an ellipse centred on the copy column, fully clear by 60% across.
          The mansion, skyline, flag and people keep their full strength.
        */}
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{
            backgroundImage:
              'radial-gradient(115% 90% at 4% 62%, rgba(251,248,241,0.97) 0%, rgba(251,248,241,0.88) 22%, rgba(251,248,241,0.45) 42%, rgba(251,248,241,0) 62%)',
          }}
        />
        {/* No bottom fade. It bleached the last 112px of the scene -- the
            garden and forecourt -- to blend into a cream section that the
            picture already ends against cleanly. */}
      </div>

      <div className="shell relative order-2 pb-12 pt-8 sm:pb-14 sm:pt-10 lg:absolute lg:inset-0 lg:order-none lg:flex lg:flex-col lg:justify-center lg:py-0">
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
            // slate measured 4.26:1 over the scene — just under the 4.5:1 floor.
            className="anim-rise mt-4 text-small font-medium uppercase tracking-[0.2em] text-navy-800"
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

        <p className="anim-fade mt-8 text-right text-micro font-medium uppercase leading-relaxed tracking-[0.16em] text-navy-900 lg:absolute lg:bottom-10 lg:right-12 lg:mt-0 lg:rounded-sm lg:bg-cream/85 lg:px-4 lg:py-2 lg:backdrop-blur-[2px]" style={{ animationDelay: '0.8s' }}>
          {t('hero.merdeka')}
        </p>
      </div>

      <a
        href="#pillars"
        className="anim-float absolute bottom-5 left-1/2 z-10 hidden h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border border-navy-900/20 bg-cream/80 text-navy-800 backdrop-blur-[2px] transition-colors hover:border-gold-500 hover:text-gold-600 lg:flex"
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
