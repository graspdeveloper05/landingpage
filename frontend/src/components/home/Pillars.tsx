import { useI18n } from '@/i18n'
import { Reveal } from '@/components/ui/Reveal'
import { CapitolIcon, ShipIcon, SunriseIcon } from '@/components/ui/Icons'

/**
 * "The Conversation We Must Have" — the band beneath the hero.
 *
 * Replaces the three one-word pillars, per the client's feedback. Those said
 * History / People / Future and nothing more; this names the three
 * conversations the Dialogue is actually built around and asks the question
 * each one answers, so a visitor learns the shape of the afternoon before
 * scrolling any further.
 *
 * Numbered because it genuinely is a sequence — the past, the present, then
 * the future — and the programme runs in that order.
 */
export function Pillars() {
  const { t, tList } = useI18n()

  const titles = tList('conversation.titles')
  const questions = tList('conversation.questions')
  const texts = tList('conversation.texts')
  const icons = [ShipIcon, CapitolIcon, SunriseIcon]

  return (
    <section id="pillars" className="relative scroll-mt-24 overflow-hidden bg-navy-900 py-section text-cream">
      {/* A faint radial lift behind the heading, so a full-width navy band
          has somewhere for the eye to land. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(60% 55% at 50% 0%, rgba(201,162,39,0.10), transparent 70%)' }}
      />

      <div className="shell relative">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-section font-semibold uppercase tracking-[0.06em] text-cream">
            {t('conversation.title')}
          </h2>
          <p className="mt-4 text-body text-cream/75">{t('conversation.sub')}</p>
        </Reveal>

        <ol className="relative mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
          {/* The thread joining the three medallions. Desktop only: stacked on
              a phone, a line running down between them reads as a divider. */}
          <span
            aria-hidden
            className="absolute left-[16.66%] right-[16.66%] top-[4.25rem] hidden h-px bg-gradient-to-r from-gold-500/10 via-gold-500/60 to-gold-500/10 md:block"
          />

          {titles.map((title, i) => {
            const Icon = icons[i]
            return (
              <Reveal as="li" key={title} delay={i * 130} className="relative text-center">
                {/* The numeral sits behind the medallion, large and faint: it
                    orders the three without competing with their titles. */}
                <span
                  aria-hidden
                  className="tnum pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 font-display text-[4.5rem] font-bold leading-none text-cream/[0.07]"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>

                <span className="relative mx-auto mt-6 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-gold-500/60 bg-navy-900 p-4 text-gold-400">
                  <Icon className="h-full w-full" />
                </span>

                <h3 className="mt-6 font-display text-small font-semibold uppercase tracking-[0.18em] text-cream">
                  {title}
                </h3>
                <p className="mt-2 font-display text-body italic text-gold-400">{questions[i]}</p>
                <span aria-hidden className="mx-auto mt-4 block h-px w-8 bg-gold-500/50" />
                <p className="mx-auto mt-4 max-w-[19rem] text-small leading-relaxed text-cream/70">
                  {texts[i]}
                </p>
              </Reveal>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
