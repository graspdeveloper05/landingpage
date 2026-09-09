import type { ElementType, ReactNode } from 'react'
import { useReveal, type RevealVariant } from '@/lib/animation'
import { cn } from '@/lib/cn'

const VARIANTS: Record<RevealVariant, string> = {
  up: '',
  left: 'reveal-left',
  right: 'reveal-right',
  scale: 'reveal-scale',
  blur: 'reveal-blur',
  mask: 'reveal-mask',
}

/** Wraps children in the scroll-triggered reveal. */
export function Reveal({
  children,
  delay = 0,
  variant = 'up',
  as: Tag = 'div',
  className,
}: {
  children: ReactNode
  delay?: number
  variant?: RevealVariant
  as?: ElementType
  className?: string
}) {
  const { ref, visible } = useReveal<HTMLDivElement>(delay)
  return (
    <Tag
      ref={ref}
      className={cn('reveal', VARIANTS[variant], visible && 'is-visible', className)}
    >
      {children}
    </Tag>
  )
}

/**
 * A headline whose lines rise out from behind their own mask, one after the
 * next. Each entry in `lines` becomes one masked row.
 */
export function RevealLines({
  lines,
  className,
  lineClassName,
  stagger = 110,
  as: Tag = 'span',
}: {
  lines: { text: string; className?: string }[]
  className?: string
  lineClassName?: string
  stagger?: number
  as?: ElementType
}) {
  return (
    <Tag className={className}>
      {lines.map((line, i) => (
        <MaskedLine key={line.text} delay={i * stagger} className={lineClassName}>
          <span className={line.className}>{line.text}</span>
        </MaskedLine>
      ))}
    </Tag>
  )
}

function MaskedLine({
  children,
  delay,
  className,
}: {
  children: ReactNode
  delay: number
  className?: string
}) {
  const { ref, visible } = useReveal<HTMLSpanElement>(delay)
  return (
    <span ref={ref} className={cn('line-mask', visible && 'is-visible', className)}>
      {children}
    </span>
  )
}
