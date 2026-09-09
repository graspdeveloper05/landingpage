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
  const sub = onNavy ? 'text-gold-400' : 'text-gold-700'
  const rule = onNavy ? 'bg-gold-500/45' : 'bg-gold-600/40'

  return (
    <span className={cn('flex items-center gap-3', className)}>
      {/*
        The emblem is cut from the supplied logo, which ships on a cream card
        with no alpha channel. `mix-blend-multiply` disposes of that ground on
        the ivory header — cream over ivory multiplies to ivory — while the
        gold line art stays. On the navy footer multiply would erase the whole
        mark, so there it keeps a light plate to sit on.
      */}
      <span
        className={cn(
          'grid h-10 shrink-0 place-items-center rounded-sm px-1.5 transition-colors sm:h-11',
          onNavy && 'bg-cream/95 ring-1 ring-gold-500/35',
        )}
      >
        <img
          src="/brand/emblem.webp"
          alt=""
          width={320}
          height={166}
          className={cn('h-7 w-auto sm:h-8', !onNavy && 'mix-blend-multiply')}
        />
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
