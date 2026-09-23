import { useI18n } from '@/i18n'
import { PageHero } from '@/components/layout/PageHero'
import { ProgrammeSection } from '@/components/home/ProgrammeSection'
import { EventInfoSection } from '@/components/home/EventInfoSection'
import { RegisterLink } from '@/components/ui/RegisterLink'

export function Programme() {
  const { t } = useI18n()

  return (
    <>
      {/* The client's second programme photograph: the carved timber screens
          and high windows of the museum's interior. The staircase, the first,
          sits behind the timeline below. Held to the upper part of the frame,
          where the screens and the timber ceiling are. */}
      <PageHero
        title={t('programme.title')}
        sub={t('programme.sub')}
        image="/scenes/interior"
        position="center 38%"
      />
      <ProgrammeSection showHeading={false}>
        <div className="mt-10">
          <RegisterLink withArrow>
            {t('hero.cta')}
          </RegisterLink>
        </div>
      </ProgrammeSection>
      <EventInfoSection />
    </>
  )
}
