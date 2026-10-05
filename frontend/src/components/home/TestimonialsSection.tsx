import { useEffect, useState } from 'react'
import { useI18n } from '@/i18n'
import { API_BASE, API_CONFIGURED } from '@/services/api'
import { SectionHeading } from '@/components/ui/SectionHeading'

interface Testimonial {
  id: number
  quote: string
  /** Already credited the way the participant chose. */
  attribution: string
}

/**
 * "What participants said": testimonials the organising team has approved.
 * The whole section stays out of the page until there is at least one.
 */
export function TestimonialsSection() {
  const { t } = useI18n()
  const [items, setItems] = useState<Testimonial[]>([])

  useEffect(() => {
    if (!API_CONFIGURED) return
    fetch(`${API_BASE}/api/testimonials`, { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Testimonial[]) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
  }, [])

  if (items.length === 0) return null

  return (
    <section id="testimonials" className="scroll-mt-24 border-t border-hair bg-white py-section">
      <div className="shell">
        <SectionHeading title={t('testimonials.title')} sub={t('testimonials.sub')} />
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <figure
              key={item.id}
              className="flex flex-col rounded-sm border border-hair bg-cream px-6 py-7"
            >
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
          ))}
        </div>
      </div>
    </section>
  )
}
