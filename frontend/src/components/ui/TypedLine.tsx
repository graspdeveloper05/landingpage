import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/cn'

/** Split text into what a reader sees as single letters. */
function graphemes(text: string): string[] {
  /*
   * Not text.split('') and not Array.from. A Tamil letter such as "லை" or
   * "க்" is a base consonant plus one or two combining marks -- several code
   * points drawn as one glyph. Typed a code point at a time, the base would
   * appear alone and then change shape as its marks arrived, which looks like
   * a rendering fault. Intl.Segmenter splits on the letters themselves.
   */
  // Typed locally: the project's TypeScript lib predates Intl.Segmenter,
  // though every browser the site supports has shipped it.
  const Segmenter = (Intl as unknown as {
    Segmenter?: new (
      locale: string | undefined,
      options: { granularity: 'grapheme' },
    ) => { segment(input: string): Iterable<{ segment: string }> }
  }).Segmenter
  if (Segmenter) {
    return Array.from(new Segmenter(undefined, { granularity: 'grapheme' }).segment(text), (s) => s.segment)
  }
  return Array.from(text)
}

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * A line that types itself out, letter by letter, behind a blinking cursor.
 *
 * Three things keep it from costing anything:
 *
 *  - No layout shift. The letters not yet typed are already there, just
 *    invisible, so the line holds its full width from the first frame and
 *    nothing beside or below it moves while it types.
 *  - The whole line is always in the page: typed letters plus the invisible
 *    remainder make exactly the text once, so search engines read it once.
 *    Screen readers are given it by the heading's own label -- see Hero --
 *    so they never hear a half-typed line.
 *  - Reduced motion shows the finished line and no cursor.
 *
 * It restarts when the text changes, so switching language types the new
 * line rather than swapping it in unannounced.
 */
export function TypedLine({
  text,
  className,
  startDelay = 700,
  speed = 80,
}: {
  text: string
  className?: string
  /** Wait before the first letter, so the line above has settled first. */
  startDelay?: number
  /** Milliseconds per letter. */
  speed?: number
}) {
  const letters = useMemo(() => graphemes(text), [text])
  const [count, setCount] = useState(() => (prefersReduced() ? letters.length : 0))
  // 'typing' -> 'resting' (cursor blinks a moment) -> 'done' (cursor gone)
  const [phase, setPhase] = useState<'typing' | 'resting' | 'done'>(() =>
    prefersReduced() ? 'done' : 'typing',
  )

  useEffect(() => {
    if (prefersReduced()) {
      setCount(letters.length)
      setPhase('done')
      return
    }

    setCount(0)
    setPhase('typing')

    const timers: number[] = []
    letters.forEach((_, i) => {
      // A little unevenness reads as typing; a metronome reads as a machine.
      const jitter = (i * 37) % 3 === 0 ? speed * 0.4 : 0
      timers.push(window.setTimeout(() => setCount(i + 1), startDelay + i * speed + jitter))
    })
    const end = startDelay + letters.length * speed + speed
    timers.push(window.setTimeout(() => setPhase('resting'), end))
    // Blinks for a moment at the end, then leaves the finished line alone.
    timers.push(window.setTimeout(() => setPhase('done'), end + 1800))

    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [letters, startDelay, speed])

  return (
    <span className={cn('relative', className)}>
      <span>
        {letters.slice(0, count).join('')}
        {phase !== 'done' && (
          <span
            className={cn(
              'typed-caret',
              // Solid while typing, blinking once it has stopped.
              phase === 'resting' && 'typed-caret--blink',
            )}
          />
        )}
        <span className="invisible">{letters.slice(count).join('')}</span>
      </span>
    </span>
  )
}
