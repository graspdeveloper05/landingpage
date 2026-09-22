import { useI18n, useLocalized } from '@/i18n'
import { Reveal } from '@/components/ui/Reveal'
import { Ornament } from '@/components/ui/Ornament'
import { portraitSrc } from '@/lib/portrait'
import { useChairman } from '@/lib/useContent'

/**
 * The Organising Chairman's full welcome, on the About page.
 *
 * The client asked for the short welcome on the home page to lead to the full
 * letter on "the next page". It lives here, under an anchor, rather than on a
 * page of its own: §5 fixes the site at five pages and asks for no more, and
 * a letter about why the Dialogue exists belongs with the page that explains
 * the Dialogue.
 *
 * Renders nothing when there is no letter, so an edition saved before the
 * field existed shows no heading over an empty space.
 */
export function ChairmanLetter() {
  const { t } = useI18n()
  const L = useLocalized()
  const chairman = useChairman()

  const letter = chairman.letter ? L(chairman.letter) : ''
  if (!letter.trim()) return null

  const paragraphs = letter.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

  return (
    <section id="welcome" className="scroll-mt-24 border-t border-hair bg-cream py-section">
      <div className="shell grid items-start gap-x-12 gap-y-10 lg:grid-cols-12">
        <Reveal variant="left" className="lg:col-span-4">
          <figure className="relative mx-auto max-w-[220px] lg:mx-0">
            <span aria-hidden className="absolute -inset-1.5 rounded-sm border border-gold-500/35" />
            <img
              src={portraitSrc(chairman.portrait)}
              alt=""
              width={600}
              height={720}
              loading="lazy"
              className="relative aspect-[5/6] w-full rounded-sm object-cover shadow-card"
            />
          </figure>
        </Reveal>

        <Reveal delay={100} className="lg:col-span-8">
          <h2 className="text-section font-semibold uppercase tracking-[0.06em] text-navy-900">
            {t('chairman.title')}
          </h2>
          <Ornament className="mt-4 !justify-start" />

          {/* The first paragraph is the salutation, and set as one. */}
          <div className="prose-measure mt-8">
            {paragraphs.map((p, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? 'font-display text-lead font-semibold text-navy-900'
                    : i === paragraphs.length - 1
                      ? 'font-display text-lead italic text-navy-900'
                      : undefined
                }
              >
                {p}
              </p>
            ))}
          </div>

          <div className="mt-10 border-t border-hair pt-6">
            <p className="font-display text-h3 italic text-gold-700">{chairman.name}</p>
            <p className="mt-2 text-small text-navy-800">{L(chairman.designation)}</p>
            <p className="text-small text-slate">{chairman.organisation}</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
