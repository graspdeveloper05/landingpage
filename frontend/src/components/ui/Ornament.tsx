import { cn } from '@/lib/cn'

/** The gold rule-and-diamond divider used under headings throughout the concept. */
export function Ornament({ className, tone = 'gold' }: { className?: string; tone?: 'gold' | 'light' }) {
  const line = tone === 'gold' ? 'bg-gold-500' : 'bg-gold-300'
  return (
    <span aria-hidden className={cn('flex items-center justify-center gap-2.5', className)}>
      <span className={cn('block h-px w-10 sm:w-16', line, 'opacity-60')} />
      <span className={cn('block h-2 w-2 rotate-45', line)} />
      <span className={cn('block h-px w-4', line)} />
      <span className={cn('block h-1.5 w-1.5 rotate-45', line, 'opacity-70')} />
      <span className={cn('block h-px w-10 sm:w-16', line, 'opacity-60')} />
    </span>
  )
}
