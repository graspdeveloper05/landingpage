/**
 * §13 — the Dialogue continues beyond 2026, so content is keyed by edition.
 * Adding 2027 means adding `editions/2027/` and changing CURRENT_EDITION;
 * no route, component or layout work is required.
 */
import { event as event2026 } from './editions/2026/event'
import { speakers as speakers2026, chairman as chairman2026 } from './editions/2026/speakers'
import { programme as programme2026 } from './editions/2026/programme'

export const CURRENT_EDITION = 2026

const editions = {
  2026: {
    event: event2026,
    speakers: speakers2026,
    chairman: chairman2026,
    programme: programme2026,
  },
} as const

export const currentEdition = editions[CURRENT_EDITION]

export const { event, speakers, chairman, programme } = currentEdition

export const panelSpeakers = speakers.filter((s) => s.role === 'speaker')
export const moderators = speakers.filter((s) => s.role === 'moderator')

export { quickLinks } from './quickLinks'
export * from './types'
