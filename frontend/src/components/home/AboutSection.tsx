import { Link } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { Reveal } from '@/components/ui/Reveal'
import { Ornament } from '@/components/ui/Ornament'
import { ExternalIcon } from '@/components/ui/Icons'
import { Picture } from '@/components/ui/Picture'
import { REGISTRATION_URL } from '@/lib/registration'

/** §6 item 01 — purpose and invitation, beside the grand hall of Muzium Negara. */
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
          <p className={`font-display text-h3 font-semibold text-navy-800 ${showHeading ? 'mt-6' : ''}`}>
            {t('about.sub')}
          </p>
          <div className="prose-measure mt-5">
            {tList('about.body').map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          {/* The client's closing line, set apart: it is the sentence the
              section exists to leave the reader with. */}
          <p className="mt-6 border-l-2 border-gold-500 pl-4 font-display text-lead italic text-navy-900">
            {t('about.closing')}
          </p>

          <p className="mt-6 text-body text-navy-800">
            {t('about.invite')}{' '}
            <a
              href={REGISTRATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-gold-700 underline decoration-gold-500/40 underline-offset-4 transition-colors hover:text-navy-900"
            >
              {t('rsvp.formCta')}
              <span className="sr-only"> ({t('common.newTab')})</span>
            </a>
          </p>

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
          {/*
            The grand hall of Muzium Negara, from the client's images. A
            photograph, where this used to be a line drawing: so it takes a
            frame of its own rather than the multiply blend that let the drawing
            sit on the page, which would muddy a photograph's colour.
          */}
          <Picture
            base="/scenes/hall"
            alt={t('about.imageAlt')}
            width={1400}
            height={788}
            loading="lazy"
            className="anim-drift block overflow-hidden rounded-sm shadow-card"
            imgClassName="block aspect-[16/10] h-auto w-full object-cover"
          />
        </Reveal>
      </div>
    </section>
  )
}
