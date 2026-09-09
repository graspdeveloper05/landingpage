import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { ButtonLink } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

/**
 * §11 — "The RSVP button should be highly visible." Most visitors arrive on a
 * phone from WhatsApp, so once the hero scrolls away the registration action
 * follows them down the page.
 */
export function MobileRegisterBar({ remaining }: { remaining: number | null }) {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 560)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (pathname === '/rsvp') return null

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-gold-500/30 bg-navy-950 shadow-bar lg:hidden',
        'transition-transform duration-300 ease-gentle',
        shown ? 'translate-y-0' : 'translate-y-full',
      )}
    >
      <div className="shell flex items-center justify-between gap-4 py-3">
        <p className="tnum text-micro leading-tight text-cream/65">
          {remaining === null ? t('hero.date') : t('rsvp.capacity', { remaining, total: 200 })}
        </p>
        <ButtonLink to="/rsvp" className="px-6">
          {t('rsvp.cta')}
        </ButtonLink>
      </div>
    </div>
  )
}
