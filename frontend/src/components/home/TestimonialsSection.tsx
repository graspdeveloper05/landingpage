import { useCallback, useEffect, useState } from 'react'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/cn'
import { API_BASE, API_CONFIGURED } from '@/services/api'
import { SectionHeading } from '@/components/ui/SectionHeading'

interface Testimonial {
  id: number
  quote: string
  /** Already credited the way the participant chose. */
  attribution: string
}

/** How long each position holds before the carousel moves on by itself. */
const ADVANCE_MS = 6000

/** Cards in view: three on a wide screen, two on a tablet, one on a phone. */
function usePerView() {
  const read = () =>
    typeof window === 'undefined'
      ? 3
      : window.matchMedia('(min-width: 1024px)').matches
        ? 3
        : window.matchMedia('(min-width: 768px)').matches
          ? 2
          : 1
  const [perView, setPerView] = useState(read)

  useEffect(() => {
    const update = () => setPerView(read())
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return perView
}

/**
 * "What participants said": testimonials the organising team has approved.
 * Shown three at a time and centred; with more than fit, it slides one card
 * at a time. The whole section stays out of the page until there is one.
 */
export function TestimonialsSection() {
  const { t } = useI18n()
  const [items, setItems] = useState<Testimonial[]>([])
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const perView = usePerView()

  useEffect(() => {
    if (!API_CONFIGURED) return
    fetch(`${API_BASE}/api/testimonials`, { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Testimonial[]) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
  }, [])

  const slides = items.length > perView
  const last = Math.max(0, items.length - perView)
  const at = Math.min(index, last)

  const go = useCallback(
    (next: number) => setIndex(next < 0 ? last : next > last ? 0 : next),
    [last],
  )

  // Moves on by itself, except while someone is reading (hover or focus) or
  // has asked their system for less motion.
  useEffect(() => {
    if (!slides || paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => go(at + 1), ADVANCE_MS)
    return () => window.clearInterval(timer)
  }, [slides, paused, at, go])

  if (items.length === 0) return null

  return (
    <section
      id="testimonials"
      aria-roledescription="carousel"
      aria-label={t('testimonials.title')}
      className="scroll-mt-24 border-t border-hair bg-white py-section"
    >
      <div className="shell">
        <SectionHeading title={t('testimonials.title')} sub={t('testimonials.sub')} />

        <div
          className="mt-12 overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <ul
            className={cn(
              'flex motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out',
              // Fewer than fill a row sit in the middle rather than to the left.
              !slides && 'justify-center',
            )}
            style={slides ? { transform: `translateX(-${(at * 100) / perView}%)` } : undefined}
          >
            {items.map((item, i) => (
              <li
                key={item.id}
                className="shrink-0 px-3"
                style={{ width: `${100 / perView}%` }}
                aria-hidden={slides && (i < at || i >= at + perView) ? true : undefined}
              >
                <figure className="flex h-full flex-col items-center rounded-sm border border-hair bg-cream px-6 py-8 text-center">
                  <span aria-hidden className="font-display text-[3rem] leading-none text-gold-500">
                    “
                  </span>
                  <blockquote className="mt-1 flex-1 font-display text-lead italic leading-relaxed text-navy-900">
                    {item.quote}
                  </blockquote>
                  <figcaption className="mt-5 text-small font-semibold text-slate">
                    — {item.attribution}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>

        {slides && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => go(at - 1)}
              aria-label={t('testimonials.previous')}
              className="grid h-10 w-10 place-items-center rounded-full border border-navy-900/20 text-navy-900 transition-colors hover:border-gold-500 hover:text-gold-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
            >
              ‹
            </button>
            <div className="flex gap-2">
              {Array.from({ length: last + 1 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={t('testimonials.goTo', { n: i + 1 })}
                  aria-current={i === at ? 'true' : undefined}
                  className={cn(
                    'h-2.5 rounded-full transition-all',
                    i === at ? 'w-6 bg-gold-500' : 'w-2.5 bg-navy-900/20 hover:bg-navy-900/40',
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(at + 1)}
              aria-label={t('testimonials.next')}
              className="grid h-10 w-10 place-items-center rounded-full border border-navy-900/20 text-navy-900 transition-colors hover:border-gold-500 hover:text-gold-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
