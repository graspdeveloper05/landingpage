import { useCallback, useEffect, useRef, useState } from 'react'

/* ============================================================================
 * Scroll motion primitives.
 *
 * Rules everything here follows:
 *  - Only `transform` and `opacity` are animated, so nothing triggers layout.
 *  - Every scroll listener is passive and rAF-throttled; only one rAF is ever
 *    queued per handler.
 *  - Reveal observers disconnect the moment they fire.
 *  - prefers-reduced-motion short-circuits each hook into its finished state.
 * ==========================================================================*/

function prefersReduced() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Runs `fn` on scroll, at most once per animation frame. */
function onScrollFrame(fn: () => void) {
  let frame = 0
  const handler = () => {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      fn()
    })
  }
  handler()
  window.addEventListener('scroll', handler, { passive: true })
  window.addEventListener('resize', handler, { passive: true })
  return () => {
    window.removeEventListener('scroll', handler)
    window.removeEventListener('resize', handler)
    if (frame) cancelAnimationFrame(frame)
  }
}

/* -------------------------------------------------------------------------- */
/* Reveal on scroll                                                           */
/* -------------------------------------------------------------------------- */

export type RevealVariant = 'up' | 'left' | 'right' | 'scale' | 'blur' | 'mask'

/**
 * Reports when the element has first entered the viewport, so the caller can
 * apply `is-visible` through React.
 *
 * This deliberately does NOT call classList.add. The elements it drives have
 * React-controlled className attributes, so any later render of an ancestor
 * reconciles className back to its computed value and silently strips a class
 * that was added imperatively.
 *
 * That is not hypothetical. The seat count arrives from the API after mount
 * and re-renders the homepage; every block that had already revealed lost the
 * class, and with its observer long since disconnected it stayed at opacity 0
 * permanently. The chairman's portrait vanished exactly this way.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(delayMs = 0) {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (prefersReduced() || !('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }

    if (delayMs) el.style.transitionDelay = `${delayMs}ms`

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        setVisible(true)
        observer.disconnect()
      },
      // The bottom edge is pulled up by 14% of the viewport so a block starts
      // moving once it is genuinely on screen. At -60px it fired the instant a
      // single pixel cleared the bottom edge, so the 0.75s transition ran while
      // the block was still below the fold and was over before anyone scrolled
      // far enough to look at it — the animations were there and never seen.
      // Nothing revealed sits at the very bottom of the document (the footer
      // carries no Reveal), so no block can be stranded above this line.
      { threshold: 0, rootMargin: '0px 0px -14% 0px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delayMs])

  return { ref, visible }
}

/* -------------------------------------------------------------------------- */
/* Parallax                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Moves an element against the scroll while its section is on screen.
 * `speed` is a fraction of scroll distance; negative moves the other way.
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>(speed = 0.15, max = 90) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReduced()) return

    return onScrollFrame(() => {
      const rect = el.getBoundingClientRect()
      // Distance of the element's centre from the viewport's centre, so the
      // offset is zero as it passes through the middle of the screen.
      const fromCentre = rect.top + rect.height / 2 - window.innerHeight / 2
      const offset = Math.max(-max, Math.min(max, -fromCentre * speed))
      el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`
    })
  }, [speed, max])

  return ref
}

/* -------------------------------------------------------------------------- */
/* Page scroll progress                                                       */
/* -------------------------------------------------------------------------- */

/** 0 → 1 across the scrollable height of the document. */
export function useScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    return onScrollFrame(() => {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      setProgress(scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0)
    })
  }, [])

  return progress
}

/* -------------------------------------------------------------------------- */
/* Count up                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Counts from 0 to `target` once the element is on screen. Returns the ref to
 * attach and the value to render.
 */
export function useCountUp(target: number, durationMs = 1400) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(prefersReduced() ? target : 0)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (prefersReduced() || !('IntersectionObserver' in window)) {
      setValue(target)
      return
    }

    // The target can arrive after mount (seat counts load asynchronously), so
    // allow a re-run when it changes but never restart a finished count.
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || started.current) return
        started.current = true
        observer.disconnect()

        const start = performance.now()
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / durationMs)
          // easeOutCubic — fast first, settles gently on the final number.
          const eased = 1 - Math.pow(1 - t, 3)
          setValue(Math.round(target * eased))
          if (t < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      },
      { threshold: 0.4 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [target, durationMs])

  // If the count already finished and the target changes, follow it directly.
  useEffect(() => {
    if (started.current) setValue(target)
  }, [target])

  return { ref, value }
}

/* -------------------------------------------------------------------------- */
/* Draw a line as a section scrolls past                                      */
/* -------------------------------------------------------------------------- */

/**
 * Scales a vertical rule from 0 to 1 as its container passes the viewport,
 * so the programme timeline draws itself alongside the reader.
 */
export function useDrawLine<T extends HTMLElement = HTMLDivElement>() {
  const containerRef = useRef<T>(null)
  const lineRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const line = lineRef.current
    if (!container || !line) return

    if (prefersReduced()) {
      line.style.transform = 'scaleY(1)'
      return
    }

    return onScrollFrame(() => {
      const rect = container.getBoundingClientRect()
      const start = window.innerHeight * 0.85
      const distance = rect.height + start - window.innerHeight * 0.3
      const travelled = start - rect.top
      const t = Math.max(0, Math.min(1, travelled / distance))
      line.style.transform = `scaleY(${t.toFixed(3)})`
    })
  }, [])

  return { containerRef, lineRef }
}

/**
 * Counts how many timeline nodes have passed the reading line, so the rail can
 * show what has already been crossed instead of a row of identical outlines.
 * Shares its threshold with the drawn line above, so the fill and the nodes
 * agree about where "here" is.
 */
export function usePassedNodes(count: number) {
  const nodes = useRef<(HTMLElement | null)[]>([])
  const [passed, setPassed] = useState(0)

  const setNode = useCallback(
    (i: number) => (el: HTMLElement | null) => {
      nodes.current[i] = el
    },
    [],
  )

  useEffect(() => {
    if (prefersReduced()) {
      setPassed(count)
      return
    }

    return onScrollFrame(() => {
      const line = window.innerHeight * 0.62
      let n = 0
      for (let i = 0; i < count; i += 1) {
        const el = nodes.current[i]
        if (el && el.getBoundingClientRect().top <= line) n = i + 1
      }
      setPassed((prev) => (prev === n ? prev : n))
    })
  }, [count])

  return { setNode, passed }
}

/* -------------------------------------------------------------------------- */
/* Scrollspy                                                                  */
/* -------------------------------------------------------------------------- */

/** Returns the id of the section currently under the header. */
export function useScrollSpy(ids: string[], offset = 120) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (ids.length === 0) return

    return onScrollFrame(() => {
      let current: string | null = null
      for (const id of ids) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top - offset <= 0) current = id
      }
      setActive(current)
    })
  }, [ids, offset])

  return active
}

/* -------------------------------------------------------------------------- */
/* Scrolled-past-threshold flag                                               */
/* -------------------------------------------------------------------------- */

export function useScrolledPast(threshold: number) {
  const [past, setPast] = useState(false)
  useEffect(() => onScrollFrame(() => setPast(window.scrollY > threshold)), [threshold])
  return past
}

/* -------------------------------------------------------------------------- */
/* Smooth scroll to top                                                       */
/* -------------------------------------------------------------------------- */

export function useScrollToTop() {
  return useCallback(() => {
    window.scrollTo({ top: 0, behavior: prefersReduced() ? 'auto' : 'smooth' })
  }, [])
}
