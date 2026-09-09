import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { Reveal } from '@/components/ui/Reveal'
import { Ornament } from '@/components/ui/Ornament'
import { ExternalIcon } from '@/components/ui/Icons'

/** §6 item 01 — purpose and long-term ambition, with the heritage illustration. */
export function AboutSection({
  withLink = true,
  showHeading = true,
}: {
  withLink?: boolean
  /** False on /about, where PageHero already carries the title. */
  showHeading?: boolean
}) {
  const { t, tList } = useI18n()

  return (
    <section id="about" className="scroll-mt-24 bg-cream py-section">
      <div className="shell grid items-center gap-12 lg:grid-cols-12">
        <Reveal variant="left" className="lg:col-span-7">
          {showHeading && (
            <>
              <h2 className="text-section font-semibold uppercase tracking-[0.06em] text-navy-900">
                {t('about.title')}
              </h2>
              <Ornament className="mt-4 !justify-start" />
            </>
          )}
          <div className={`prose-measure ${showHeading ? 'mt-6' : ''}`}>
            {tList('about.body').map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          {withLink && (
            <Link
              to="/about"
              className="group mt-7 inline-flex min-h-[44px] items-center gap-2 text-small font-semibold uppercase tracking-[0.12em] text-gold-600 transition-colors hover:text-navy-900"
            >
              {t('about.cta')}
              <span className="sr-only"> — {t('about.title')}</span>
              <ExternalIcon className="h-2.5 w-2.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          )}
        </Reveal>

        <Reveal variant="right" delay={140} className="lg:col-span-5">
          <img
            src="/scenes/heritage.webp"
            alt=""
            width={1100}
            height={712}
            loading="lazy"
            /* The rendering ships on a near-white ground with no alpha.
               mix-blend-multiply drops that into the cream section, so the
               drawing sits on the page rather than inside a white box --
               no card, no shadow, no border. */
            className="mx-auto w-full mix-blend-multiply"
          />
        </Reveal>
      </div>
    </section>
  )
}
