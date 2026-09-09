import { useI18n } from '@/i18n'
import { Reveal } from '@/components/ui/Reveal'
import { Ornament } from '@/components/ui/Ornament'
import {
  FormIcon,
  GlobeIcon,
  GrowthIcon,
  MobileIcon,
  ShareIcon,
} from '@/components/ui/Icons'

/**
 * §11 — most visitors arrive on a phone from WhatsApp, so the concept closes
 * by showing the mobile view. The frame below renders the live hero content
 * rather than a screenshot, so it can never fall out of date.
 */
export function DevicesSection() {
  const { t } = useI18n()

  const features = [
    { Icon: MobileIcon, label: t('devices.mobile') },
    { Icon: ShareIcon, label: t('devices.share') },
    { Icon: FormIcon, label: t('devices.register') },
    { Icon: GlobeIcon, label: t('devices.languages') },
    { Icon: GrowthIcon, label: t('devices.future') },
  ]

  return (
    <section className="border-t border-hair bg-cream-deep py-section">
      <div className="shell grid items-center gap-14 lg:grid-cols-12">
        <Reveal variant="scale" className="flex justify-center lg:col-span-5">
          <div className="relative w-[248px] rounded-[2rem] border-[7px] border-navy-900 bg-navy-900 shadow-cardHover">
            <span aria-hidden className="absolute left-1/2 top-2 h-1 w-14 -translate-x-1/2 rounded-full bg-cream/25" />
            <div className="overflow-hidden rounded-[1.5rem] bg-cream pt-6">
              <div className="relative h-[420px]">
                <img
                  src="/hero/hero-scene-960.jpg"
                  alt=""
                  width={960}
                  height={347}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover object-[64%_40%]"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-cream via-cream/70 to-cream/95" />
                <div className="relative px-5 pt-6 text-center">
                  <img src="/brand/emblem.webp" alt="" width={320} height={166} className="mx-auto h-7 w-auto" />
                  <p className="mt-3 font-display text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-navy-900">
                    Seri Negara Dialogue
                  </p>
                  <p className="text-[0.55rem] uppercase tracking-[0.25em] text-gold-600">2026</p>

                  <h3 className="mt-5 font-display text-lg font-bold uppercase leading-tight text-navy-900">
                    {t('hero.line1')}
                    <span className="block text-gold-600">{t('hero.line2')}</span>
                  </h3>

                  <Ornament className="mt-3 scale-75" />

                  <p className="mt-3 text-[0.58rem] font-medium uppercase tracking-[0.13em] text-slate">
                    {t('hero.date')}
                  </p>
                  <p className="text-[0.58rem] font-medium uppercase tracking-[0.13em] text-slate">
                    {t('hero.venue')}
                  </p>

                  <span className="mt-5 inline-block bg-gold-500 px-5 py-2 text-[0.55rem] font-semibold uppercase tracking-[0.14em] text-navy-950">
                    {t('hero.cta')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="lg:col-span-7">
          <Reveal>
            <h2 className="text-section font-semibold uppercase tracking-[0.06em] text-navy-900">
              {t('devices.title')}
            </h2>
            <Ornament className="mt-4 !justify-start" />
          </Reveal>

          <ul className="mt-8 space-y-1">
            {features.map(({ Icon, label }, i) => (
              <Reveal as="li" key={label} variant="right" delay={i * 80}>
                <div className="group flex items-center gap-4 border-b border-hair py-4 last:border-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-500/45 p-2 text-gold-600 transition-all duration-300 group-hover:border-gold-500 group-hover:bg-gold-500/10">
                    <Icon className="h-full w-full" />
                  </span>
                  <span className="text-body font-medium text-navy-900">{label}</span>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
