import { Ornament } from '@/components/ui/Ornament'
import { useParallax } from '@/lib/animation'

/** The banner opening every route other than the homepage. */
export function PageHero({ title, sub }: { title: string; sub?: string }) {
  const bgRef = useParallax<HTMLImageElement>(0.12, 50)

  return (
    <section className="relative overflow-hidden bg-navy-900 py-16 sm:py-20">
      <img
        ref={bgRef}
        src="/hero/hero-scene.svg"
        alt=""
        width={1600}
        height={900}
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-[0.13]"
      />
      <div className="shell relative text-center">
        <h1 className="anim-rise text-section font-semibold uppercase tracking-[0.06em] text-cream">
          {title}
        </h1>
        {sub && (
          <p className="anim-rise mt-3 text-lead text-cream/70" style={{ animationDelay: '0.1s' }}>
            {sub}
          </p>
        )}
        <Ornament className="anim-rise mt-5" tone="light" />
      </div>
    </section>
  )
}
