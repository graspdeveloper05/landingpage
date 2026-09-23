import type { CSSProperties, ReactNode } from 'react'
import { useI18n } from '@/i18n'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { useSponsors } from '@/lib/useContent'
import { SPONSOR_TIERS } from '@/data/types'

/**
 * Partners and sponsors — added at the client's request, and edited in the
 * panel: a logo, who they are, and which tier they belong to.
 *
 * Every logo sits on the same white tile at the same height, whatever its own
 * proportions. A crest, a tall stacked wordmark and a round seal side by side
 * otherwise read as three different sizes of importance, which is exactly
 * what a sponsor tier is not supposed to imply within itself.
 */
export function SponsorsSection() {
  const { t } = useI18n()
  const sponsors = useSponsors()
  // Grouped in the client's billing order, and a tier nobody is in is left
  // out rather than shown as a heading over an empty space.
  const tiers = SPONSOR_TIERS.map((key) => ({
    key,
    logos: sponsors.filter((s) => s.tier === key),
  })).filter((tier) => tier.logos.length > 0)
  const order = tiers.flatMap((tier) => tier.logos)

  if (tiers.length === 0) return null

  return (
    <section id="partners" className="scroll-mt-24 border-t border-hair bg-cream py-section">
      <div className="shell">
        <SectionHeading title={t('sponsors.title')} />

        {/*
          A wrapping row, each tier as wide as its own logos, rather than equal
          columns. In a three-column grid the two Gold sponsors were squeezed
          into one column and stacked, which made the tier with the most
          support look like the smallest.
        */}
        <div className="mx-auto mt-12 flex max-w-6xl flex-wrap items-start justify-center gap-x-14 gap-y-12">
          {tiers.map((tier, ti) => (
            <div key={tier.key}>
              <Reveal delay={ti * 120}>
                <h3 className="text-center text-micro font-semibold uppercase tracking-[0.18em] text-gold-700">
                  {t(`sponsors.${tier.key}`)}
                </h3>
              </Reveal>
              <ul className="mt-4 flex flex-wrap justify-center gap-3 sm:gap-4">
                {tier.logos.map((logo) => {
                  // One running count across every tier, so the logos arrive
                  // one after another left to right rather than all at once.
                  const i = order.indexOf(logo)
                  return (
                    <Reveal as="li" key={logo.id} variant="scale" delay={200 + i * 150}>
                      {/* A link only where the team has given one: a tile that
                          looks clickable and goes nowhere is worse than one
                          that is plainly a logo. */}
                      <Tile
                        href={logo.link}
                        label={logo.name}
                        style={{ ['--shine-delay' as string]: `${0.55 + i * 0.15}s` }}
                        className="lift group relative flex h-28 w-36 items-center justify-center overflow-hidden rounded-sm border border-hair bg-white p-3 shadow-card transition-colors duration-300 hover:border-gold-500/60 sm:h-36 sm:w-44 sm:p-4"
                      >
                        <img
                          src={logo.logo}
                          alt={logo.name}
                          width={logo.width ?? undefined}
                          height={logo.height ?? undefined}
                          loading="lazy"
                          className="relative max-h-full max-w-full object-contain transition-transform duration-500 ease-gentle group-hover:scale-[1.06]"
                        />
                        {/* A band of gold light that crosses the tile once, as
                            it lands. Once, not on a loop: a logo that keeps
                            glinting reads as an advertisement. */}
                        <span aria-hidden className="logo-shine" />
                        {/* A gold rule that draws in along the foot on hover. */}
                        <span
                          aria-hidden
                          className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-gold-500 transition-transform duration-500 ease-gentle group-hover:scale-x-100"
                        />
                      </Tile>
                    </Reveal>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/** A sponsor's tile: their website in a new tab when there is one, else a box. */
function Tile({
  href,
  label,
  className,
  style,
  children,
}: {
  href?: string | null
  label: string
  className: string
  style: CSSProperties
  children: ReactNode
}) {
  const { t } = useI18n()

  if (!href) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} (${t('common.newTab')})`}
      className={className + ' focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500'}
      style={style}
    >
      {children}
    </a>
  )
}
