import { cn } from '@/lib/cn'

/**
 * The whole-screen wait: checking a session, or fetching the admin chunk.
 *
 * Both are brief but neither is instant, and "Checking your session…" set as
 * bare text on white looked like a page that had failed to render rather than
 * one that was working. The seal and the moving bar say the same thing with
 * the site's own voice.
 */
export function AdminSplash({ message }: { message: string }) {
  return (
    <div className="admin-ui grid min-h-screen place-items-center bg-[#F1F1EF] px-4 font-sans">
      <div className="w-full max-w-[14rem] text-center">
        <span className="admin-breathe mx-auto grid h-14 w-14 place-items-center rounded-full border border-gold-500/45 bg-white">
          <img src="/brand/emblem.webp" alt="" width={320} height={166} className="h-7 w-auto" />
        </span>

        <p className="mt-4 text-[0.78rem] text-slate">{message}</p>

        <div className="mt-3 h-0.5 w-full overflow-hidden rounded-full bg-[#DDDCD8]">
          <div className="admin-progress-bar h-full w-full bg-gold-500" />
        </div>
      </div>
    </div>
  )
}

/** One grey bar standing in for a line of text that has not arrived. */
export function SkeletonLine({ className }: { className?: string }) {
  return <span className={cn('admin-skeleton block h-3', className)} />
}

/**
 * Placeholder rows shaped like the list they replace.
 *
 * Shaped rather than a spinner because the layout then does not jump when the
 * real rows arrive -- the page is already the right height and the eye is
 * already where the content will be.
 */
export function SkeletonRows({ count = 4, thumb = false }: { count?: number; thumb?: boolean }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-sm border border-[#DDDCD8] bg-white p-4"
          // Staggered so the rows do not pulse in unison, which reads as a
          // flashing block rather than as several things loading.
          style={{ animationDelay: `${i * 90}ms` }}
        >
          {thumb && <SkeletonLine className="h-16 w-[3.4rem] shrink-0 rounded-sm" />}
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonLine className="w-1/3" />
            <SkeletonLine className="h-2.5 w-1/2" />
          </div>
          <SkeletonLine className="h-8 w-24 shrink-0" />
        </div>
      ))}
    </div>
  )
}

/** Placeholder for a form: a few labelled fields inside a card. */
export function SkeletonForm({ cards = 2 }: { cards?: number }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2" aria-hidden>
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="space-y-4 rounded-sm border border-[#DDDCD8] bg-white p-4">
          <SkeletonLine className="h-2.5 w-20" />
          {Array.from({ length: 3 }, (_, j) => (
            <div key={j} className="space-y-1.5">
              <SkeletonLine className="h-2.5 w-24" />
              <SkeletonLine className="h-8 w-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
