import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/cn'
import { LOCALE_TABS, type Locale, type Localized } from './client'

/* -------------------------------------------------------------------------- */
/* Text input                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Eye for the password reveal. `off` draws the struck-through variant, shown
 * while the password is visible — the icon says what clicking will do next,
 * which is the convention every browser and password manager follows.
 */
function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M1.7 10S4.7 4.6 10 4.6 18.3 10 18.3 10 15.3 15.4 10 15.4 1.7 10 1.7 10Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.3" />
      {off && <path d="M3.5 16.5 16.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />}
    </svg>
  )
}

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

  // A password field gets a reveal toggle. Admin passwords here cannot be
  // recovered — only reissued — so someone locked out by a typo they cannot
  // see has to go and ask for a new one. Being able to check what was typed
  // is the difference between a second and a support request.
  const isPassword = type === 'password' && !multiline
  const [revealed, setRevealed] = useState(false)
  const inputType = isPassword && revealed ? 'text' : type

  return (
    /*
     * A column with the input pushed to the bottom.
     *
     * One constraint comes with this: the container must size to its content.
     * `h-full` resolves against whatever height the parent is given, so a
     * card stretched by a taller neighbour in a grid row makes the spacer
     * below absorb all of it, and every input in that card drops to the
     * bottom behind a hand-sized gap. If fields need to sit beside a tall
     * panel, put them in a column that sizes itself -- see the note on the
     * Event form's grid.
     *
     * Fields sit side by side in a grid, and their hints are different
     * lengths: "Used by search engines" fits one line, "Pick a time. Visitors
     * see the wording you set below." wraps to two. With everything in normal
     * flow that pushed one input a line lower than its neighbour, and the row
     * read as crooked. `h-full` takes the grid's stretched height and
     * `mt-auto` drops the input to the bottom of it, so inputs line up however
     * long the labels above them run.
     */
    <label className="flex h-full flex-col">
      <span className="block text-[0.78rem] font-semibold text-navy-900">{label}</span>
      {hint && <span className="mt-0.5 block text-[0.7rem] leading-snug text-slate">{hint}</span>}
      {/* Takes up the slack so the input lands at the bottom of the row.
          A margin-auto on the input itself would fight the mt-1 that gives it
          its gap from the label -- two margin-top utilities on one element,
          and which one wins depends on stylesheet order rather than intent. */}
      <span aria-hidden className="grow" />
      <span className="relative mt-1 block">
        <Tag
          // A textarea has no type attribute; passing one is ignored but noisy.
          {...(multiline ? { rows: 4 } : { type: inputType })}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          className={cn(
            'block w-full rounded-sm border bg-white px-2.5 py-1.5 text-[0.85rem] text-navy-950',
            'focus:outline-none focus:ring-2 focus:ring-gold-500/35',
            'disabled:cursor-not-allowed disabled:bg-[#F1F1EF] disabled:text-slate',
            error ? 'border-red-400' : 'border-[#DDDCD8] focus:border-gold-500',
            // Room for the toggle, so a long password does not run under it.
            isPassword && 'pr-9',
          )}
        />
        {isPassword && (
          <button
            type="button"
            // Inside a <form>, a button with no type submits it — here that
            // would post a half-typed password on the first click.
            onClick={() => setRevealed((v) => !v)}
            // Keeps focus in the input, so revealing does not lose the caret
            // position mid-word.
            onMouseDown={(e) => e.preventDefault()}
            disabled={disabled}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            aria-pressed={revealed}
            className={cn(
              'absolute right-0 top-0 grid h-full w-9 place-items-center rounded-r-sm text-slate',
              'transition-colors hover:text-navy-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/35',
              'disabled:cursor-not-allowed disabled:text-[#B9B8B4]',
            )}
          >
            <EyeIcon off={revealed} />
          </button>
        )}
      </span>
      {error && <span className="mt-1 block text-[0.7rem] text-red-600">{error}</span>}
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
    <fieldset className="rounded-sm border border-[#DDDCD8] bg-[#FAFAF8] p-3">
      <legend className="px-1 text-[0.78rem] font-semibold text-navy-900">{label}</legend>
      {hint && <p className="mb-2 text-[0.7rem] text-slate">{hint}</p>}

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
                'rounded-sm border px-2 py-1 text-[0.7rem] font-semibold transition-colors',
                active === code
                  ? 'border-navy-900 bg-navy-900 text-cream'
                  : 'border-[#DDDCD8] bg-white text-navy-800 hover:border-gold-500',
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
    primary: 'bg-navy-900 text-cream hover:bg-navy-800',
    quiet: 'border border-[#DDDCD8] bg-white text-navy-900 hover:border-navy-600',
    danger: 'border border-red-200 bg-white text-red-700 hover:border-red-400 hover:bg-red-50',
  }[variant]

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      /*
        Small on purpose. A button that grows 5% on hover is a landing-page
        gesture; in a panel where every row carries Edit and Remove, the same
        move repeated across a list reads as the page twitching. 1.5% and a
        press that goes under 1 is enough to feel answered.

        Skipped entirely while disabled — a control that reacts to the pointer
        but does nothing when clicked is worse than one that sits still.
      */
      whileHover={disabled ? undefined : { scale: 1.015 }}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      className={cn(
        'inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-sm px-3',
        'text-[0.78rem] font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-45',
        styles,
        className,
      )}
    >
      {children}
    </motion.button>
  )
}

export function Notice({ kind, children }: { kind: 'error' | 'success'; children: ReactNode }) {
  return (
    <p
      role={kind === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-sm border-l-2 px-3 py-1.5 text-[0.78rem]',
        kind === 'error'
          ? 'border-red-500 bg-red-50 text-red-800'
          : 'border-green-600 bg-green-50 text-green-900',
      )}
    >
      {children}
    </p>
  )
}

export function AdminCard({
  children,
  className,
  /** Set on rows in a list, which respond to the pointer. Static panels do not. */
  interactive,
}: {
  children: ReactNode
  className?: string
  interactive?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-sm border border-[#DDDCD8] bg-white p-4',
        // A CSS transition rather than motion: a list can hold thirty of
        // these, and thirty components subscribing to pointer state to move
        // a border colour is work the compositor already does for free.
        interactive &&
          'transition-[border-color,box-shadow] duration-200 hover:border-navy-600/40 hover:shadow-[0_2px_10px_-4px_rgba(11,33,64,0.25)]',
        className,
      )}
    >
      {children}
    </div>
  )
}
