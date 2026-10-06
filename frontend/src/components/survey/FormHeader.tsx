import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'

/**
 * The top of a form, as Google and Microsoft Forms lay it out: a short navy
 * band with Seri Negara drawn into it, and the form's own white card
 * overlapping the band's lower edge. The card carries the title, the
 * introduction on the first page, and, for a form of several parts, the
 * steps with the current one marked.
 */
export function FormBand() {
  const { t } = useI18n()
  return (
    <section className="relative isolate overflow-hidden bg-navy-950 text-cream">
      {/* The building, drawn in pale gold lines on the navy, drifting slowly. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <picture>
          <source srcSet="/scenes/heritage.webp" type="image/webp" />
          <img
            src="/scenes/heritage.jpg"
            alt=""
            className="sv-heritage anim-pan absolute -right-[8%] top-[-12%] h-[150%] w-auto max-w-none sm:right-[2%] lg:right-[6%]"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/85 to-navy-950/30" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-navy-950 to-transparent" />
      </div>

      <div className="shell pb-32 pt-8 sm:pb-36 sm:pt-10">
        <div className="anim-fade mx-auto flex max-w-3xl items-center gap-3">
          <picture>
            <source srcSet="/brand/emblem-gold.webp" type="image/webp" />
            <img src="/brand/emblem-gold.png" alt="" aria-hidden className="h-9 w-auto sm:h-10" />
          </picture>
          <span className="h-7 w-px bg-gold-500/40" aria-hidden />
          <span className="text-small font-semibold tracking-[0.04em] text-gold-400">
            {t('survey.brand')}
          </span>
        </div>
      </div>
    </section>
  )
}

export interface FormProgress {
  /** The current page, from 0. */
  at: number
  /** What each page is called: its section, or "Part 2". */
  steps: string[]
  /** The current page's introduction, if its section has one. */
  intro: string
}

export function FormCard({
  title,
  description,
  meta,
  progress,
  children,
}: {
  title: string
  /** Shown on the first page only. */
  description?: string
  /** "3 questions · about 1 min". */
  meta?: string
  progress?: FormProgress
  children?: React.ReactNode
}) {
  const first = !progress || progress.at === 0

  return (
    <div className="anim-rise relative -mt-24 overflow-hidden rounded-sm border border-hair bg-white shadow-[0_24px_60px_-28px_rgba(10,22,40,0.45)] sm:-mt-28">
      <span
        aria-hidden
        className="block h-1.5 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600"
      />
      <div className="px-5 pb-6 pt-6 sm:px-10 sm:pb-8 sm:pt-9">
        <h1 className="font-display text-[1.9rem] font-medium leading-[1.12] text-navy-950 sm:text-[2.6rem]">
          {title}
        </h1>
        {first && description && (
          <p className="mt-3 max-w-2xl text-lead text-navy-900/80">{description}</p>
        )}
        {first && meta && <p className="mt-3 text-small font-semibold text-gold-700">{meta}</p>}

        {progress && progress.steps.length > 1 && (
          <Stepper at={progress.at} steps={progress.steps} />
        )}

        {progress?.intro && (
          <p
            key={`${progress.at}-${progress.intro}`}
            className="anim-fade mt-5 border-l-2 border-gold-500 pl-4 text-body text-navy-900/80"
          >
            {progress.intro}
          </p>
        )}
        {children}
      </div>
    </div>
  )
}

/**
 * The parts of the form, left to right: done ones ticked in gold, the
 * current one in navy with a slow halo, the rest waiting. A gold line fills
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
    <div className="mt-7 border-t border-hair pt-6">
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
                  now && 'sv-head border-navy-900 bg-navy-900 text-cream',
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
                  now ? 'font-semibold text-navy-950' : done ? 'text-gold-700' : 'text-slate',
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
