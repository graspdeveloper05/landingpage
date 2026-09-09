import { cn } from '@/lib/cn'

/**
 * Crest plus stacked wordmark, as in the concept's header and footer.
 *
 * `tone` names the ground it sits on: "light" is the navy band (footer),
 * "dark" is the ivory bar (header). The crest carries a filled ground plate so
 * the line art reads at 40px instead of dissolving into whichever colour is
 * behind it.
 */
export function Wordmark({ tone = 'light', className }: { tone?: 'light' | 'dark'; className?: string }) {
  const onNavy = tone === 'light'
  const name = onNavy ? 'text-cream' : 'text-navy-900'
  const sub = onNavy ? 'text-gold-400' : 'text-gold-600'
  const rule = onNavy ? 'bg-gold-500/45' : 'bg-gold-600/40'

  return (
    <span className={cn('flex items-center gap-3', className)}>
      <span
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-sm ring-1 transition-colors sm:h-11 sm:w-11',
          onNavy ? 'bg-cream/10 ring-gold-500/35' : 'bg-navy-900 ring-navy-900/15',
        )}
      >
        <img src="/crest-gold.svg" alt="" width={40} height={40} className="h-7 w-7 sm:h-8 sm:w-8" />
      </span>

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
