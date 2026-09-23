import { useI18n } from '@/i18n'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'

interface Logo {
  name: string
  src: string
  width: number
  height: number
}

interface Tier {
  key: 'foundingPatron' | 'convenedBy' | 'gold' | 'silver' | 'marketing'
  logos: Logo[]
}

/*
 * The tiers and logos from the client's feedback of September 2026.
 *
 * Silver Sponsors and Marketing Partners are listed with nobody in them yet.
 * They are kept here so adding a logo is one line, and filtered out below so
 * the page never shows a heading with nothing under it.
 */
const TIERS: Tier[] = [
  {
    key: 'foundingPatron',
    logos: [
      { name: 'Kementerian Perpaduan Negara (Ministry of National Unity)', src: '/partners/ministry-national-unity.png', width: 363, height: 284 },
    ],
  },
  {
    key: 'convenedBy',
    logos: [{ name: 'Chevening Alumni Malaysia', src: '/partners/chevening-alumni-malaysia.png', width: 274, height: 397 }],
  },
  {
    key: 'gold',
    logos: [
      { name: 'Koperasi Serbaguna Kebangsaan Berhad (NCMSP)', src: '/partners/ncmsp.png', width: 480, height: 414 },
      { name: 'Perintis Akal', src: '/partners/perintis-akal.png', width: 383, height: 368 },
      { name: 'Intramiles', src: '/partners/intramiles.png', width: 560, height: 558 },
    ],
  },
  { key: 'silver', logos: [] },
  { key: 'marketing', logos: [] },
]

/**
 * Partners and sponsors — added at the client's request.
 *
 * Every logo sits on the same white tile at the same height, whatever its own
 * proportions. A crest, a tall stacked wordmark and a round seal side by side
 * otherwise read as three different sizes of importance, which is exactly
 * what a sponsor tier is not supposed to imply within itself.
 */
export function SponsorsSection() {
  const { t } = useI18n()
  const tiers = TIERS.filter((tier) => tier.logos.length > 0)

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
                  const order = TIERS.flatMap((x) => x.logos).indexOf(logo)
                  return (
                    <Reveal as="li" key={logo.src} variant="scale" delay={200 + order * 150}>
                      <div
                        style={{ ['--shine-delay' as string]: `${0.55 + order * 0.15}s` }}
                        className="lift group relative flex h-28 w-36 items-center justify-center overflow-hidden rounded-sm border border-hair bg-white p-3 shadow-card transition-colors duration-300 hover:border-gold-500/60 sm:h-36 sm:w-44 sm:p-4"
                      >
                        <img
                          src={logo.src}
                          alt={logo.name}
                          width={logo.width}
                          height={logo.height}
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
                      </div>
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
