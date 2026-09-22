import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { Reveal } from '@/components/ui/Reveal'
import { Ornament } from '@/components/ui/Ornament'
import { ExternalIcon, QuoteMark } from '@/components/ui/Icons'

/** §6 item 02 — the 2026 theme, its three conversations, and the pull quote. */
export function ThemeSection({
  withQuestions = true,
  showHeading = true,
}: {
  withQuestions?: boolean
  /** False on /about, where PageHero already carries the title. */
  showHeading?: boolean
}) {
  const { t, tList } = useI18n()

  return (
    <section id="theme" className="scroll-mt-24 border-t border-hair bg-cream-deep py-section">
      <div className="shell grid items-start gap-x-12 gap-y-8 lg:grid-cols-12">
        <Reveal variant="left" className="lg:col-span-7">
          {showHeading && (
            <>
              <h2 className="text-section font-semibold uppercase tracking-[0.06em] text-navy-900">
                {t('theme.title')}
              </h2>
              <Ornament className="mt-4 !justify-start" />
            </>
          )}
          <p className="mt-6 font-display text-h3 font-semibold text-navy-800">{t('theme.name')}</p>
          <p className="mt-2 text-small font-semibold uppercase tracking-[0.14em] text-gold-700">
            {t('theme.tagline')}
          </p>
          <p className="prose-measure mt-4">{t('theme.body')}</p>

          {withQuestions ? (
            /* The three conversations in full, as the client wrote them for
               this section: a title, the question it asks, and what it means. */
            <ol className="mt-8 max-w-measure">
              {tList('conversation.titles').map((title, i) => (
                <li key={title} className="flex gap-5 border-t border-hair py-5 last:border-b">
                  <span
                    aria-hidden
                    className="tnum pt-0.5 font-display text-small font-semibold text-gold-700"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>
                    <span className="block text-small font-semibold uppercase tracking-[0.12em] text-navy-900">
                      {title}
                    </span>
                    <span className="mt-1 block font-display italic text-gold-700">
                      {tList('conversation.questions')[i]}
                    </span>
                    <span className="mt-2 block text-body text-navy-800">
                      {tList('theme.convTexts')[i]}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <Link
              to="/about"
              className="group mt-6 inline-flex min-h-[44px] items-center gap-2 text-small font-semibold uppercase tracking-[0.12em] text-gold-700 transition-colors hover:text-navy-900"
            >
              {t('theme.cta')}
              <ExternalIcon className="h-2.5 w-2.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          )}
        </Reveal>

        {/*
          A typographic pull quote, not a picture card.

          It previously sat on a navy panel with the hero photograph behind it
          at 25% — which repeated an image already used twice on this page and
          turned a quotation into another block of chrome. Set on the section's
          own ground with gold marks opening and closing it, the words carry
          themselves and the section reads as one thought rather than two.
        */}
        <Reveal variant="right" delay={120} className="lg:col-span-5 lg:pt-10">
          <figure className="relative border-l border-gold-500/40 pl-6 sm:pl-8">
            <QuoteMark className="h-6 w-8 text-gold-500" />
            <blockquote className="mt-4 font-display text-lead italic leading-relaxed text-navy-800">
              {t('theme.quote')}
            </blockquote>
            <QuoteMark className="mt-4 h-6 w-8 rotate-180 text-gold-500/70" />
            {/* Attributed, as the client set it: the words belong to the
                Dialogue itself rather than to any one speaker. */}
            <figcaption className="mt-3 text-micro font-semibold uppercase tracking-[0.16em] text-slate">
              — {t('theme.quoteSource')}
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  )
}
