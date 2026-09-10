import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { MobileRegisterBar } from '@/components/layout/MobileRegisterBar'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { ScrollProgress } from '@/components/ui/ScrollProgress'
import { BackToTop } from '@/components/ui/BackToTop'
import { Cursor } from '@/components/ui/Cursor'
import { Home } from '@/routes/Home'
import { About } from '@/routes/About'
import { Speakers } from '@/routes/Speakers'
import { Programme } from '@/routes/Programme'
import { Rsvp } from '@/routes/Rsvp'
import { useEventStatus } from '@/lib/useEventStatus'
import { usePageViews } from '@/lib/analytics'
import { useI18n } from '@/i18n'

/*
 * The admin panel is a separate chunk, fetched only when someone opens
 * /admin. A visitor reading the programme never downloads the editor, and the
 * public site's load time is unchanged by it existing.
 */
const AdminApp = lazy(() => import('@/admin/AdminApp'))

// Imported eagerly, not lazily: it is what shows WHILE the admin chunk is
// being fetched, so putting it in that chunk would leave a blank screen
// until the thing it was meant to cover had already arrived.
import { AdminSplash } from '@/admin/Loading'

export default function App() {
  return (
    <Routes>
      {/* §15 — the organising team's own editor. No site header, no footer,
          no RSVP bar: it is a different place that happens to share a domain. */}
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<AdminSplash message="Opening the admin panel…" />}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route path="*" element={<PublicSite />} />
    </Routes>
  )
}

/** §5 — five routes, and no more. */
function PublicSite() {
  const { status, refresh } = useEventStatus()
  const { locale } = useI18n()
  const remaining = status?.remaining ?? null

  // §12 — counted here rather than in App, so the admin panel's own routes
  // are never recorded as visits.
  usePageViews(locale)

  return (
    <>
      {/* Public site only. The admin panel is a tool the organising team works
          in for an hour at a time, where a decorated pointer is a nuisance
          rather than a flourish. */}
      <Cursor />
      <ScrollToTop />
      <ScrollProgress />
      <SiteHeader />

      <main id="main" className="pb-16 lg:pb-0">
        <Routes>
          <Route path="/" element={<Home status={status} refresh={refresh} />} />
          <Route path="/about" element={<About />} />
          <Route path="/speakers" element={<Speakers />} />
          <Route path="/programme" element={<Programme />} />
          <Route path="/rsvp" element={<Rsvp status={status} refresh={refresh} />} />
          {/* Anything else lands on the homepage rather than a dead end. */}
          <Route path="*" element={<Home status={status} refresh={refresh} />} />
        </Routes>
      </main>

      <SiteFooter />
      <MobileRegisterBar remaining={remaining} />
      <BackToTop />
    </>
  )
}
