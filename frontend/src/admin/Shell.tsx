import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { onBusyChange, type AdminUser } from './client'

/*
 * The panel's chrome.
 *
 * Deliberately not the public site's layout. A visitor is being persuaded; an
 * organiser is working, often through a list of thirty registrations, and the
 * two want opposite things. So: a fixed sidebar instead of a centred masthead,
 * system-sans throughout instead of the display serif, a working grey ground
 * instead of cream, and tighter spacing so more rows fit on a screen.
 */

const NAV = [
  { to: '/admin/event', label: 'Event', icon: CalendarIcon, hint: 'Date, venue, capacity' },
  { to: '/admin/speakers', label: 'Speakers', icon: PeopleIcon, hint: 'Line-up and portraits' },
  { to: '/admin/programme', label: 'Programme', icon: ListIcon, hint: 'Running order' },
  { to: '/admin/registrations', label: 'Registrations', icon: TicketIcon, hint: 'Attendees and export' },
  { to: '/admin/analytics', label: 'Analytics', icon: ChartIcon, hint: 'Visitors and pages' },
]

export function Shell({
  user,
  onSignOut,
  children,
}: {
  user: AdminUser
  onSignOut: () => void
  children: ReactNode
}) {
  const [navOpen, setNavOpen] = useState(false)
  const { pathname } = useLocation()

  // The drawer must close on navigation, or a phone shows the new page behind
  // a sidebar that is still covering it.
  useEffect(() => setNavOpen(false), [pathname])

  const current = NAV.find((item) => pathname.startsWith(item.to))

  return (
    <div className="admin-ui min-h-screen bg-[#F1F1EF] font-sans text-navy-950">
      {/* Backdrop for the mobile drawer. Absent on lg, where the sidebar is
          always in the layout rather than over it. */}
      {navOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-30 bg-navy-950/50 lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-navy-950 transition-transform duration-200 lg:translate-x-0',
          navOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center gap-2.5 border-b border-cream/10 px-4">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-sm bg-gold-500 text-[0.7rem] font-bold text-navy-950">
            SN
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[0.8rem] font-semibold leading-tight text-cream">
              Seri Negara Dialogue
            </span>
            <span className="block text-[0.65rem] uppercase tracking-[0.14em] text-gold-400">
              Admin
            </span>
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {NAV.map(({ to, label, icon: Icon, hint }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'mb-0.5 flex items-start gap-2.5 rounded-sm px-2.5 py-2 transition-colors',
                  isActive
                    ? 'bg-cream/10 text-cream'
                    : 'text-cream/65 hover:bg-cream/5 hover:text-cream',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* The active marker is a gold rail, not a filled block: a
                      solid gold row at this size fights the content for
                      attention every time your eye returns to the sidebar. */}
                  <span
                    aria-hidden
                    className={cn(
                      '-ml-2.5 h-9 w-0.5 shrink-0 rounded-r',
                      isActive ? 'bg-gold-500' : 'bg-transparent',
                    )}
                  />
                  <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', isActive && 'text-gold-400')} />
                  <span className="min-w-0">
                    <span className="block text-[0.82rem] font-semibold leading-tight">{label}</span>
                    <span className="block truncate text-[0.68rem] text-cream/40">{hint}</span>
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-cream/10 p-3">
          <p className="truncate text-[0.7rem] text-cream/50">Signed in as</p>
          <p className="truncate text-[0.78rem] font-semibold text-cream">{user.email}</p>
          <button
            type="button"
            onClick={onSignOut}
            className="mt-2 w-full rounded-sm border border-cream/20 px-2 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-cream/80 transition-colors hover:border-gold-500 hover:text-cream"
          >
            Sign out
          </button>
        </div>

        {/* A way back to the site itself. Without it the only exit from the
            panel is editing the address bar. */}
        <a
          href="/"
          className="border-t border-cream/10 px-3 py-2.5 text-[0.7rem] text-cream/50 transition-colors hover:text-cream"
        >
          ← View the website
        </a>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[#DDDCD8] bg-white px-4 sm:px-6 relative">
          <BusyBar />
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
            className="-ml-1 grid h-9 w-9 place-items-center rounded-sm text-navy-800 hover:bg-[#F1F1EF] lg:hidden"
          >
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden>
              <path d="M0 1h18M0 6h18M0 11h18" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>

          <h1 className="text-[0.95rem] font-semibold text-navy-950">
            {current?.label ?? 'Admin'}
          </h1>
          <span className="hidden text-[0.75rem] text-slate sm:inline">{current?.hint}</span>
        </header>

        {/*
          Full width, left-aligned against the sidebar -- not a centred column.
          `mx-auto max-w-6xl` centred the content in whatever space was left
          beside the sidebar, which on a wide screen parked a dead band down
          the right-hand side and pushed everything away from the navigation
          it belongs to. A capped width still stops forms stretching to
          absurdity on an ultrawide display.
        */}
        <main className="w-full max-w-[1600px] p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}

/**
 * A progress bar across the top of the panel while anything is loading.
 *
 * Indeterminate on purpose: we cannot know how long the server will take, and
 * a bar that fills to a percentage would be claiming knowledge it does not
 * have. This one just says "working".
 *
 * It sits on the header's bottom edge rather than above it, so it never
 * shifts the layout by a pixel when it appears -- a bar that pushes the page
 * down on every request is worse than no bar.
 */
function BusyBar() {
  const [busy, setBusy] = useState(false)

  useEffect(() => onBusyChange(setBusy), [])

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-[-1px] h-0.5 overflow-hidden transition-opacity duration-200',
        busy ? 'opacity-100' : 'opacity-0',
      )}
    >
      {busy && <div className="admin-progress-bar h-full w-full bg-gold-500" />}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Icons — 16px, 1.4 stroke, drawn on the same grid so the rail reads evenly.  */
/* -------------------------------------------------------------------------- */

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M2 14h12" stroke="currentColor" strokeWidth="1.4" />
      <rect x="3" y="8" width="2.5" height="5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="7" y="5" width="2.5" height="8" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11" y="2.5" width="2.5" height="10.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function PeopleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1.5 13.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11 3.2a2.5 2.5 0 0 1 0 4.6M12.2 9.9c1.4.5 2.3 1.8 2.3 3.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M6 4h8M6 8h8M6 12h8" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="2.5" cy="4" r="1" fill="currentColor" />
      <circle cx="2.5" cy="8" r="1" fill="currentColor" />
      <circle cx="2.5" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

function TicketIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        d="M2 5.5A1.5 1.5 0 0 1 3.5 4h9A1.5 1.5 0 0 1 14 5.5v1a1.5 1.5 0 0 0 0 3v1A1.5 1.5 0 0 1 12.5 12h-9A1.5 1.5 0 0 1 2 10.5v-1a1.5 1.5 0 0 0 0-3v-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M9.5 4v8" stroke="currentColor" strokeWidth="1.4" strokeDasharray="1.5 1.5" />
    </svg>
  )
}
