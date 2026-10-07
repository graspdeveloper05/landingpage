import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'

export interface FormProgress {
  /** The current page, from 0. */
  at: number
  /** What each page is called: its section, or "Part 2". */
  steps: string[]
  /** The current page's introduction, if its section has one. */
  intro: string
}

/** A description short enough to sit under the title in the page banner. */
export const BANNER_TEXT = 140

/**
 * Under the page banner (PageHero, as on Speakers and About), the form's
 * own card: on the first page a description too long for the banner and
 * the form's length; on a form of several parts, the steps with the current
 * one marked; and the current section's introduction. Nothing to say, no
 * card.
 */
export function FormIntro({
  description,
  meta,
  progress,
}: {
  /** Shown on the first page only. */
  description?: string
  /** "3 questions · about 1 min", on the first page only. */
  meta?: string
  progress?: FormProgress
}) {
  const first = !progress || progress.at === 0
  const steps = !!progress && progress.steps.length > 1
  const lead = first && (description || meta)
  if (!lead && !steps && !progress?.intro) return null

  return (
    <div className="anim-rise relative rounded-sm border border-hair bg-white shadow-[0_24px_60px_-28px_rgba(10,22,40,0.45)]">
      {/* The site's navy, as the client asked: one colour for the forms. */}
      <span aria-hidden className="block h-1.5 rounded-t-sm bg-navy-900" />
      <div className="px-5 py-5 sm:px-8 sm:py-6">
        {first && description && <Introduction text={description} />}
        {first && meta && (
          <p className={cn('text-small font-semibold text-gold-700', description && 'mt-3')}>
            {meta}
          </p>
        )}

        {steps && (
          <div className={cn(lead && 'mt-5 border-t border-hair pt-5')}>
            <Stepper at={progress.at} steps={progress.steps} />
          </div>
        )}

        {progress?.intro && (
          <p
            key={`${progress.at}-${progress.intro}`}
            className={cn(
              'anim-fade border-l-2 border-gold-500 pl-4 text-body text-navy-900/80',
              (lead || steps) && 'mt-5',
            )}
          >
            {progress.intro}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * The form's introduction, as the client's mock lays it out. Written on
 * several lines in the panel, the first line is a heading in the display
 * serif and the rest the paragraph under it: "Your views on Malaysia's
 * shared future" over "Help shape the conversation…". On one line, it is
 * simply the paragraph.
 */
function Introduction({ text }: { text: string }) {
  const [first, ...rest] = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (rest.length === 0) {
    return <p className="max-w-2xl text-lead leading-relaxed text-navy-900/85">{first}</p>
  }
  return (
    <div className="max-w-2xl">
      <span aria-hidden className="block h-[3px] w-10 bg-gold-500" />
      <p className="mt-4 font-display text-[1.45rem] leading-snug text-navy-950 sm:text-[1.7rem]">
        {first}
      </p>
      {rest.map((line, i) => (
        <p key={i} className="mt-3 text-body leading-relaxed text-slate">
          {line}
        </p>
      ))}
    </div>
  )
}

/**
 * The parts of the form, left to right: done ones ticked in gold, the
 * current one ringed in gold with a slow halo, the rest waiting. A gold line fills
 * along behind them. On a phone, where the names will not fit side by side,
 * the current step's name and "Step 2 of 4" stand in for the row.
 */
function Stepper({ at, steps }: { at: number; steps: string[] }) {
  const { t } = useI18n()
  const n = steps.length
  // The line runs between the first and last circles' centres.
  const edge = 50 / n
  const filled = n > 1 ? (at / (n - 1)) * (100 - 2 * edge) : 0

  return (
    <div>
      <p className="sr-only">
        {t('survey.page', { page: at + 1, pages: n })}: {steps[at]}
      </p>

      {/* Phone: the current step, with a bar. */}
      <div aria-hidden className="sm:hidden">
        <p className="flex items-baseline justify-between gap-3">
          <span key={at} className="anim-fade font-semibold text-navy-950">
            {steps[at]}
          </span>
          <span className="tnum shrink-0 text-micro font-semibold text-slate">
            {t('survey.page', { page: at + 1, pages: n })}
          </span>
        </p>
        <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-hair">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-[width] duration-700 ease-gentle"
            style={{ width: `${((at + 1) / n) * 100}%` }}
          />
        </div>
      </div>

      {/* Wider: every step by name. */}
      <ol
        aria-hidden
        className="relative hidden sm:grid"
        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
      >
        <span
          className="absolute top-[13px] h-[2px] bg-hair"
          style={{ left: `${edge}%`, right: `${edge}%` }}
        />
        <span
          className="absolute top-[13px] h-[2px] bg-gold-500 transition-[width] duration-700 ease-gentle"
          style={{ left: `${edge}%`, width: `${filled}%` }}
        />
        {steps.map((name, i) => {
          const done = i < at
          const now = i === at
          return (
            <li key={i} className="relative flex min-w-0 flex-col items-center px-1 text-center">
              <span
                className={cn(
                  'relative grid h-7 w-7 place-items-center rounded-full border-2 text-micro font-bold transition-colors duration-500',
                  done && 'border-gold-500 bg-gold-500 text-white',
                  now &&
                    'sv-head border-gold-500 bg-white text-gold-700 shadow-[0_0_0_4px_rgba(201,162,39,0.15)]',
                  !done && !now && 'border-hair bg-white text-slate',
                )}
              >
                {done ? (
                  <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                    <path
                      d="M3 8.5l3 3 7-7"
                      pathLength={1}
                      className="sv-draw"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span className="tnum">{i + 1}</span>
                )}
              </span>
              <span
                title={name}
                className={cn(
                  'mt-2 block w-full truncate text-micro transition-colors duration-500',
                  now ? 'font-semibold text-gold-700' : done ? 'text-gold-700' : 'text-slate',
                )}
              >
                {name}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
