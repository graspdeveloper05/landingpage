import { cn } from '@/lib/cn'

/**
 * Crest plus stacked wordmark, as in the concept's header and footer.
 *
 * `tone` names the ground it sits on: "light" is the navy band (footer),
 * "dark" is the ivory bar (header).
 */
export function Wordmark({ tone = 'light', className }: { tone?: 'light' | 'dark'; className?: string }) {
  const onNavy = tone === 'light'
  const name = onNavy ? 'text-cream' : 'text-navy-900'
  const sub = onNavy ? 'text-gold-400' : 'text-gold-700'
  const rule = onNavy ? 'bg-gold-500/45' : 'bg-gold-600/40'

  return (
    <span className={cn('flex items-center gap-3', className)}>
      {/*
        The client's gold emblem, cut out onto a transparent ground so it sits
        straight on navy or ivory with no card behind it -- the same mark as
        the browser-tab icon.
      */}
      <img
        src="/brand/emblem-gold.webp"
        alt=""
        width={236}
        height={176}
        className="h-10 w-auto shrink-0 sm:h-11"
      />

      <span className="leading-none">
        <span
          className={cn(
            'block font-display text-[0.95rem] font-semibold uppercase tracking-[0.18em] sm:text-[1.05rem]',
            name,
          )}
        >
          Seri Negara
        </span>

        <span className="mt-1.5 flex items-center gap-1.5">
          <span className={cn('h-px w-3 sm:w-4', rule)} aria-hidden />
          <span className={cn('font-display text-[0.66rem] uppercase tracking-[0.34em] sm:text-[0.72rem]', sub)}>
            Dialogue
          </span>
          <span className={cn('h-px w-3 sm:w-4', rule)} aria-hidden />
          <span className={cn('font-display text-[0.66rem] tracking-[0.18em] sm:text-[0.72rem]', sub)}>2026</span>
        </span>
      </span>
    </span>
  )
}
