import { useId, type ComponentProps } from 'react'
import { cn } from '@/lib/cn'

/**
 * Form field on the navy RSVP panel. Errors say what to fix, and are wired to
 * the input with aria-describedby.
 */
export function Field({
  label,
  error,
  hint,
  optionalLabel,
  className,
  ...props
}: ComponentProps<'input'> & {
  label: string
  error?: string
  hint?: string
  optionalLabel?: string
}) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ')

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="flex items-baseline justify-between gap-3 text-micro font-medium uppercase tracking-[0.08em] text-cream/70"
      >
        <span>{label}</span>
        {optionalLabel && <span className="normal-case tracking-normal text-cream/65">{optionalLabel}</span>}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn(
          'mt-2 block min-h-[48px] w-full rounded-sm border bg-cream/95 px-4 text-body text-navy-950',
          'transition-colors duration-200 placeholder:text-slate/50',
          'focus:bg-white',
          error ? 'border-red-400 bg-red-50/95' : 'border-transparent hover:border-gold-300 focus:border-gold-500',
        )}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-micro text-cream/65">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 flex items-center gap-1.5 text-micro text-gold-300">
          <span aria-hidden className="block h-1.5 w-1.5 rotate-45 bg-gold-400" />
          {error}
        </p>
      )}
    </div>
  )
}
