import { useEffect, useRef, type ComponentProps } from 'react'
import { cn } from '@/lib/cn'

/**
 * An image that resolves out of a blur once it has decoded, so slow
 * connections get a soft fade rather than a hard pop.
 */
export function SmartImage({ className, ...props }: ComponentProps<'img'>) {
  const ref = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (el.complete) {
      el.classList.add('is-loaded')
      return
    }
    const done = () => el.classList.add('is-loaded')
    el.addEventListener('load', done)
    // A failed image should not stay permanently blurred.
    el.addEventListener('error', done)
    return () => {
      el.removeEventListener('load', done)
      el.removeEventListener('error', done)
    }
  }, [])

  return <img ref={ref} className={cn('img-load', className)} {...props} />
}
