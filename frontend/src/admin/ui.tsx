import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { LOCALE_TABS, type Locale, type Localized } from './client'

/* -------------------------------------------------------------------------- */
/* Text input                                                                 */
/* -------------------------------------------------------------------------- */

export function AdminField({
  label,
  value,
  onChange,
  error,
  hint,
  placeholder,
  type = 'text',
  disabled,
  multiline,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  hint?: string
  placeholder?: string
  type?: string
  disabled?: boolean
  multiline?: boolean
}) {
  const Tag = multiline ? 'textarea' : 'input'

  return (
    <label className="block">
      <span className="block text-small font-semibold text-navy-900">{label}</span>
      {hint && <span className="mt-0.5 block text-micro text-slate">{hint}</span>}
      <Tag
        // A textarea has no type attribute; passing one is ignored but noisy.
        {...(multiline ? { rows: 4 } : { type })}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        className={cn(
          'mt-1.5 block w-full rounded-sm border bg-white px-3 py-2 text-body text-navy-950',
          'focus:outline-none focus:ring-2 focus:ring-gold-500/40',
          'disabled:cursor-not-allowed disabled:bg-cream-deep disabled:text-slate',
          error ? 'border-red-500' : 'border-hair focus:border-gold-500',
        )}
      />
      {error && <span className="mt-1 block text-micro text-red-600">{error}</span>}
    </label>
  )
}

/* -------------------------------------------------------------------------- */
/* Four-language field                                                        */
/* -------------------------------------------------------------------------- */

/**
 * One value in all four languages of §3, as tabs.
 *
 * Tabs rather than four stacked boxes: a speaker biography is four paragraphs
 * of prose, and stacking them makes the form long enough that the save button
 * leaves the screen. The tab of any language that is empty or has an error is
 * marked, so an unfilled Tamil field is visible without opening it -- which is
 * exactly the mistake the API rejects, and the reason it is worth showing
 * before the round-trip.
 */
export function LocalizedFieldset({
  label,
  value,
  onChange,
  errors,
  multiline,
  hint,
}: {
  label: string
  value: Localized
  onChange: (v: Localized) => void
  /** Keyed by locale, as the API returns them ("bio.ta" -> "ta"). */
  errors?: Partial<Record<Locale, string>>
  multiline?: boolean
  hint?: string
}) {
  const [active, setActive] = useState<Locale>('en')

  return (
    <fieldset className="rounded-sm border border-hair bg-cream-deep/40 p-3">
      <legend className="px-1 text-small font-semibold text-navy-900">{label}</legend>
      {hint && <p className="mb-2 text-micro text-slate">{hint}</p>}

      <div role="tablist" className="mb-3 flex flex-wrap gap-1">
        {LOCALE_TABS.map(({ code, label: name }) => {
          const missing = !value[code]?.trim()
          const failed = Boolean(errors?.[code])
          return (
            <button
              key={code}
              type="button"
              role="tab"
              aria-selected={active === code}
              onClick={() => setActive(code)}
              className={cn(
                'rounded-sm px-2.5 py-1 text-micro font-semibold transition-colors',
                active === code
                  ? 'bg-navy-900 text-cream'
                  : 'bg-white text-navy-800 hover:bg-cream',
              )}
            >
              {name}
              {(missing || failed) && (
                <span
                  aria-label={failed ? 'has an error' : 'empty'}
                  className={cn(
                    'ml-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle',
                    failed ? 'bg-red-500' : 'bg-gold-500',
                  )}
                />
              )}
            </button>
          )
        })}
      </div>

      <AdminField
        label={LOCALE_TABS.find((t) => t.code === active)!.label}
        value={value[active] ?? ''}
        onChange={(v) => onChange({ ...value, [active]: v })}
        error={errors?.[active]}
        multiline={multiline}
      />
    </fieldset>
  )
}

/* -------------------------------------------------------------------------- */
/* Buttons, panels, messages                                                  */
/* -------------------------------------------------------------------------- */

export function AdminButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'quiet' | 'danger'
  disabled?: boolean
  className?: string
}) {
  const styles = {
    primary: 'bg-gold-500 text-navy-950 hover:bg-gold-400',
    quiet: 'border border-hair bg-white text-navy-900 hover:border-gold-500',
    danger: 'border border-red-300 bg-white text-red-700 hover:bg-red-50',
  }[variant]

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex min-h-[40px] items-center justify-center gap-2 rounded-sm px-4',
        'text-small font-semibold uppercase tracking-[0.08em] transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        styles,
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Notice({ kind, children }: { kind: 'error' | 'success'; children: ReactNode }) {
  return (
    <p
      role={kind === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-sm border-l-2 px-3 py-2 text-small',
        kind === 'error'
          ? 'border-red-500 bg-red-50 text-red-800'
          : 'border-gold-500 bg-cream-deep text-navy-900',
      )}
    >
      {children}
    </p>
  )
}

export function AdminCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-sm border border-hair bg-white p-4 shadow-card', className)}>
      {children}
    </div>
  )
}
