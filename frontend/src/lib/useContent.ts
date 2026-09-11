import { useEffect, useState } from 'react'
import { event as bundledEvent, programme as bundledProgramme, speakers as bundledSpeakers } from '@/data'
import { getEvent, getProgramme, getSpeakers } from '@/services/api'
import { useI18n } from '@/i18n'
import type { EventDetails, ProgrammeItem, Speaker } from '@/data/types'

/*
 * Speakers and the programme, as edited by the organising team.
 *
 * Both hooks START from the bundled copy rather than from null. That is what
 * keeps the first paint identical to the old static build: the grid and the
 * timeline are on screen immediately, and the edited version replaces them a
 * moment later if anything has changed. Starting from null would put a
 * loading state on the homepage's most visible sections on every visit, to
 * save a list that is almost always the same.
 *
 * The API is asked once per mount. Nothing here polls: the content changes
 * when an organiser saves it, not while a visitor is reading.
 */

export function useSpeakers(): Speaker[] {
  const [list, setList] = useState<Speaker[]>(bundledSpeakers)

  useEffect(() => {
    let live = true
    getSpeakers().then((data) => {
      // A response arriving after the visitor has navigated away would set
      // state on an unmounted component.
      if (live) setList(data)
    })
    return () => {
      live = false
    }
  }, [])

  return list
}

export function useProgramme(): ProgrammeItem[] {
  const [list, setList] = useState<ProgrammeItem[]>(bundledProgramme)

  useEffect(() => {
    let live = true
    getProgramme().then((data) => {
      if (live) setList(data)
    })
    return () => {
      live = false
    }
  }, [])

  return list
}

/** Split the same way `@/data` splits the bundled list, so callers match. */
export function usePanelAndModerators() {
  const speakers = useSpeakers()
  return {
    panelSpeakers: speakers.filter((s) => s.role === 'speaker'),
    moderators: speakers.filter((s) => s.role === 'moderator'),
    speakers,
  }
}

/* -------------------------------------------------------------------------- */
/* Event details                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The event's date, time, venue and capacity, as edited by the team.
 *
 * Starts from the bundled copy for the same reason the other two hooks do:
 * the hero must not render without a date while a request is in flight.
 *
 * `dateLabel` and `timeLabel` are the strings a visitor reads. They come back
 * from the API in all four languages; the bundled fallback has none, so
 * `useEventLabels` below drops through to the locale files, which is exactly
 * how the site behaved before any of this was editable.
 */
export function useEvent(): EventDetails {
  const [details, setDetails] = useState<EventDetails>(bundledEvent)

  useEffect(() => {
    let live = true
    getEvent()
      .then((data) => {
        if (live) setDetails(data)
      })
      .catch(() => {
        // Keep the bundled details. A hero with the shipped date is far better
        // than a hero with no date, and the RSVP form reports its own errors.
      })
    return () => {
      live = false
    }
  }, [])

  return details
}

/**
 * The date and time as text, in the reader's language.
 *
 * Prefers what the organising team saved, falls back to the shipped
 * translation. Both are returned together because every place that shows one
 * shows the other.
 */
export function useEventLabels() {
  const { locale, t } = useI18n()
  const event = useEvent()

  return {
    event,
    date: event.dateLabel?.[locale]?.trim() || t('hero.date'),
    time: event.timeLabel?.[locale]?.trim() || t('hero.time'),
    // Same fallback rule as the date and time: whatever the team has saved,
    // otherwise the wording shipped in the locale files. So an unreachable
    // API degrades to the previous copy rather than to blank headings.
    eventName: event.eventName?.[locale]?.trim() || t('hero.eventName'),
    subtitle: event.subtitle?.[locale]?.trim() || t('hero.subtitle'),
  }
}
