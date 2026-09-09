import { useI18n } from '@/i18n'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Reveal } from '@/components/ui/Reveal'
import { QuoteMark } from '@/components/ui/Icons'
import { useParallax } from '@/lib/animation'
import { ProgrammeTimeline } from './ProgrammeTimeline'

/** §8 — the programme over the colonnade backdrop from the concept. */
export function ProgrammeSection({
  children,
  showHeading = true,
}: {
  children?: React.ReactNode
  /** False on /programme, where PageHero already carries the title. */
  showHeading?: boolean
}) {
  const { t } = useI18n()
  const backdropRef = useParallax<HTMLImageElement>(0.09, 60)

  return (
    <section id="programme" className="relative scroll-mt-24 overflow-hidden border-t border-hair py-section">
      <img
        ref={backdropRef}
        src="/scenes/colonnade.jpg"
        alt=""
        width={768}
        height={469}
        loading="lazy"
        className="absolute inset-0 -z-10 h-full w-full scale-110 object-cover"
      />
      {/*
        The photograph is left at full strength on the right, where the pull
        quote sits on bright marble. Over the timeline column it is veiled,
        because measuring the text against the bare image put the gold times at
        3.1:1 and the italic session details at 2.4:1 — both well under 4.5:1.
        The gradient clears completely by 78%, so the colonnade still reads.
      */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(252,252,251,0.94) 0%, rgba(252,252,251,0.90) 38%, rgba(252,252,251,0.55) 62%, rgba(252,252,251,0) 78%)',
        }}
      />

      <div className="shell">
        {showHeading && (
          <SectionHeading title={t('programme.title')} sub={t('programme.sub')} />
        )}

        <div className={`grid gap-12 lg:grid-cols-12 ${showHeading ? 'mt-12' : ''}`}>
          <div className="lg:col-span-8">
            <ProgrammeTimeline />
            {children}
          </div>

          <Reveal variant="right" delay={180} className="lg:col-span-4">
            {/* The quote lands at ~81% across, past where the scrim clears, and
              the colonnade has a deep navy wall exactly there — navy text on
              it measured 2.8:1. Its own light panel makes it independent of
              whatever the photograph happens to be doing behind it. */}
            <figure className="sticky top-28 rounded-sm bg-cream/85 p-6 shadow-card backdrop-blur-[2px] border-l-2 border-gold-500">
              <QuoteMark className="h-6 w-8 text-gold-500/70" />
              <blockquote className="mt-4 font-display text-h3 italic leading-relaxed text-navy-800">
                {t('programme.quote')}
              </blockquote>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
