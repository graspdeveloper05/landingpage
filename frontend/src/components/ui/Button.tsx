import { Link } from 'react-router-dom'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

const base =
  'btn-sheen inline-flex min-h-[50px] items-center justify-center gap-2.5 px-8 text-small ' +
  'font-semibold uppercase tracking-[0.09em] transition-all duration-300 ease-gentle ' +
  'disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0'

const variants = {
  gold: 'bg-gold-500 text-navy-950 hover:-translate-y-0.5 hover:bg-gold-400 hover:shadow-cardHover',
  outlineGold: 'border border-gold-500 text-gold-500 hover:-translate-y-0.5 hover:bg-gold-500 hover:text-navy-950',
  outlineNavy: 'border border-navy-900/25 text-navy-900 hover:-translate-y-0.5 hover:bg-navy-900 hover:text-cream',
} as const

type Variant = keyof typeof variants

const Arrow = () => (
  <svg width="15" height="9" viewBox="0 0 15 9" aria-hidden fill="none" className="shrink-0">
    <path d="M0 4.5h13M9.5 1l3.5 3.5L9.5 8" stroke="currentColor" strokeWidth="1.3" />
  </svg>
)

export function Button({
  variant = 'gold',
  withArrow,
  className,
  children,
  ...props
}: ComponentProps<'button'> & { variant?: Variant; withArrow?: boolean }) {
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
      {withArrow && <Arrow />}
    </button>
  )
}

export function ButtonLink({
  to,
  href,
  variant = 'gold',
  withArrow,
  className,
  children,
}: {
  variant?: Variant
  withArrow?: boolean
  className?: string
  children: ReactNode
} & (
  | { to: string; href?: never }
  /**
   * An address off this site -- registration, since it moved to Google
   * Forms. Opens in a new tab so the visitor keeps their place here, with
   * `noopener` so the other page cannot reach back into this one.
   */
  | { href: string; to?: never }
)) {
  const classes = cn(base, variants[variant], className)

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
        {withArrow && <Arrow />}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    )
  }

  return (
    <Link to={to!} className={classes}>
      {children}
      {withArrow && <Arrow />}
    </Link>
  )
}
