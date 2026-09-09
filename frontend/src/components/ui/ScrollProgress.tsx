import { useScrollProgress } from '@/lib/animation'

/** Gold rule across the top of the page tracking how far down the reader is. */
export function ScrollProgress() {
  const progress = useScrollProgress()

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[55] h-[2px] bg-transparent"
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-gold-600 via-gold-400 to-gold-300"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  )
}
