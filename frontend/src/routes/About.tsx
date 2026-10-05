import { useI18n } from '@/i18n'
import { PageHero } from '@/components/layout/PageHero'
import { AboutSection } from '@/components/home/AboutSection'
import { ThemeSection } from '@/components/home/ThemeSection'
import { ChairmanLetter } from '@/components/about/ChairmanLetter'
import { TestimonialsSection } from '@/components/home/TestimonialsSection'
import { RegisterLink } from '@/components/ui/RegisterLink'

export function About() {
  const { t } = useI18n()

  return (
    <>
      <PageHero title={t('about.title')} sub={t('hero.subtitle')} />
      <AboutSection withLink={false} showHeading={false} />
      <ThemeSection showHeading={false} />
      <ChairmanLetter />
      <TestimonialsSection />
      <div className="border-t border-hair bg-cream py-section text-center">
        <RegisterLink withArrow>
          {t('rsvp.formCta')}
        </RegisterLink>
      </div>
    </>
  )
}
