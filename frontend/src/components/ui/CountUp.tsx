import { useCountUp } from '@/lib/animation'
import { cn } from '@/lib/cn'

/** A number that counts up the first time it scrolls into view. */
export function CountUp({
  to,
  className,
  duration,
}: {
  to: number
  className?: string
  duration?: number
}) {
  const { ref, value } = useCountUp(to, duration)
  return (
    <span ref={ref} className={cn('tnum', className)}>
      {value}
    </span>
  )
}
