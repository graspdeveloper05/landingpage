import { useI18n } from '@/i18n'
import { PageHero } from '@/components/layout/PageHero'
import { SpeakerGrid } from '@/components/home/SpeakerGrid'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ButtonLink } from '@/components/ui/Button'
import { usePanelAndModerators } from '@/lib/useContent'

export function Speakers() {
  const { t } = useI18n()
  const { panelSpeakers, moderators } = usePanelAndModerators()

  return (
    <>
      <PageHero title={t('speakers.title')} sub={t('speakers.sub')} />

      <section className="bg-cream py-section">
          <div className="shell">
          <SpeakerGrid speakers={panelSpeakers} />
        </div>
      </section>

      <section className="border-t border-hair bg-cream-deep py-section">
          <div className="shell">
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
