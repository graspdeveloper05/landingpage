import { AnimatePresence, motion } from 'framer-motion'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Toasts for the admin panel.
 *
 * They replace the inline "saved" notices, which had a real problem: on a
 * form two screens tall you press Save at the bottom and the confirmation
 * appeared at the top, off-screen. The save worked and looked like it had not.
 *
 * Only outcomes that need no action become toasts — saved, removed, order
 * saved. Anything the organiser has to fix stays on the field it belongs to,
 * because a validation error that vanishes after four seconds is worse than
 * no message at all.
 */

type ToastKind = 'success' | 'error'

interface Toast {
  id: number
  kind: ToastKind
  message: string
}

interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const api = useContext(ToastContext)
  if (!api) throw new Error('useToast must be used inside <ToastProvider>')
  return api
}

const LIFETIME = 4200

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  // Ids from a counter, not Date.now(): two toasts raised in the same
  // millisecond would share a key and React would treat them as one.
  const nextId = useRef(1)
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++
      // Capped at three. A reorder can fire several in quick succession, and a
      // column of nine notices covers the thing being reordered.
      setToasts((current) => [...current.slice(-2), { id, kind, message }])
      timers.current.set(id, setTimeout(() => dismiss(id), LIFETIME))
    },
    [dismiss],
  )

  // Every pending timer is cleared on unmount, so signing out mid-toast cannot
  // set state on a provider that is gone.
  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(clearTimeout)
      pending.clear()
    }
  }, [])

  const api = useRef<ToastApi>({
    success: (m: string) => push('success', m),
    error: (m: string) => push('error', m),
  })
  api.current.success = (m: string) => push('success', m)
  api.current.error = (m: string) => push('error', m)

  return (
    <ToastContext.Provider value={api.current}>
      {children}

      {/*
        aria-live so a screen reader announces a save it cannot see, and
        pointer-events-none on the stack so a toast in the corner never
        intercepts a click on whatever is under it.
      */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              /*
               * `layout` is what Framer Motion is here for: when one toast
               * expires the others slide up into its place instead of jumping.
               * Doing that in CSS means measuring every card on every change.
               */
              layout
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.7 }}
              className={cn(
                'pointer-events-auto flex items-start gap-2.5 rounded-sm border-l-2 bg-white px-3 py-2.5',
                'shadow-[0_10px_30px_-12px_rgba(11,33,64,0.45)]',
                toast.kind === 'success' ? 'border-green-600' : 'border-red-500',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'mt-[3px] grid h-4 w-4 shrink-0 place-items-center rounded-full text-[0.6rem] font-bold text-white',
                  toast.kind === 'success' ? 'bg-green-600' : 'bg-red-500',
                )}
              >
                {toast.kind === 'success' ? '✓' : '!'}
              </span>

              <p className="flex-1 text-[0.78rem] leading-snug text-navy-900">{toast.message}</p>

              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
                className="-mr-1 -mt-0.5 shrink-0 px-1 text-[0.9rem] leading-none text-slate transition-colors hover:text-navy-900"
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
