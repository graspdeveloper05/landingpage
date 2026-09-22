import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * A route change starts at the top, not wherever the last page was -- unless
 * the link names a place on the page, like /about#welcome from the chairman's
 * band on the home page. Then it goes there.
 *
 * The target is looked for over a few frames rather than once: the section it
 * names may render a moment after the route does, once its data has arrived,
 * and a single lookup would find nothing and leave the reader at the top.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }

    const id = decodeURIComponent(hash.slice(1))
    let tries = 0
    let frame = 0

    const seek = () => {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ block: 'start' })
        return
      }
      if (++tries < 40) frame = requestAnimationFrame(seek)
    }

    seek()
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash])

  return null
}
