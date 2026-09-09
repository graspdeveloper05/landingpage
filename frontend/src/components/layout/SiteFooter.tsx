import { useState } from 'react'
import { quickLinks } from '@/data'
import { contactEmail, socialLinks } from '@/data/social'
import { useI18n } from '@/i18n'
import { Modal } from '@/components/ui/Modal'
import { Ornament } from '@/components/ui/Ornament'
import {
  ExternalIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  YouTubeIcon,
} from '@/components/ui/Icons'
import { Wordmark } from './Wordmark'

const SOCIAL_ICONS = {
  linkedin: LinkedInIcon,
  facebook: FacebookIcon,
  youtube: YouTubeIcon,
  instagram: InstagramIcon,
}

/**
 * §10 — official external links, opened in a new tab, described neutrally.
 * No organisation is called a partner, supporter or sponsor: the brief permits
 * that wording only once the status has been formally confirmed. Chevening
 * Alumni Malaysia is named as the convener, which the brief does confirm.
 */
export function SiteFooter() {
  const { t, tList } = useI18n()
  const [openDoc, setOpenDoc] = useState<'privacy' | 'terms' | null>(null)

  return (
    <footer className="border-t border-gold-500/25 bg-navy-950">
      <div className="shell py-14">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Identity and convener */}
          <div className="lg:col-span-4">
            <Wordmark tone="light" />
            <span aria-hidden className="mt-4 block h-px w-24 bg-gold-500/50" />

            <div className="mt-7 flex items-start gap-3">
              <img
                src="/brand/emblem.webp"
                alt=""
                width={320}
                height={166}
                className="mt-0.5 h-6 w-auto shrink-0 rounded-sm bg-cream/95 px-1 ring-1 ring-gold-500/30"
              />
              <div>
                <p className="text-micro font-medium uppercase tracking-[0.16em] text-cream/65">
                  {t('footer.convenedBy')}
                </p>
                <p className="mt-1 font-display text-lead text-cream">Chevening Alumni Malaysia</p>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <nav aria-label={t('footer.quickLinks')} className="lg:col-span-4">
            <h2 className="text-small font-semibold uppercase tracking-[0.14em] text-gold-500">
              {t('footer.quickLinks')}
            </h2>
            <ul className="mt-5 space-y-0.5">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex min-h-[40px] items-center gap-2 text-body text-cream/75 transition-colors hover:text-gold-500"
                  >
                    {link.label}
                    <ExternalIcon className="h-2.5 w-2.5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    <span className="sr-only">({t('common.newTab')})</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 max-w-measure text-micro text-cream/60">{t('footer.linksNote')}</p>
          </nav>

          {/* Social, legal, tagline */}
          <div className="lg:col-span-4 lg:text-right">
            <h2 className="sr-only">{t('footer.followUs')}</h2>
            <ul className="flex gap-2.5 lg:justify-end">
              {socialLinks.map(({ id, icon, network, url }) => {
                const Icon = SOCIAL_ICONS[icon]
                return (
                  <li key={id}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-11 w-11 items-center justify-center border border-cream/20 text-cream/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold-500 hover:text-gold-500"
                    >
                      <Icon className="h-[18px] w-[18px]" />
                      <span className="sr-only">{t('footer.socialOn', { network })}</span>
                    </a>
                  </li>
                )
              })}
            </ul>

            <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-1 text-micro text-cream/65 lg:justify-end">
              <li>
                <button
                  type="button"
                  onClick={() => setOpenDoc('privacy')}
                  className="min-h-[36px] transition-colors hover:text-gold-500"
                >
                  {t('footer.privacy')}
                </button>
              </li>
              <li aria-hidden className="h-3 w-px bg-cream/20" />
              <li>
                <button
                  type="button"
                  onClick={() => setOpenDoc('terms')}
                  className="min-h-[36px] transition-colors hover:text-gold-500"
                >
                  {t('footer.terms')}
                </button>
              </li>
              <li aria-hidden className="h-3 w-px bg-cream/20" />
              <li>
                <a
                  href={`mailto:${contactEmail}`}
                  className="min-h-[36px] transition-colors hover:text-gold-500"
                >
                  {t('footer.contact')}
                </a>
              </li>
            </ul>

            <p className="mt-6 font-display text-small uppercase tracking-[0.16em] text-gold-500">
              {t('footer.tagline')}
            </p>
          </div>
        </div>

        <Ornament className="my-10" tone="light" />

        <p className="text-center text-micro text-cream/60 lg:text-left">
          {t('footer.copyright')}
        </p>
      </div>

      <Modal
        open={openDoc !== null}
        onClose={() => setOpenDoc(null)}
        title={openDoc ? t(`${openDoc}.title`) : ''}
      >
        {openDoc && (
          <>
            <h2 className="text-section font-semibold text-navy-900">{t(`${openDoc}.title`)}</h2>
            <Ornament className="mt-4 !justify-start" />
            <div className="prose-measure mt-6">
              {tList(`${openDoc}.body`).map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </>
        )}
      </Modal>
    </footer>
  )
}
