import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { adminApi, AdminError, NotSignedIn, type AdminUser } from './client'
import { AdminButton, AdminField, Notice } from './ui'
import { AdminSplash } from './Loading'
import { ToastProvider } from './Toast'
import { AnalyticsAdmin } from './AnalyticsAdmin'
import { ChairmanAdmin } from './ChairmanAdmin'
import { EventAdmin } from './EventAdmin'
import { SpeakersAdmin } from './SpeakersAdmin'
import { ProgrammeAdmin } from './ProgrammeAdmin'
import { RegistrationsAdmin } from './RegistrationsAdmin'
import { Shell } from './Shell'

/**
 * §15 — "Routine website updates should not require developer involvement."
 *
 * The panel is part of the same React app, lazily loaded, so it shares the
 * build and the domain with the public site and adds nothing to the bundle a
 * visitor downloads.
 */
export default function AdminApp() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [checking, setChecking] = useState(true)

  const check = useCallback(() => {
    adminApi
      .get<{ user: AdminUser }>('/admin/me')
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false))
  }, [])

  useEffect(check, [check])

  // The tab title should say where you are; the panel is a different place
  // from the public site even though it shares the domain.
  useEffect(() => {
    const previous = document.title
    document.title = 'Admin — Seri Negara Dialogue'
    return () => {
      document.title = previous
    }
  }, [])

  if (checking) return <AdminSplash message="Checking your session…" />

  if (!user) return <LoginScreen onSignedIn={setUser} />

  // Cleared locally whatever the server says: if the session has already gone
  // the request 401s, and leaving the panel open would be worse than signing
  // out optimistically.
  const signOut = () => {
    adminApi.post('/admin/logout').catch(() => {})
    setUser(null)
  }

  return (
    <Shell user={user} onSignOut={signOut}>
      <ToastProvider>
        <SessionBoundary onExpired={() => setUser(null)}>
        <Routes>
          <Route path="analytics" element={<AnalyticsAdmin />} />
          <Route path="event" element={<EventAdmin />} />
          <Route path="chairman" element={<ChairmanAdmin />} />
          <Route path="speakers" element={<SpeakersAdmin />} />
          <Route path="programme" element={<ProgrammeAdmin />} />
          <Route path="registrations" element={<RegistrationsAdmin />} />
          <Route path="*" element={<Navigate to="/admin/event" replace />} />
        </Routes>
        </SessionBoundary>
      </ToastProvider>
    </Shell>
  )
}

/**
 * Sends the panel back to the login screen when a session expires mid-edit.
 *
 * Every page would otherwise have to handle NotSignedIn itself, and the one
 * that forgot would sit showing a stale list and failing silently on save.
 */
function SessionBoundary({
  children,
  onExpired,
}: {
  children: React.ReactNode
  onExpired: () => void
}) {
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      if (e.reason instanceof NotSignedIn) {
        e.preventDefault()
        onExpired()
      }
    }
    window.addEventListener('unhandledrejection', handler)
    return () => window.removeEventListener('unhandledrejection', handler)
  }, [onExpired])

  return <>{children}</>
}

function LoginScreen({ onSignedIn }: { onSignedIn: (u: AdminUser) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Bumped on each failure so the shake replays. Without a changing key React
  // reuses the element, the class is already on it, and the animation runs
  // once and never again however many times you get the password wrong.
  const [attempt, setAttempt] = useState(0)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const r = await adminApi.post<{ user: AdminUser }>('/admin/login', { email, password })
      onSignedIn(r.user)
    } catch (err) {
      setAttempt((n) => n + 1)
      setError(
        err instanceof AdminError
          ? // 429 is the login throttle. Without naming it, a locked-out
            // organiser reads "too many requests" as a site fault.
            err.status === 429
            ? 'Too many attempts. Wait a minute and try again.'
            : (err.fields.email ?? err.message)
          : 'Could not reach the server.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-ui relative grid min-h-screen place-items-center overflow-hidden bg-navy-950 px-4 font-sans">
      {/*
        A wash of light behind the card, off-centre and low.
        Flat navy across a whole screen reads as an unstyled page; this gives
        the card something to sit in without putting a photograph behind a
        password field, which would be decoration in the one place on the site
        where nothing should compete for attention.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(120% 80% at 50% 115%, rgba(201,162,39,0.16) 0%, rgba(201,162,39,0.05) 38%, transparent 68%)',
        }}
      />

      <div className="relative w-full max-w-sm">
        <form
          onSubmit={submit}
          className="admin-card-in rounded-sm border border-navy-700/40 bg-cream p-7 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)]"
        >
          {/*
            The emblem ships on a cream ground with no alpha, so it is given a
            plate and a gold ring rather than being floated on the card and
            showing as a pale rectangle. It reads as a seal, which is the right
            note for the door to an organising team's tools.
          */}
          <span className="admin-rise mx-auto grid h-14 w-14 place-items-center rounded-full border border-gold-500/45 bg-white">
            <img src="/brand/emblem.webp" alt="" width={320} height={166} className="h-7 w-auto" />
          </span>

          <p
            className="admin-rise mt-4 text-center text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold-700"
            style={{ animationDelay: '0.06s' }}
          >
            Seri Negara Dialogue
          </p>
          <h1
            className="admin-rise mt-1 text-center text-[1.15rem] font-semibold text-navy-950"
            style={{ animationDelay: '0.12s' }}
          >
            Organising team sign in
          </h1>
          <p
            className="admin-rise mt-1.5 text-center text-[0.75rem] leading-snug text-slate"
            style={{ animationDelay: '0.16s' }}
          >
            Speakers, programme, event details and registrations.
          </p>

          {error && (
            <div key={attempt} className="admin-shake mt-5">
              <Notice kind="error">{error}</Notice>
            </div>
          )}

          <div className="admin-rise mt-5 space-y-3" style={{ animationDelay: '0.22s' }}>
            <AdminField label="Email" type="email" value={email} onChange={setEmail} />
            <AdminField label="Password" type="password" value={password} onChange={setPassword} />
          </div>

          <AdminButton
            type="submit"
            disabled={busy}
            className="admin-rise mt-6 w-full"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </AdminButton>

          <p className="mt-5 border-t border-hair pt-3 text-center text-[0.68rem] leading-snug text-slate">
            Lost your password? It cannot be recovered — ask whoever set up the
            site to issue a new one.
          </p>
        </form>

        <p
          className="admin-rise mt-4 text-center text-[0.7rem] text-cream/45"
          style={{ animationDelay: '0.3s' }}
        >
          <a href="/" className="transition-colors hover:text-cream">
            ← Back to serinegaradialogue.org
          </a>
        </p>
      </div>
    </div>
  )
}
