import { Ornament } from './Ornament'
import { Reveal } from './Reveal'
import { cn } from '@/lib/cn'

/** Centred heading with the gold ornament, as every section uses in the concept. */
export function SectionHeading({
  title,
  sub,
  tone = 'dark',
  className,
}: {
  title: string
  sub?: string
  tone?: 'dark' | 'light'
  className?: string
}) {
  return (
    <Reveal className={cn('text-center', className)}>
      <h2
        className={cn(
          'text-section font-semibold uppercase tracking-[0.06em]',
          tone === 'dark' ? 'text-navy-900' : 'text-cream',
        )}
      >
        {title}
      </h2>
      {sub && (
        <p className={cn('mt-3 text-lead', tone === 'dark' ? 'text-slate' : 'text-cream/75')}>
          {sub}
        </p>
      )}
      <Ornament className="mt-5" tone={tone === 'dark' ? 'gold' : 'light'} />
    </Reveal>
  )
}
