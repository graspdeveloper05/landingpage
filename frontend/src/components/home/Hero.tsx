import { useI18n } from '@/i18n'
import { ButtonLink } from '@/components/ui/Button'
import { Ornament } from '@/components/ui/Ornament'
import { CalendarIcon, ChevronDown, ClockIcon, PinIcon } from '@/components/ui/Icons'
import { MaskedLine } from '@/components/ui/Reveal'
import { TypedLine } from '@/components/ui/TypedLine'
import { Picture } from '@/components/ui/Picture'
import { useParallax } from '@/lib/animation'
import { useEventLabels } from '@/lib/useContent'
import { REGISTRATION_PATH } from '@/lib/registration'

/**
 * §6 — the visitor must immediately grasp what this is, why it matters, when
 * and where it happens, and how to attend. Layout follows the approved concept:
 * the city and heritage scene behind, attendees on the right, headline left.
 */
export function Hero() {
  const { t } = useI18n()
  const { event, date, time, eventName, subtitle } = useEventLabels()
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
        {/*
          An uploaded hero replaces the shipped one wholesale. The upload
          writes the same four files the build ships -- .webp and .jpg at two
          widths -- so Picture cannot tell the difference and neither can the
          browser's source selection.
        */}
        <Picture
          base={event.heroImage || '/hero/hero-scene'}
          narrow={event.heroImage ? `${event.heroImage}-960` : '/hero/hero-scene-960'}
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

          So: an ellipse held to the copy column, fully clear by 54% across. It
          was 97% white and reached 62% across, which milked out the tree and
          the lawn the client's photograph opens with; it is now lighter and
          tighter, and the museum, visitors and sky keep their full strength.
        */}
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{
            backgroundImage:
              'radial-gradient(95% 100% at 0% 50%, rgba(252,252,251,0.86) 0%, rgba(252,252,251,0.74) 24%, rgba(252,252,251,0.36) 40%, rgba(252,252,251,0) 54%)',
          }}
        />
        {/* No bottom fade. It bleached the last 112px of the scene -- the
            garden and forecourt -- to blend into a cream section that the
            picture already ends against cleanly. */}
      </div>

      <div className="shell relative order-2 pb-12 pt-8 sm:pb-14 sm:pt-10 lg:absolute lg:inset-0 lg:order-none lg:flex lg:flex-col lg:justify-center lg:py-0">
        <div ref={copyRef} className="max-w-2xl">
          {/*
            A soft cream halo around the headline letters. The client's photograph
            puts a tree canopy directly behind the headline -- dark leaves with
            bright sky between them -- and no single veil strength suits both:
            the navy line fell to 1.5:1 over the darkest leaves, and the gold
            matched the sunlit ones almost exactly. The halo lightens only the
            few pixels around each stroke, so the photograph is left unveiled.
          */}
          {/* Labelled with both lines in full, so a screen reader announces
              the finished headline even while the second is still typing. */}
          <h1
            aria-label={`${t('hero.line1')} ${t('hero.line2')}`}
            className="font-display text-hero font-bold uppercase [text-shadow:0_0_34px_rgba(252,252,251,1),0_0_16px_rgba(252,252,251,1),0_0_6px_rgba(252,252,251,1),0_0_2px_rgba(252,252,251,1)]"
          >
            <MaskedLine delay={0}>
              <span className="block text-navy-900">{t('hero.line1')}</span>
            </MaskedLine>
            {/* The answer, typed out once the question above has risen into
                place. A deeper gold than gold-600, which measures only 3.3:1
                even on solid cream -- too little headroom over a photograph;
                with the halo it clears 3:1. */}
            <TypedLine text={t('hero.line2')} className="block text-[#8A6912]" startDelay={750} speed={85} />
          </h1>

          <p
            className="anim-rise mt-6 font-display text-h3 font-semibold uppercase tracking-[0.11em] text-navy-800"
            style={{ animationDelay: '0.26s' }}
          >
            {eventName}
          </p>

          <Ornament className="anim-rise mt-4 !justify-start" />

          <p
            // slate measured 4.26:1 over the scene — just under the 4.5:1 floor.
            className="anim-rise mt-4 text-small font-medium uppercase tracking-[0.2em] text-navy-800"
            style={{ animationDelay: '0.36s' }}
          >
            {subtitle}
          </p>

          <dl className="anim-rise mt-9 space-y-3.5" style={{ animationDelay: '0.46s' }}>
            <Detail icon={<CalendarIcon className="h-full w-full" />} label={t('eventInfo.dateLabel')} value={date} />
            <Detail icon={<ClockIcon className="h-full w-full" />} label={t('eventInfo.timeLabel')} value={time} />
            <Detail icon={<PinIcon className="h-full w-full" />} label={t('eventInfo.venueLabel')} value={event.venue} />
          </dl>

          <div className="anim-rise mt-10" style={{ animationDelay: '0.58s' }}>
            <ButtonLink to={REGISTRATION_PATH} withArrow>
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
