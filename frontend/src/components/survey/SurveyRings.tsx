import { useEffect, useMemo, useRef, type CSSProperties, type PointerEvent } from 'react'

/**
 * The gold rings in the attendee form's masthead: a dialogue as voices
 * spreading outward. Two dashed rings turn slowly and a wave leaves the
 * centre every few seconds. With a page count, the outer ring fills in gold
 * from the top as the pages go by, and a wave goes out on each new page.
 *
 * The rings sit in three layers that lean toward the mouse by different
 * amounts (see useLean); the styles are in index.css under "The attendee
 * form".
 */
export function SurveyRings({ progress }: { progress?: { at: number; of: number } }) {
  const share = progress ? (progress.at + 1) / progress.of : 0
  const depth = (px: number) => ({ '--d': `${px}px` }) as CSSProperties

  return (
    <svg viewBox="-20 -20 440 440" fill="none" className="h-full w-full overflow-visible">
      <defs>
        <radialGradient id="sv-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C9A227" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#C9A227" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Far layer: the outer rings and the waves, barely moving. */}
      <g className="sv-depth" style={depth(6)}>
        <circle cx="200" cy="200" r="200" stroke="#C9A227" strokeOpacity="0.16" />
        <circle
          className="sv-turn sv-turn--back"
          cx="200"
          cy="200"
          r="170"
          stroke="#C9A227"
          strokeOpacity="0.35"
          strokeDasharray="2 10"
        />
        {/* A little apart, so one is always on its way out. */}
        {[0, 2.3, 4.6].map((delay) => (
          <circle
            key={delay}
            className="sv-wave"
            style={{ animationDelay: `${delay}s` }}
            cx="200"
            cy="200"
            r="170"
            stroke="#E8C462"
            strokeOpacity="0.45"
          />
        ))}
      </g>

      {/* Middle layer: one bright arc travelling round. */}
      <g className="sv-depth" style={depth(12)}>
        <circle cx="200" cy="200" r="130" stroke="#C9A227" strokeOpacity="0.28" />
        <circle
          className="sv-turn"
          cx="200"
          cy="200"
          r="130"
          stroke="#E8C462"
          strokeOpacity="0.75"
          strokeWidth="1.5"
          strokeDasharray="40 160 6 610"
          strokeLinecap="round"
        />
      </g>

      {/* Near layer: the centre, leaning most. */}
      <g className="sv-depth" style={depth(20)}>
        <circle cx="200" cy="200" r="120" fill="url(#sv-core)" />
        <circle cx="200" cy="200" r="88" stroke="#C9A227" strokeOpacity="0.4" />
        <circle
          className="sv-turn"
          style={{ animationDuration: '60s' }}
          cx="200"
          cy="200"
          r="60"
          stroke="#C9A227"
          strokeOpacity="0.55"
          strokeDasharray="1 7"
        />
        <circle cx="200" cy="200" r="3.5" fill="#E8C462" />
      </g>

      {progress && (
        <g className="sv-depth" style={depth(6)}>
          <circle
            key={`wave-${progress.at}`}
            className="sv-wave sv-wave--once"
            cx="200"
            cy="200"
            r="200"
            stroke="#E8C462"
            strokeWidth="1.5"
          />
          <circle
            cx="200"
            cy="200"
            r="200"
            stroke="#C9A227"
            strokeWidth="2.5"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - share}
            transform="rotate(-90 200 200)"
            className="transition-[stroke-dashoffset] duration-1000 ease-gentle"
          />
          {/* The point at the head of the arc, carried round with it. */}
          <g
            style={{ transform: `rotate(${share * 360}deg)`, transformOrigin: '200px 200px' }}
            className="transition-transform duration-1000 ease-gentle"
          >
            <circle cx="200" cy="0" r="9" fill="#C9A227" fillOpacity="0.22" />
            <circle cx="200" cy="0" r="4.5" fill="#E8C462" />
          </g>
        </g>
      )}
    </svg>
  )
}

/**
 * Where the mouse is over an element, as CSS variables on it: --sv-px and
 * --sv-py in pixels (for the light that follows it), --sv-x and --sv-y from
 * -1 to 1 about the centre (for the rings' lean). Written straight to the
 * element, so React does not render on every move. A finger, or anyone who
 * has asked for less motion, gets the still version.
 */
export function useLean<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const frame = useRef(0)
  const follows = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const onPointerMove = (e: PointerEvent<T>) => {
    const el = ref.current
    if (!follows || !el || e.pointerType !== 'mouse') return
    const { left, top, width, height } = el.getBoundingClientRect()
    const px = e.clientX - left
    const py = e.clientY - top
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty('--sv-px', `${px}px`)
      el.style.setProperty('--sv-py', `${py}px`)
      el.style.setProperty('--sv-x', ((px / width) * 2 - 1).toFixed(3))
      el.style.setProperty('--sv-y', ((py / height) * 2 - 1).toFixed(3))
    })
  }
  const onPointerLeave = () => {
    cancelAnimationFrame(frame.current)
    ref.current?.style.setProperty('--sv-x', '0')
    ref.current?.style.setProperty('--sv-y', '0')
  }

  return { ref, onPointerMove, onPointerLeave }
}
