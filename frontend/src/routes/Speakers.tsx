import { useI18n, useLocalized } from '@/i18n'
import { PageHero } from '@/components/layout/PageHero'
import { SpeakerGrid } from '@/components/home/SpeakerGrid'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { RegisterLink } from '@/components/ui/RegisterLink'
import { Reveal } from '@/components/ui/Reveal'
import { Ornament } from '@/components/ui/Ornament'
import { ExternalIcon } from '@/components/ui/Icons'
import { useSpeakerGroups } from '@/lib/useContent'
import { useParallax } from '@/lib/animation'
import { portraitSrc } from '@/lib/portrait'
import type { Speaker } from '@/data/types'

/**
 * §7 — everyone on the programme, in the order the afternoon runs.
 *
 * Not one band per role: the keynote, the moderator and the MC are each one
 * person, and a lone card centred in an empty band read as an unfinished
 * page. So the keynote takes a navy band of its own, at the size his billing
 * implies, and the two who run the afternoon share the closing band.
 */
export function Speakers() {
  const { t } = useI18n()
  const { groups } = useSpeakerGroups()

  const of = (role: Speaker['role']) => groups.find((g) => g.role === role)?.speakers ?? []
  const keynote = of('keynote')[0]
  const panellists = of('speaker')
  const closing = [...of('moderator'), ...of('mc')]

  return (
    <>
      <PageHero title={t('speakers.title')} sub={t('speakers.sub')} />

      {keynote && <KeynoteBand speaker={keynote} />}

      {panellists.length > 0 && (
        <section className="bg-cream py-section">
          <div className="shell">
            <SectionHeading title={t('speakers.groups.speaker')} />
            <div className="mt-12">
              <SpeakerGrid speakers={panellists} />
            </div>
          </div>
        </section>
      )}

      {closing.length > 0 && (
        <section className="border-t border-hair bg-cream-deep py-section">
          <div className="shell">
            <SectionHeading title={t('speakers.groups.hosting')} />
            {/* Moderator and MC together: each is one person, and side by side
                they read as the pair who run the afternoon. */}
            <div className="mx-auto mt-12 max-w-[34rem]">
              <SpeakerGrid speakers={closing} columns={2} />
            </div>
          </div>
        </section>
      )}

      <div className="border-t border-hair bg-cream py-section text-center">
        <RegisterLink withArrow>
          {t('hero.cta')}
        </RegisterLink>
      </div>
    </>
  )
}

/**
 * The keynote, given the weight of the address itself: a navy band, the
 * portrait framed as the chairman's is, and the name set at section size
 * rather than card size. Everything the card's profile would have shown is
 * on the page here, so there is nothing to open.
 */
function KeynoteBand({ speaker }: { speaker: Speaker }) {
  const { t } = useI18n()
  const L = useLocalized()
  const washRef = useParallax<HTMLImageElement>(0.06, 40)
  const bio = speaker.bio ? (L(speaker.bio) ?? '') : ''

  return (
    <section className="relative overflow-hidden bg-navy-900 py-section">
      <img
        ref={washRef}
        src="/scenes/interior.jpg"
        alt=""
        width={1672}
        height={941}
        loading="lazy"
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-[0.07]"
      />

      <div className="shell relative">
        <div className="mx-auto grid max-w-[58rem] items-center gap-10 sm:grid-cols-12 sm:gap-12">
          <Reveal variant="left" className="sm:col-span-5">
            <figure className="relative mx-auto max-w-[19rem]">
              <span aria-hidden className="absolute -inset-2 rounded-sm border border-gold-500/40" />
              <img
                src={portraitSrc(speaker.portrait)}
                alt=""
                width={600}
                height={720}
                className="relative aspect-[5/6] w-full rounded-sm object-cover"
              />
            </figure>
          </Reveal>

          <Reveal variant="right" delay={120} className="sm:col-span-7">
            <p className="text-micro font-semibold uppercase tracking-[0.16em] text-gold-400">
              {t('speakers.groups.keynote')}
            </p>
            <h2 className="mt-3 text-balance font-display text-section font-semibold leading-tight text-cream">
              {speaker.name}
            </h2>
            <Ornament className="mt-5 !justify-start" tone="light" />
            <p className="mt-5 text-lead text-cream/85">{L(speaker.designation)}</p>
            <p className="text-body text-cream/65">{speaker.organisation}</p>

            {bio.trim() && <p className="mt-6 max-w-measure text-body text-cream/80">{bio}</p>}

            {speaker.link && (
              <a
                href={speaker.link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex min-h-[44px] items-center gap-2 text-small font-semibold uppercase tracking-[0.1em] text-gold-400 transition-colors hover:text-cream"
              >
                {speaker.link.label}
                <ExternalIcon className="h-2.5 w-2.5" />
                <span className="sr-only">({t('common.newTab')})</span>
              </a>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
