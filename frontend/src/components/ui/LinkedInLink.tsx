import { useI18n } from '@/i18n'
import { cn } from '@/lib/cn'
import { LinkedInIcon } from './Icons'

/**
 * A person's LinkedIn profile, as a small link under their name: the mark and
 * the word, in the navy of the text around it, turning LinkedIn's own blue
 * under the pointer. Nothing at all when there is no profile to open.
 */
export function LinkedInLink({
  href,
  name,
  className,
}: {
  href?: string | null
  /** Whose profile, for screen readers: "Dr. … on LinkedIn". */
  name: string
  className?: string
}) {
  const { t } = useI18n()
  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex min-h-[36px] items-center gap-2 text-small font-semibold text-navy-800 transition-colors duration-200 hover:text-[#0A66C2]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50',
        className,
      )}
    >
      <LinkedInIcon className="h-4 w-4 shrink-0" />
      <span aria-hidden>LinkedIn</span>
      <span className="sr-only">
        {name} on LinkedIn ({t('common.newTab')})
      </span>
    </a>
  )
}
