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
        src="/scenes/colonnade.svg"
        alt=""
        width={1600}
        height={900}
        loading="lazy"
        className="absolute inset-0 -z-10 h-full w-full scale-110 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-cream/88" />

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
            <figure className="sticky top-28 border-l-2 border-gold-500 pl-6">
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
