import { useI18n } from '@/i18n'
import { Reveal } from '@/components/ui/Reveal'
import { Ornament } from '@/components/ui/Ornament'
import { QuoteMark } from '@/components/ui/Icons'
import { useParallax } from '@/lib/animation'

/** §6 item 02 — the 2026 theme, its questions, and the pull quote. */
export function ThemeSection({ withQuestions = true }: { withQuestions?: boolean }) {
  const { t, tList } = useI18n()
  const quoteBgRef = useParallax<HTMLImageElement>(0.1, 40)

  return (
    <section id="theme" className="scroll-mt-24 border-t border-hair bg-cream-deep py-section">
      <div className="shell grid gap-12 lg:grid-cols-12">
        <Reveal variant="left" className="lg:col-span-7">
          <h2 className="text-section font-semibold uppercase tracking-[0.06em] text-navy-900">
            {t('theme.title')}
          </h2>
          <Ornament className="mt-4 !justify-start" />
          <p className="mt-6 font-display text-h3 font-semibold text-navy-800">{t('theme.name')}</p>
          <p className="prose-measure mt-4">{t('theme.body')}</p>

          {withQuestions && (
            <ol className="mt-9 max-w-measure">
              {tList('theme.questions').map((q, i) => (
                <li
                  key={q}
                  className="flex gap-5 border-t border-hair py-4 last:border-b"
                >
                  <span aria-hidden className="tnum pt-0.5 font-display text-small font-semibold text-gold-600">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-body text-navy-800">{q}</span>
                </li>
              ))}
            </ol>
          )}
        </Reveal>

        <Reveal variant="scale" delay={150} className="lg:col-span-5">
          <figure className="relative h-full overflow-hidden rounded-sm bg-navy-900 p-8 sm:p-10">
            <img
              ref={quoteBgRef}
              src="/hero/hero-scene-960.jpg"
              alt=""
              width={960}
              height={347}
              loading="lazy"
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25"
            />
            <div className="relative">
              <QuoteMark className="h-7 w-9 text-gold-500" />
              <blockquote className="mt-5 font-display text-lead italic leading-relaxed text-cream sm:text-h3">
                {t('theme.quote')}
              </blockquote>
              <Ornament className="mt-6 !justify-start" tone="light" />
            </div>
          </figure>
        </Reveal>
      </div>
    </section>
  )
}
