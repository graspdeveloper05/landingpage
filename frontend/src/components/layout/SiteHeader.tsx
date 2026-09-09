import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/cn'
import { useScrollSpy, useScrolledPast } from '@/lib/animation'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Wordmark } from './Wordmark'

const ROUTES = [
  { to: '/', key: 'nav.home' },
  { to: '/about', key: 'nav.about' },
  { to: '/speakers', key: 'nav.speakers' },
  { to: '/programme', key: 'nav.programme' },
  { to: '/rsvp', key: 'nav.rsvp' },
] as const

/** Homepage section ids, in the order they appear, for the scrollspy. */
const HOME_SECTIONS = ['about', 'speakers', 'programme', 'rsvp']

export function SiteHeader() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const scrolled = useScrolledPast(24)

  useEffect(() => setOpen(false), [pathname])

  // On the homepage every route target is also a section, so the nav follows
  // the reader down the page instead of sitting permanently on "Home".
  const spyIds = useMemo(() => (pathname === '/' ? HOME_SECTIONS : []), [pathname])
  const activeSection = useScrollSpy(spyIds)

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-all duration-300 ease-gentle',
        // Navy bar, matching the footer, so the page opens and closes on the
        // same ground and the ivory content sits between them.
        scrolled
          ? 'border-gold-500/30 bg-navy-950/95 shadow-bar backdrop-blur-md'
          : 'border-gold-500/20 bg-navy-950',
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-gold-500 focus:px-4 focus:py-2 focus:text-small focus:font-semibold focus:text-navy-950"
      >
        {t('nav.skip')}
      </a>

      <div className={cn('shell flex items-center justify-between gap-4 transition-all duration-300', scrolled ? 'h-16' : 'h-20')}>
        <NavLink to="/" className="flex min-h-[44px] items-center">
          <Wordmark tone="light" />
        </NavLink>

        <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
          {ROUTES.map(({ to, key }) => {
            const section = to.slice(1)
            const spied =
              pathname === '/' &&
              (section === '' ? activeSection === null : activeSection === section)

            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => {
                  // On the homepage the scrollspy decides; elsewhere the route does.
                  const on = pathname === '/' ? spied : isActive
                  return cn(
                    'relative py-1.5 text-small transition-colors duration-200',
                    'after:absolute after:-bottom-0.5 after:left-0 after:h-px after:bg-gold-400 after:transition-all after:duration-300',
                    on
                      ? 'text-gold-400 after:w-full'
                      : 'text-cream/75 after:w-0 hover:text-cream hover:after:w-full',
                  )
                }}
              >
                {t(key)}
              </NavLink>
            )
          })}
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitcher tone="light" className="hidden sm:flex" />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="flex h-11 w-11 items-center justify-center text-cream lg:hidden"
          >
            <span className="sr-only">{open ? t('nav.close') : t('nav.menu')}</span>
            <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden fill="none">
              {open ? (
                <path d="M3 2l16 10M19 2L3 12" stroke="currentColor" strokeWidth="1.4" />
              ) : (
                <path d="M0 1h22M0 7h22M0 13h22" stroke="currentColor" strokeWidth="1.4" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Primary" className="border-t border-gold-500/20 bg-navy-950 lg:hidden">
          <div className="shell py-2">
            {ROUTES.map(({ to, key }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-[54px] items-center border-b border-cream/12 text-body last:border-0',
                    isActive ? 'text-gold-400' : 'text-cream/85',
                  )
                }
              >
                {t(key)}
              </NavLink>
            ))}
            <LanguageSwitcher tone="light" className="py-3 sm:hidden" />
          </div>
        </nav>
      )}
    </header>
  )
}
