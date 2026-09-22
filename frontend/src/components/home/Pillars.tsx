import { useI18n } from '@/i18n'
import { Reveal } from '@/components/ui/Reveal'
import { CapitolIcon, ShipIcon, SunriseIcon } from '@/components/ui/Icons'
import { cn } from '@/lib/cn'

/**
 * "The Conversation We Must Have" — the band beneath the hero, built to the
 * client's own design.
 *
 * Numbered because it genuinely is a sequence — the past, the present, then
 * the future — and the afternoon runs in that order. The third is lit: the
 * design ends on the future, glowing, because that is where the Dialogue is
 * pointed. The copy is the client's from the feedback deck.
 */
export function Pillars() {
  const { t, tList } = useI18n()

  const titles = tList('conversation.titles')
  const questions = tList('conversation.questions')
  const texts = tList('conversation.texts')
  const icons = [ShipIcon, CapitolIcon, SunriseIcon]

  return (
    <section id="pillars" className="relative isolate scroll-mt-24 overflow-hidden bg-navy-900 py-section text-cream">
      <Ornament />

      <div className="shell relative">
        <Reveal className="text-center">
          <h2 className="font-display text-[clamp(1.65rem,3.2vw,2.5rem)] font-semibold uppercase leading-tight tracking-[0.09em] text-cream">
            {t('conversation.title')}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-body text-cream/75">{t('conversation.sub')}</p>
        </Reveal>

        <ol className="relative mx-auto mt-16 grid max-w-6xl gap-14 md:mt-20 md:grid-cols-3 md:gap-6">
          {/*
            The thread joining the medallions, at their centre height, with a
            bead halfway between each pair. Desktop only: stacked on a phone,
            a line running between them would read as a divider instead.
          */}
          <span
            aria-hidden
            className="absolute left-[16.66%] right-[16.66%] top-[7.25rem] hidden h-px bg-gold-500/55 md:block"
          />
          {[33.33, 66.66].map((left) => (
            <span
              key={left}
              aria-hidden
              style={{ left: `${left}%` }}
              className="absolute top-[7.25rem] hidden h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400 md:block"
            />
          ))}

          {titles.map((title, i) => {
            const Icon = icons[i]
            const lit = i === titles.length - 1

            return (
              <Reveal as="li" key={title} delay={i * 140} className="relative text-center">
                {/* The numeral sits above its medallion, which just overlaps
                    its foot. Readable, but in the ground's own blue, so it
                    orders the three without competing with their titles --
                    except the last, which the design lights in gold. */}
                <span
                  aria-hidden
                  className={cn(
                    // lining-nums: Playfair draws old-style figures by default, which
                    // sink the 1 below the 0 and read as lowercase.
                    'block select-none font-display text-[4.25rem] font-bold leading-none tracking-[0.02em] [font-variant-numeric:lining-nums_tabular-nums] md:text-[5rem]',
                    lit
                      ? 'bg-gradient-to-b from-[#f3d98a] via-[#d4ae4a] to-[#8f6d22] bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(212,174,74,0.35)]'
                      : 'bg-gradient-to-b from-[#566a8e] to-[#2b3d5e] bg-clip-text text-transparent',
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>

                <span className="relative mx-auto -mt-2 block h-[5.5rem] w-[5.5rem]">
                  {lit && (
                    <span
                      aria-hidden
                      className="absolute -inset-8 rounded-full"
                      style={{ background: 'radial-gradient(circle, rgba(232,196,98,0.38) 0%, rgba(232,196,98,0.12) 38%, transparent 68%)' }}
                    />
                  )}
                  <span
                    className={cn(
                      'relative flex h-full w-full items-center justify-center rounded-full border-[1.5px] p-[0.9rem]',
                      lit
                        ? 'border-gold-400 bg-[radial-gradient(circle_at_50%_40%,#1b3358,#0b1d38)] text-gold-300 shadow-[0_0_28px_rgba(212,174,74,0.45)]'
                        : 'border-gold-500/70 bg-navy-900 text-gold-400',
                    )}
                  >
                    {/* The inner ring the design draws inside each medallion. */}
                    <span aria-hidden className="absolute inset-[3px] rounded-full border border-gold-500/25" />
                    <Icon className="relative h-full w-full" />
                  </span>
                </span>

                <h3 className="mt-6 font-display text-[1.05rem] font-semibold uppercase tracking-[0.12em] text-cream">
                  {title}
                </h3>
                <p className="mt-1.5 font-display text-body italic text-gold-400">{questions[i]}</p>
                <span aria-hidden className="mx-auto mt-3.5 block h-px w-7 bg-gold-500/70" />
                <p className="mx-auto mt-3.5 max-w-[17.5rem] text-small leading-relaxed text-cream/70">
                  {texts[i]}
                </p>
              </Reveal>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

/**
 * The faint line-work framing the band in the design: an eight-point star
 * lattice, the pattern of carved screens across Muzium Negara.
 *
 * It lives at the edges only. A mask clears the middle, where the text is,
 * so the pattern frames the three conversations without ever sitting behind
 * a line anybody has to read.
 */
function Ornament() {
  return (
    <>
      <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full text-gold-500"
      style={{
        maskImage: 'radial-gradient(ellipse 58% 70% at 50% 50%, transparent 55%, #000 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 58% 70% at 50% 50%, transparent 55%, #000 100%)',
      }}
    >
      <defs>
        <pattern id="conv-lattice" width="84" height="84" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.16">
            {/* an eight-point star: two squares, one turned 45 degrees */}
            <rect x="24" y="24" width="36" height="36" />
            <rect x="24" y="24" width="36" height="36" transform="rotate(45 42 42)" />
            <circle cx="42" cy="42" r="7" />
            {/* the lattice joining one star to the next */}
            <path d="M0 42h16.5M67.5 42H84M42 0v16.5M42 67.5V84" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#conv-lattice)" />
      </svg>
    </>
  )
}
