import { useI18n } from '@/i18n'
import { moderators, panelSpeakers } from '@/data'
import { PageHero } from '@/components/layout/PageHero'
import { SpeakerGrid } from '@/components/home/SpeakerGrid'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ButtonLink } from '@/components/ui/Button'
import { Fluting } from '@/components/ui/Fluting'

export function Speakers() {
  const { t } = useI18n()

  return (
    <>
      <PageHero title={t('speakers.title')} sub={t('speakers.sub')} />

      <section className="relative isolate overflow-hidden bg-cream py-section">
        <Fluting />
        <div className="shell relative">
          <SpeakerGrid speakers={panelSpeakers} />
        </div>
      </section>

      <section className="relative isolate overflow-hidden border-t border-hair bg-cream-deep py-section">
        <Fluting />
        <div className="shell relative">
          <SectionHeading title={t('speakers.moderatorBadge')} />
          {/* A single card, held to roughly one column of the grid above. */}
          <div className="mx-auto mt-12 w-full max-w-[17rem]">
            <SpeakerGrid speakers={moderators} columns={1} />
          </div>
          <div className="mt-14 text-center">
            <ButtonLink to="/rsvp" withArrow>
              {t('hero.cta')}
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}
