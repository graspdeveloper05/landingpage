import { useI18n } from '@/i18n'
import { Reveal } from '@/components/ui/Reveal'
import { FutureIcon, HistoryIcon, PeopleIcon } from '@/components/ui/Icons'

/** The three-pillar band directly beneath the hero in the concept. */
export function Pillars() {
  const { t } = useI18n()

  const items = [
    { Icon: HistoryIcon, title: t('pillars.historyTitle'), text: t('pillars.historyText') },
    { Icon: PeopleIcon, title: t('pillars.peopleTitle'), text: t('pillars.peopleText') },
    { Icon: FutureIcon, title: t('pillars.futureTitle'), text: t('pillars.futureText') },
  ]

  return (
    <section id="pillars" className="scroll-mt-24 bg-navy-900">
      <div className="shell">
        <ul className="grid divide-y divide-cream/12 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {items.map(({ Icon, title, text }, i) => (
            <Reveal as="li" key={title} delay={i * 110} className="group px-2 py-8 sm:px-6">
              <div className="flex items-center justify-center gap-4 sm:flex-col sm:gap-3 sm:text-center">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold-500/45 p-2.5 text-gold-500 transition-all duration-300 group-hover:scale-105 group-hover:border-gold-500 group-hover:bg-gold-500/10">
                  <Icon className="h-full w-full" />
                </span>
                <span>
                  <p className="font-display text-small font-semibold uppercase tracking-[0.18em] text-cream">
                    {title}
                  </p>
                  <p className="mt-1 text-small text-cream/60">{text}</p>
                </span>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
