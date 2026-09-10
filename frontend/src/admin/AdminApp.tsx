import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { adminApi, AdminError, NotSignedIn, type AdminUser } from './client'
import { AdminButton, AdminField, Notice } from './ui'
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

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-cream">
        <p className="text-small text-slate">Checking your session…</p>
      </div>
    )
  }

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
      <SessionBoundary onExpired={() => setUser(null)}>
        <Routes>
          <Route path="event" element={<EventAdmin />} />
          <Route path="speakers" element={<SpeakersAdmin />} />
          <Route path="programme" element={<ProgrammeAdmin />} />
          <Route path="registrations" element={<RegistrationsAdmin />} />
          <Route path="*" element={<Navigate to="/admin/event" replace />} />
        </Routes>
      </SessionBoundary>
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

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const r = await adminApi.post<{ user: AdminUser }>('/admin/login', { email, password })
      onSignedIn(r.user)
    } catch (err) {
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
    <div className="grid min-h-screen place-items-center bg-navy-950 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-sm bg-cream p-6 shadow-card">
        <p className="font-display text-small font-semibold uppercase tracking-[0.16em] text-navy-900">
          Seri Negara Dialogue
        </p>
        <h1 className="mt-1 font-display text-h3 font-semibold text-navy-900">Admin sign in</h1>

        {error && (
          <div className="mt-4">
            <Notice kind="error">{error}</Notice>
          </div>
        )}

        <div className="mt-5 space-y-4">
          <AdminField label="Email" type="email" value={email} onChange={setEmail} />
          <AdminField label="Password" type="password" value={password} onChange={setPassword} />
        </div>

        <AdminButton type="submit" disabled={busy} className="mt-6 w-full">
          {busy ? 'Signing in…' : 'Sign in'}
        </AdminButton>
      </form>
    </div>
  )
}
