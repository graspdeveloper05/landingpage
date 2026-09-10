import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { API_BASE, API_CONFIGURED } from '@/services/api'

/**
 * §12 — basic website analytics.
 *
 * First-party and cookieless: this posts a path to our own Laravel app, which
 * stores no IP address and sets nothing in the browser. That is why the site
 * carries no cookie banner. Anything that needed one would have to earn it,
 * and a page-view count does not.
 */

/** Set by the visitor's browser when they have asked not to be tracked. */
function doNotTrack() {
  return (
    navigator.doNotTrack === '1' ||
    // Safari and older Edge put it on window instead.
    (window as { doNotTrack?: string }).doNotTrack === '1'
  )
}

function send(path: string, locale: string) {
  if (!API_CONFIGURED || doNotTrack()) return

  const body = JSON.stringify({
    path,
    locale,
    // The full referrer goes no further than the server, which keeps only the
    // host. Sent whole because the server is better placed to decide what to
    // discard than a guess made here.
    referrer: document.referrer || null,
  })

  const url = `${API_BASE}/api/analytics/pageview`

  /*
   * sendBeacon where it exists: it survives the page being closed, which is
   * exactly when the last view of a session is recorded. A fetch from an
   * unloading page is cancelled, so the most interesting view -- the one
   * someone left from -- would be the one that never arrived.
   */
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
    return
  }

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // Never surface. A visitor reading the programme should not see a console
    // error because a counter failed.
  })
}

/**
 * Records a view whenever the route changes.
 *
 * Mounted inside the public site only. The admin panel is the organising
 * team's own tool: counting their editing sessions as visits would make the
 * busiest page on the site the one nobody outside the team ever opens.
 */
export function usePageViews(locale: string) {
  const { pathname } = useLocation()
  const last = useRef<string | null>(null)

  useEffect(() => {
    // React Router fires this on every navigation, including ones that only
    // change the query or the hash, and a language switch re-renders too.
    // Without this guard a visitor reading one page in two languages counts
    // as two views of it.
    if (last.current === pathname) return
    last.current = pathname
    send(pathname, locale)
    // `locale` deliberately absent from the dependencies: switching language
    // is not a new page view, and including it would make it one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])
}
