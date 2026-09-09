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
        'fixed bottom-20 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full',
        'border border-gold-500/50 bg-navy-900/90 text-gold-500 backdrop-blur-sm',
        'transition-all duration-300 ease-gentle hover:-translate-y-0.5 hover:border-gold-500 hover:bg-navy-950',
        'lg:bottom-8',
        shown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      <span className="sr-only">{t('common.backToTop')}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="none">
        <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
