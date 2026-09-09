import { Ornament } from '@/components/ui/Ornament'
import { Picture } from '@/components/ui/Picture'

/**
 * The banner opening every route other than the homepage.
 *
 * It used to be a tall navy slab with the photograph dropped to 13% behind it —
 * which read as a heavy dark block bolted onto the top of the page, and threw
 * away the picture at the same time. Now the photograph runs at full strength
 * in a short band, and the type sits on a cream scrim local to the left column,
 * exactly as the homepage hero does. Same device, same page, half the height.
 */
export function PageHero({ title, sub }: { title: string; sub?: string }) {
  return (
    <section className="relative isolate flex h-[clamp(9rem,20vw,13.5rem)] items-center overflow-hidden border-b border-hair bg-cream">
      <Picture
        base="/scenes/colonnade"
        alt=""
        width={2000}
        height={1400}
        className="absolute inset-0 -z-10 block"
        imgClassName="h-full w-full object-cover object-center"
      />

      {/* Local lift under the type only — the colonnade keeps its full strength
          from just past the headline onward. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(95% 135% at 0% 50%, rgba(251,248,241,0.97) 0%, rgba(251,248,241,0.9) 26%, rgba(251,248,241,0.5) 46%, rgba(251,248,241,0) 66%)',
        }}
      />
      {/* No fade to cream along the bottom edge. It bleached a 64px strip
          clean across the photograph, which is more damage than the hairline
          border it was there to soften. The border does that job on its own. */}

      <div className="shell relative">
        <h1 className="anim-rise text-section font-semibold uppercase tracking-[0.06em] text-navy-900">
          {title}
        </h1>
        {sub && (
          <p
            className="anim-rise mt-2 text-lead text-navy-800"
            style={{ animationDelay: '0.1s' }}
          >
            {sub}
          </p>
        )}
        <Ornament className="anim-rise mt-4 !justify-start" />
      </div>
    </section>
  )
}
