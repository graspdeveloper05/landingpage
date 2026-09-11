export const LOCALES = ['ms', 'en', 'zh', 'ta'] as const
export type Locale = (typeof LOCALES)[number]

/** A string that exists in all four languages required by §3. */
export type Localized = Record<Locale, string>

export interface Speaker {
  id: string
  /** Personal names are not translated. */
  name: string
  designation: Localized
  organisation: string
  /** 4:5 portrait. */
  portrait: string
  bio: Localized
  /** §7 — relevant official external link. Opens in a new tab (§10). */
  link?: { label: string; url: string }
  role: 'speaker' | 'moderator'
  /** Content not yet supplied by the organising team. */
  placeholder?: boolean
}

export interface Chairman {
  name: string
  designation: Localized
  organisation: string
  portrait: string
  message: Localized
  /** The pull quote shown beside the welcome in the concept. */
  quote: Localized
  placeholder?: boolean
}

export interface ProgrammeItem {
  id: string
  /** 24-hour "HH:MM", rendered in the visitor's locale. */
  time: string
  title: Localized
  detail?: Localized
  placeholder?: boolean
}

export interface EventDetails {
  edition: number
  /** ISO date, used for <time datetime> and structured data. */
  date: string
  /**
   * The date as a visitor reads it, per language -- "8 October 2026",
   * "8 Oktober 2026". Not a formatting of `date`: rendering a Malaysian date
   * in Tamil is a translation, not a locale format string.
   *
   * Optional because the bundled fallback data has no copy; components fall
   * back to the locale files when it is absent.
   */
  dateLabel?: Localized
  startTime: string
  /** The start time as a visitor reads it, per language. */
  timeLabel?: Localized
  /**
   * The hero's own two lines, per language: the event name and the sentence
   * under it. Optional for the same reason as the labels above -- the
   * bundled fallback carries none, and the locale files answer instead.
   */
  eventName?: Localized
  subtitle?: Localized
  /**
   * Base path of an uploaded hero photograph, without extension, e.g.
   * "/storage/hero/<uuid>". Null or absent means the picture shipped with
   * the build is used.
   */
  heroImage?: string | null
  venue: string
  venueAddress: string
  mapsUrl: string
  mapEmbedUrl: string
  /** §9 — estimated capacity is approximately 200 participants. */
  capacity: number
}

export interface QuickLink {
  id: string
  label: string
  url: string
}

export interface Registration {
  fullName: string
  email: string
  mobile: string
  organisation: string
  designation: string
  dietary: string
  pdpaAccepted: boolean
}

export interface RegistrationRecord extends Registration {
  reference: string
  submittedAt: string
}
