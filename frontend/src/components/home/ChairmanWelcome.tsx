import { Link } from 'react-router-dom'
import { chairman } from '@/data'
import { useI18n, useLocalized } from '@/i18n'
import { Reveal } from '@/components/ui/Reveal'
import { Ornament } from '@/components/ui/Ornament'
import { ExternalIcon, QuoteMark } from '@/components/ui/Icons'

/**
 * §6 item 03 — photograph, name, designation and welcome message.
 *
 * Laid out as one band: portrait, letter, pull quote. The heading sits with
 * the letter rather than centred over the whole section — centring it pushed
 * everything down and left the row reading as three unrelated blocks.
 */
export function ChairmanWelcome() {
  const { t } = useI18n()
  const L = useLocalized()

  return (
    <section id="chairman" className="scroll-mt-24 border-t border-hair bg-cream py-section">
      <div className="shell grid items-start gap-x-10 gap-y-8 lg:grid-cols-12">
        <Reveal variant="left" className="lg:col-span-3 lg:self-center">
          {/*
            The drift goes on the figure, not the image: the gold frame is an
            absolutely positioned sibling of the portrait, so floating the
            image alone would slide it out of its own frame.
          */}
          <figure className="anim-drift relative mx-auto max-w-[220px] lg:mx-0">
            <span aria-hidden className="absolute -inset-1.5 rounded-sm border border-gold-500/35" />
            <img
              src={chairman.portrait}
              alt=""
              width={600}
              height={720}
              loading="lazy"
              className="relative aspect-[5/6] w-full rounded-sm object-cover shadow-card"
            />
          </figure>
        </Reveal>

        <Reveal delay={100} className="lg:col-span-6">
          <h2 className="text-[clamp(1.5rem,2.4vw,2rem)] font-semibold uppercase leading-tight tracking-[0.05em] text-navy-900">
            {t('chairman.title')}
          </h2>
          <Ornament className="mt-3 !justify-start" />

          <p className="prose-measure mt-5 italic text-navy-800">{L(chairman.message)}</p>

          {/*
            Stands in for a scanned signature. Set in italic display type at a
            larger size so it reads as a signature above the printed name,
            rather than looking like the name has been output twice — which is
            exactly how it read when both were set the same way.
            Replace with a signature image when the chairman supplies one.
          */}
          <p
            aria-hidden
            className="mt-6 font-display text-[1.6rem] italic leading-none text-gold-700"
          >
            {chairman.name.replace(/[()]/g, '')}
          </p>

          {/* Attribution and the link share a row, the link pushed to the
              right edge of the letter — it reads as the end of the message
              rather than another item stacked under the signature. */}
          <div className="mt-3 flex flex-col gap-3 border-t border-hair pt-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div>
              <p className="text-body font-semibold text-navy-900">{chairman.name}</p>
              <p className="text-small text-slate">{L(chairman.designation)}</p>
              <p className="text-small text-slate">{chairman.organisation}</p>
            </div>

            <Link
              to="/about"
              className="group inline-flex min-h-[44px] shrink-0 items-center gap-2 text-small font-semibold uppercase tracking-[0.12em] text-gold-700 transition-colors hover:text-navy-900"
            >
              {t('chairman.cta')}
              <ExternalIcon className="h-2.5 w-2.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>

        <Reveal variant="right" delay={180} className="lg:col-span-3 lg:pt-14">
          <figure className="border-l border-gold-500/40 pl-5">
            <QuoteMark className="h-5 w-7 text-gold-500" />
            <blockquote className="mt-3 font-display text-lead italic leading-relaxed text-navy-800">
              {L(chairman.quote)}
            </blockquote>
            <QuoteMark className="mt-3 h-5 w-7 rotate-180 text-gold-500/70" />
          </figure>
        </Reveal>
      </div>
    </section>
  )
}
