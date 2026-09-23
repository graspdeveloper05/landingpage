import type { ReactNode } from 'react'
import { ButtonLink } from '@/components/ui/Button'
import { useEvent } from '@/lib/useContent'
import { REGISTRATION_PATH } from '@/lib/registration'

/**
 * Every "Register" on the site, pointing wherever the panel says.
 *
 * "Our form" keeps people on the site, where the registration is saved, the
 * confirmation sent, and a copy submitted to the organising team's Google
 * Form. "Google Form" sends them straight to the team's form instead -- what
 * to choose when that form asks something the site does not, since their form
 * then asks it of everyone with nothing to change here.
 *
 * Falls back to the site's own form while the settings are still loading, or
 * if they cannot be reached: a Register button that goes nowhere is worse
 * than one that goes to a form we know exists.
 */
export function RegisterLink({
  children,
  className,
  withArrow,
}: {
  children: ReactNode
  className?: string
  withArrow?: boolean
}) {
  const event = useEvent()
  const external = event.registrationMode === 'google' && Boolean(event.googleFormUrl)

  return external ? (
    <ButtonLink href={event.googleFormUrl!} className={className} withArrow={withArrow}>
      {children}
    </ButtonLink>
  ) : (
    <ButtonLink to={REGISTRATION_PATH} className={className} withArrow={withArrow}>
      {children}
    </ButtonLink>
  )
}
