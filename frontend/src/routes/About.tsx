import { useI18n } from '@/i18n'
import { PageHero } from '@/components/layout/PageHero'
import { AboutSection } from '@/components/home/AboutSection'
import { ThemeSection } from '@/components/home/ThemeSection'
import { ButtonLink } from '@/components/ui/Button'

export function About() {
  const { t } = useI18n()

  return (
    <>
      <PageHero title={t('about.title')} sub={t('hero.subtitle')} />
      <AboutSection withLink={false} showHeading={false} />
      <ThemeSection showHeading={false} />
      <div className="border-t border-hair bg-cream py-section text-center">
        <ButtonLink to="/rsvp" withArrow>
          {t('hero.cta')}
        </ButtonLink>
      </div>
    </>
  )
}
