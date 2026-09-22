import { useI18n } from '@/i18n'
import { useScrolledPast, useScrollToTop } from '@/lib/animation'
import { cn } from '@/lib/cn'

/** Appears once the reader is well down the page. */
export function BackToTop() {
  const { t } = useI18n()
  const shown = useScrolledPast(900)
  const toTop = useScrollToTop()

  return (
    <button
      type="button"
      onClick={toTop}
      tabIndex={shown ? 0 : -1}
      aria-hidden={!shown}
      className={cn(
        'fixed bottom-20 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full',
        /*
         * Solid gold, with a navy arrow. It used to be navy with a faint gold
         * ring -- which, the moment the reader reached the footer, sat navy
         * on navy (11,33,64 on 7,26,51) and effectively vanished, at exactly
         * the point on the page where someone reaches for it. Gold reads on
         * the cream sections and the navy footer alike.
         */
        'bg-gold-500 text-navy-950 ring-1 ring-navy-950/10',
        'shadow-[0_6px_18px_-4px_rgba(7,26,51,0.45)]',
        'transition-all duration-300 ease-gentle hover:-translate-y-0.5 hover:bg-gold-400 hover:shadow-[0_10px_24px_-6px_rgba(7,26,51,0.55)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cream focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900',
        'lg:bottom-8',
        shown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      <span className="sr-only">{t('common.backToTop')}</span>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none">
        <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
