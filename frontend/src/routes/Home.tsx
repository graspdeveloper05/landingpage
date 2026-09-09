import { useI18n } from '@/i18n'
import { moderators, panelSpeakers } from '@/data'
import { Hero } from '@/components/home/Hero'
import { Pillars } from '@/components/home/Pillars'
import { AboutSection } from '@/components/home/AboutSection'
import { ThemeSection } from '@/components/home/ThemeSection'
import { ChairmanWelcome } from '@/components/home/ChairmanWelcome'
import { SpeakerGrid } from '@/components/home/SpeakerGrid'
import { ProgrammeSection } from '@/components/home/ProgrammeSection'
import { EventInfoSection } from '@/components/home/EventInfoSection'
import { RsvpSection } from '@/components/home/RsvpSection'
import { DevicesSection } from '@/components/home/DevicesSection'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ButtonLink } from '@/components/ui/Button'
import type { EventStatus } from '@/services/api'

/**
 * §6 — the homepage carries the whole story in the order the brief sets out,
 * so a visitor never has to navigate to understand or to register.
 */
export function Home({ status, refresh }: { status: EventStatus | null; refresh: () => void }) {
  const { t } = useI18n()

  return (
    <>
      <Hero />
      <Pillars />
      <AboutSection />
      <ThemeSection withQuestions={false} />
      <ChairmanWelcome />

      <section id="speakers" className="scroll-mt-24 border-t border-hair bg-cream py-section">
        <div className="shell">
          <SectionHeading title={t('speakers.title')} sub={t('speakers.sub')} />
          <div className="mt-12">
            <SpeakerGrid speakers={[...panelSpeakers, ...moderators]} />
          </div>
          <div className="mt-12 text-center">
            <ButtonLink to="/speakers" variant="outlineNavy" withArrow>
              {t('speakers.seeAll')}
            </ButtonLink>
          </div>
        </div>
      </section>

      <ProgrammeSection>
        <div className="mt-10">
          <ButtonLink to="/programme" variant="outlineNavy" withArrow>
            {t('programme.seeFull')}
          </ButtonLink>
        </div>
      </ProgrammeSection>

      <EventInfoSection />
      <RsvpSection status={status} refresh={refresh} />
      <DevicesSection />
    </>
  )
}
