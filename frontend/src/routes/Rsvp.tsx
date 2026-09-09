import { useI18n } from '@/i18n'
import { PageHero } from '@/components/layout/PageHero'
import { RsvpSection } from '@/components/home/RsvpSection'
import { EventInfoSection } from '@/components/home/EventInfoSection'
import type { EventStatus } from '@/services/api'

/** §9 — registration is an essential Phase 1 function. */
export function Rsvp({ status, refresh }: { status: EventStatus | null; refresh: () => void }) {
  const { t } = useI18n()

  return (
    <>
      <PageHero title={t('rsvp.title')} sub={t('rsvp.sub')} />
      <RsvpSection status={status} refresh={refresh} showHeading={false} />
      <EventInfoSection />
    </>
  )
}
