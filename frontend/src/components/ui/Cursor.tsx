import { useEffect, useRef, useState } from 'react'

/**
 * A pointer treatment for the public site: a small solid dot that tracks
 * exactly, and a gold ring that follows a beat behind and opens over anything
 * clickable.
 *
 * Everything here is opt-in and reversible. If any of the conditions below
 * fail, nothing renders, no class is added to <html>, and the browser's own
 * cursor is untouched — which is also what happens if this component is
 * deleted outright.
 *
 * It renders only when ALL of these hold:
 *
 *  - the device has a fine pointer that can hover. A phone has neither, and
 *    §11 expects most visitors to arrive from WhatsApp, on a phone.
 *  - the visitor has not asked for reduced motion.
 *  - the pointer is not over a text field. Replacing the I-beam would make
 *    the RSVP form harder to use, and §9 calls registration essential.
 *
 * Mounted on the public site only. The admin panel is a tool the organising
 * team works in for an hour at a time, and a decorated pointer there would be
 * a nuisance rather than a flourish.
 */

/** How much of the remaining distance the ring closes each frame. */
const EASE = 0.19

/** Elements that should open the ring and read as clickable. */
const INTERACTIVE = 'a, button, [role="button"], summary, label, select, [data-cursor="hover"]'

/** Elements where the browser's own cursor is the right answer. */
const TEXT_ENTRY = 'input:not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea'

export function Cursor() {
  // Held as state because it decides whether to render at all, and it can only
  // be known in the browser — rendering it on the server would be a guess.
  const [enabled, setEnabled] = useState(false)

  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const still = window.matchMedia('(prefers-reduced-motion: reduce)')

    const decide = () => setEnabled(fine.matches && !still.matches)
    decide()

    // Re-checked on change: a tablet with a keyboard attached and detached
    // flips `pointer: fine`, and someone turning on reduced motion should see
    // it take effect without reloading.
    fine.addEventListener('change', decide)
    still.addEventListener('change', decide)
    return () => {
      fine.removeEventListener('change', decide)
      still.removeEventListener('change', decide)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    const root = document.documentElement
    root.classList.add('cursor-custom')

    // Target is where the pointer is; current is where the ring has got to.
    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 2
    let ringX = targetX
    let ringY = targetY
    let frame = 0
    let visible = false

    const show = () => {
      if (visible) return
      visible = true
      dot.style.opacity = '1'
      ring.style.opacity = '1'
    }

    const hide = () => {
      visible = false
      dot.style.opacity = '0'
      ring.style.opacity = '0'
    }

    const onMove = (e: PointerEvent) => {
      // Only a real mouse or pen. A touch that lands on the page also fires
      // pointermove, and the ring would be left stranded where the finger was.
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return

      targetX = e.clientX
      targetY = e.clientY

      const el = e.target as Element | null

      // Over a text field the browser's I-beam is more useful than anything
      // decorative, so the custom pointer steps aside entirely.
      if (el?.closest?.(TEXT_ENTRY)) {
        root.classList.add('cursor-native')
        hide()
        return
      }
      root.classList.remove('cursor-native')
      show()

      const over = Boolean(el?.closest?.(INTERACTIVE))
      ring.classList.toggle('is-over', over)
    }

    const onDown = () => ring.classList.add('is-down')
    const onUp = () => ring.classList.remove('is-down')

    // The pointer leaving the window, or a tab losing focus mid-drag, would
    // otherwise leave both marks frozen at the last known position.
    const onLeave = (e: PointerEvent) => {
      if (!e.relatedTarget) hide()
    }

    const tick = () => {
      ringX += (targetX - ringX) * EASE
      ringY += (targetY - ringY) * EASE

      // translate3d, and nothing that reads layout, so this stays on the
      // compositor and cannot cause a reflow sixty times a second.
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    window.addEventListener('pointerout', onLeave, { passive: true })
    window.addEventListener('blur', hide)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointerout', onLeave)
      window.removeEventListener('blur', hide)
      // The classes come off on unmount, so navigating to /admin cannot leave
      // the panel with a hidden system cursor and no custom one drawing it.
      root.classList.remove('cursor-custom', 'cursor-native')
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      <div ref={ringRef} aria-hidden className="cursor-ring" />
      <div ref={dotRef} aria-hidden className="cursor-dot" />
    </>
  )
}
