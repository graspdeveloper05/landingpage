import { Route, Routes } from 'react-router-dom'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { MobileRegisterBar } from '@/components/layout/MobileRegisterBar'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { ScrollProgress } from '@/components/ui/ScrollProgress'
import { BackToTop } from '@/components/ui/BackToTop'
import { Home } from '@/routes/Home'
import { About } from '@/routes/About'
import { Speakers } from '@/routes/Speakers'
import { Programme } from '@/routes/Programme'
import { Rsvp } from '@/routes/Rsvp'
import { useEventStatus } from '@/lib/useEventStatus'

/** §5 — five routes, and no more. */
export default function App() {
  const { status, refresh } = useEventStatus()
  const remaining = status?.remaining ?? null

  return (
    <>
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
