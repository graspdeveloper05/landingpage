import { useEffect, useState } from 'react'
import { programme as bundledProgramme, speakers as bundledSpeakers } from '@/data'
import { getProgramme, getSpeakers } from '@/services/api'
import type { ProgrammeItem, Speaker } from '@/data/types'

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
