import { useI18n, useLocalized } from '@/i18n'
import { Reveal } from '@/components/ui/Reveal'
import { useDrawLine, usePassedNodes } from '@/lib/animation'
import { useProgramme } from '@/lib/useContent'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/cn'

/** §8 — a clean, mobile-friendly timeline with the concept's gold rule and nodes. */
export function ProgrammeTimeline() {
  const { locale, t } = useI18n()
  const L = useLocalized()
  const programme = useProgramme()
  const { containerRef, lineRef } = useDrawLine<HTMLDivElement>()
  const { setNode, passed } = usePassedNodes(programme.length)

  return (
    <div>
      <div ref={containerRef} className="relative">
        {/* The unlit track. Without it the drawn line has nothing to read against
            and the rail simply looks half-missing rather than half-travelled. */}
        <span
          aria-hidden
          className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-px bg-gold-500/20 sm:left-[calc(6.5rem+7px)]"
        />
        <span
          ref={lineRef}
          aria-hidden
          className="draw-line absolute left-[7px] top-2 h-[calc(100%-1rem)] w-px bg-gold-500 sm:left-[calc(6.5rem+7px)]"
        />

        <ol className="relative">
          {programme.map((item, i) => {
            const crossed = i < passed

            return (
              <Reveal
                as="li"
                key={item.id}
                delay={i * 60}
                className="relative pb-7 last:pb-0 sm:flex sm:gap-6"
              >
                <time
                  dateTime={item.time}
                  className={cn(
                    'tnum block pl-8 font-display text-small font-semibold transition-colors duration-300 sm:w-26 sm:shrink-0 sm:pl-0 sm:text-right',
                    crossed ? 'text-gold-700' : 'text-gold-700/55',
                  )}
                  style={{ minWidth: '6.5rem' }}
                >
                  {formatTime(item.time, locale)}
                </time>

                {/* Filled once crossed, hollow while ahead — the node is what tells
                    the reader where they are on the rail. */}
                <span
                  ref={setNode(i)}
                  aria-hidden
                  className={cn(
                    'absolute left-[3px] top-[5px] block h-2.5 w-2.5 rotate-45 border transition-all duration-300 ease-gentle sm:left-[calc(6.5rem+3px)]',
                    crossed
                      ? 'scale-110 border-gold-600 bg-gold-500 shadow-[0_0_0_3px_rgba(201,162,39,0.16)]'
                      : 'border-gold-500/55 bg-cream',
                  )}
                />

                <div className="pl-8 sm:pl-4">
                  <p
                    className={cn(
                      'font-display text-body font-semibold transition-colors duration-300',
                      crossed ? 'text-navy-900' : 'text-navy-900/70',
                    )}
                  >
                    {L(item.title)}
                  </p>
                  {item.detail && (
                    <p className="mt-0.5 text-small italic text-navy-800">{L(item.detail)}</p>
                  )}
                </div>
              </Reveal>
            )
          })}
        </ol>
      </div>

      <p className="mt-8 pl-8 text-micro text-slate sm:pl-0">{t('programme.note')}</p>
    </div>
  )
}
