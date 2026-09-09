import { useI18n } from '@/i18n'
import { PageHero } from '@/components/layout/PageHero'
import { ProgrammeSection } from '@/components/home/ProgrammeSection'
import { EventInfoSection } from '@/components/home/EventInfoSection'
import { ButtonLink } from '@/components/ui/Button'

export function Programme() {
  const { t } = useI18n()

  return (
    <>
      <PageHero title={t('programme.title')} sub={t('programme.sub')} />
      <ProgrammeSection showHeading={false}>
        <div className="mt-10">
          <ButtonLink to="/rsvp" withArrow>
            {t('hero.cta')}
          </ButtonLink>
        </div>
      </ProgrammeSection>
      <EventInfoSection />
    </>
  )
}
