import { useParallax } from '@/lib/animation'
import { cn } from '@/lib/cn'

/**
 * Fills the empty margins either side of a section with a fluted-column
 * rhythm in gold hairlines, drifting slowly against the scroll.
 *
 * The gutters were flat cream, which read as unfinished rather than restrained.
 * This is the one decorative device on the page and it is deliberately the
 * building's own: the vertical flutes echo the colonnade in the banner above.
 *
 * It is masked out across the middle 48% of the width, so it never sits behind
 * the content column — cards and text keep their plain ground. The mask also
 * fades it at the top and bottom edges so it does not collide with the section
 * hairlines.
 */
export function Fluting({ className }: { className?: string }) {
  const ref = useParallax<HTMLDivElement>(0.07, 44)

  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div
        ref={ref}
        className="absolute -inset-y-24 inset-x-0"
        style={{
          // Two rhythms: a fine flute every 24px, and a heavier shaft line
          // every 144px, so the gutter has a cadence rather than a screen tone.
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(201,162,39,0.30) 0 1px, transparent 1px 24px), repeating-linear-gradient(90deg, rgba(11,33,64,0.11) 0 2px, transparent 2px 144px)',
          WebkitMaskImage:
            'linear-gradient(90deg, #000 0%, rgba(0,0,0,0.35) 16%, transparent 26%, transparent 74%, rgba(0,0,0,0.35) 84%, #000 100%), linear-gradient(180deg, transparent 0%, #000 18%, #000 82%, transparent 100%)',
          maskImage:
            'linear-gradient(90deg, #000 0%, rgba(0,0,0,0.35) 16%, transparent 26%, transparent 74%, rgba(0,0,0,0.35) 84%, #000 100%), linear-gradient(180deg, transparent 0%, #000 18%, #000 82%, transparent 100%)',
          WebkitMaskComposite: 'source-in',
          maskComposite: 'intersect',
        }}
      />
    </div>
  )
}
