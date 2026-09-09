import { useEffect, useRef, type ReactNode } from 'react'
import { useI18n } from '@/i18n'

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Speaker profiles (§7 rules out individual pages) and the privacy notice
 * (§5 rules out unnecessary pages). Focus is trapped, Escape closes, and
 * focus returns to whatever opened it.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const { t } = useI18n()

  useEffect(() => {
    if (!open) return

    openerRef.current = document.activeElement as HTMLElement | null
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    const panel = panelRef.current
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus() ?? panel?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel) return

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      openerRef.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={t('nav.close')}
        onClick={onClose}
        className="anim-fade absolute inset-0 bg-navy-950/65 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="anim-rise relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-t-sm bg-cream px-6 py-9 shadow-cardHover sm:rounded-sm sm:px-10 sm:py-10"
      >
        <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gold-500" />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-5 flex h-11 w-11 items-center justify-center text-slate transition-colors hover:text-navy-900"
        >
          <span className="sr-only">{t('nav.close')}</span>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden fill="none">
            <path d="M1 1l16 16M17 1L1 17" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  )
}
