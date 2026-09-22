import { useI18n } from '@/i18n'
import { PageHero } from '@/components/layout/PageHero'
import { SpeakerGrid } from '@/components/home/SpeakerGrid'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { ButtonLink } from '@/components/ui/Button'
import { useSpeakerGroups } from '@/lib/useContent'
import { REGISTRATION_URL } from '@/lib/registration'
import { cn } from '@/lib/cn'

/**
 * §7 — everyone on the programme, grouped by what they do on the day, in the
 * order the afternoon runs: keynote, panellists, moderator, Master of
 * Ceremonies. Groups alternate their ground so each reads as its own band.
 */
export function Speakers() {
  const { t } = useI18n()
  const { groups } = useSpeakerGroups()

  return (
    <>
      <PageHero title={t('speakers.title')} sub={t('speakers.sub')} />

      {groups.map(({ role, speakers }, i) => (
        <section
          key={role}
          className={cn('py-section', i % 2 === 0 ? 'bg-cream' : 'border-t border-hair bg-cream-deep')}
        >
          <div className="shell">
            <SectionHeading title={t(`speakers.groups.${role}`)} />
            {/* A lone speaker is held to one column's width rather than
                stretched across the page. */}
            <div
              className={cn(
                'mt-12',
                speakers.length === 1 && 'mx-auto w-full max-w-[17rem]',
              )}
            >
              <SpeakerGrid speakers={speakers} columns={speakers.length === 1 ? 1 : undefined} />
            </div>
          </div>
        </section>
      ))}

      <div className="border-t border-hair bg-cream py-section text-center">
        <ButtonLink href={REGISTRATION_URL} withArrow>
          {t('hero.cta')}
        </ButtonLink>
      </div>
    </>
  )
}
