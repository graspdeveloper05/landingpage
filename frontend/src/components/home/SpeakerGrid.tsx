import { useState } from 'react'
import type { Speaker } from '@/data/types'
import { useI18n, useLocalized } from '@/i18n'
import { Modal } from '@/components/ui/Modal'
import { Reveal } from '@/components/ui/Reveal'
import { Ornament } from '@/components/ui/Ornament'
import { ExternalIcon } from '@/components/ui/Icons'
import { cn } from '@/lib/cn'
import { portraitSrc } from '@/lib/portrait'

/**
 * §7 — photograph, name, designation, organisation, biography and official
 * link. Individual speaker pages are ruled out, so the profile opens in a
 * modal. Four-up on desktop, as the concept shows.
 */
/** Static class strings so Tailwind can see every variant at build time. */
const COLUMNS = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
} as const

export function SpeakerGrid({
  speakers,
  columns = 4,
}: {
  speakers: Speaker[]
  /** Drop to 1 when showing the moderator alone, so the card keeps its width. */
  columns?: keyof typeof COLUMNS
}) {
  const { t } = useI18n()
  const L = useLocalized()
  const [active, setActive] = useState<Speaker | null>(null)

  return (
    <>
      {/* The four-up grid is held to 62rem rather than the full shell, so a
          card lands near 220px instead of 300px. At full width the portraits
          dominated every other element on the page. */}
      <ul
        className={cn(
          'mx-auto grid gap-4 sm:gap-5',
          COLUMNS[columns],
          columns === 4 && 'max-w-[62rem]',
        )}
      >
        {speakers.map((speaker, i) => (
          <Reveal as="li" key={speaker.id} variant="scale" delay={(i % columns) * 90} className="h-full">
            <button
              type="button"
              onClick={() => setActive(speaker)}
              className="lift group flex h-full w-full flex-col overflow-hidden rounded-sm border border-hair bg-white text-left shadow-card"
            >
              <span className="relative block overflow-hidden">
                <img
                  src={portraitSrc(speaker.portrait)}
                  alt=""
                  width={600}
                  height={720}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover transition-transform duration-500 ease-gentle group-hover:scale-[1.04]"
                />
                {speaker.role === 'moderator' && (
                  <span className="absolute right-0 top-3 bg-gold-500 px-3 py-1 text-micro font-semibold uppercase tracking-[0.14em] text-navy-950">
                    {t('speakers.moderatorBadge')}
                  </span>
                )}
              </span>

              <span className="flex flex-1 flex-col p-3 sm:p-3.5">
                <span className="text-balance font-display text-small font-semibold leading-snug text-navy-900 sm:text-body">
                  {speaker.name}
                </span>
                <span className="mt-1 text-pretty text-micro leading-snug text-slate sm:text-small">
                  {L(speaker.designation)}
                </span>
                <span className="text-pretty text-micro leading-snug text-slate/80 sm:text-small">
                  {speaker.organisation}
                </span>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-micro font-semibold uppercase tracking-[0.12em] text-gold-600 transition-colors group-hover:text-navy-900">
                  {t('speakers.viewProfile')}
                  <ExternalIcon className="h-2.5 w-2.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </span>
            </button>
          </Reveal>
        ))}
      </ul>

      <Modal
        open={active !== null}
        onClose={() => setActive(null)}
        title={active ? t('speakers.profileOf', { name: active.name }) : ''}
      >
        {active && (
          <div className="grid gap-7 sm:grid-cols-12">
            <img
              src={portraitSrc(active.portrait)}
              alt=""
              width={600}
              height={720}
              className="aspect-[5/6] w-full rounded-sm object-cover sm:col-span-4"
            />
            <div className="sm:col-span-8">
              {active.role === 'moderator' && (
                <p className="text-micro font-semibold uppercase tracking-[0.14em] text-gold-600">
                  {t('speakers.moderatorBadge')}
                </p>
              )}
              <h2 className="mt-1 font-display text-section font-semibold text-navy-900">
                {active.name}
              </h2>
              <p className="mt-2 text-small text-slate">{L(active.designation)}</p>
              <p className="text-small text-slate/80">{active.organisation}</p>

              <Ornament className="my-5 !justify-start" />
              <p className="max-w-measure text-body text-navy-800">{L(active.bio)}</p>

              {active.link && (
                <a
                  href={active.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex min-h-[44px] items-center gap-2 text-small font-semibold uppercase tracking-[0.1em] text-gold-600 hover:text-navy-900"
                >
                  {active.link.label}
                  <ExternalIcon className="h-2.5 w-2.5" />
                  <span className="sr-only">({t('common.newTab')})</span>
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
