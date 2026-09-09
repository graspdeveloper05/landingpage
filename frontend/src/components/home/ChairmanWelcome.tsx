import { chairman } from '@/data'
import { useI18n, useLocalized } from '@/i18n'
import { Reveal } from '@/components/ui/Reveal'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { QuoteMark } from '@/components/ui/Icons'

/** §6 item 03 — photograph, name, designation and welcome message. */
export function ChairmanWelcome() {
  const { t } = useI18n()
  const L = useLocalized()

  return (
    <section id="chairman" className="scroll-mt-24 border-t border-hair bg-cream py-section">
      <div className="shell">
        <SectionHeading title={t('chairman.title')} />

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-12">
          <Reveal variant="left" className="lg:col-span-4">
            <figure className="relative mx-auto max-w-xs">
              <span aria-hidden className="absolute -inset-2 rounded-sm border border-gold-500/35" />
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

          <Reveal delay={120} className="lg:col-span-5">
            <p className="text-body italic leading-relaxed text-navy-800">{L(chairman.message)}</p>
            <p className="mt-6 font-display text-h3 text-gold-600" aria-hidden>
              {chairman.name.replace(/[()]/g, '')}
            </p>
            <div className="mt-2 border-t border-hair pt-3">
              <p className="text-body font-semibold text-navy-900">{chairman.name}</p>
              <p className="text-small text-slate">{L(chairman.designation)}</p>
              <p className="text-small text-slate">{chairman.organisation}</p>
            </div>
          </Reveal>

          <Reveal variant="right" delay={220} className="lg:col-span-3">
            <figure className="border-l-2 border-gold-500 pl-5">
              <QuoteMark className="h-5 w-7 text-gold-500/70" />
              <blockquote className="mt-3 font-display text-lead italic leading-relaxed text-navy-800">
                {L(chairman.quote)}
              </blockquote>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
