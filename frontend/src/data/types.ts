export const LOCALES = ['ms', 'en', 'zh', 'ta'] as const
export type Locale = (typeof LOCALES)[number]

/** A string that exists in all four languages required by §3. */
export type Localized = Record<Locale, string>

export type SpeakerRole = 'keynote' | 'speaker' | 'moderator' | 'mc'

/** The order the roles appear on the page, which is the order of the afternoon. */
export const SPEAKER_ROLES: SpeakerRole[] = ['keynote', 'speaker', 'moderator', 'mc']

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
  /**
   * In running order: the keynote, the panellists ("speaker"), the moderator
   * and the Master of Ceremonies.
   */
  role: SpeakerRole
  /** Content not yet supplied by the organising team. */
  placeholder?: boolean
  /**
   * False while the photograph is matched to this person by inference rather
   * than by the client -- see backend/config/speakers.php. The placeholder
   * audit refuses a launch while any is false.
   */
  photoConfirmed?: boolean
}

export interface Chairman {
  name: string
  designation: Localized
  organisation: string
  portrait: string
  message: Localized
  /** The pull quote shown beside the welcome in the concept. */
  quote: Localized
  /**
   * The full welcome on the About page, paragraphs separated by a blank
   * line. Optional: an edition can have only the short message.
   */
  letter?: Localized | null
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
  /**
   * The Organising Chairman as the team has edited him, or absent when they
   * have not -- in which case the bundled record answers instead.
   */
  chairman?: Chairman | null
  venue: string
  venueAddress: string
  mapsUrl: string
  mapEmbedUrl: string
  /** §9 — estimated capacity is approximately 200 participants. */
  capacity: number
  /**
   * The Google Form each registration is copied into, as set in the panel.
   * Null when the team has switched copying off; absent from the bundled
   * fallback, when the form built into the site is used.
   */
  googleForm?: GoogleFormTarget | null
  /**
   * Where the Register buttons lead, as chosen in the panel: 'site' for the
   * site's own form, 'google' to send people to the team's form instead.
   */
  registrationMode?: 'site' | 'google'
  /** The team's form, for when registrationMode is 'google'. */
  googleFormUrl?: string | null
}

/** A Google Form, as the server read it: its id, field numbers and pages. */
export interface GoogleFormTarget {
  id: string
  /** Dietary is absent once the team removes that question from their form. */
  entries: Partial<Record<GoogleFormField, number>>
  pages: Partial<Record<GoogleFormField, number>>
}

export type GoogleFormField =
  | 'fullName'
  | 'mobile'
  | 'organisation'
  | 'designation'
  | 'dietary'
  | 'cheveningScholar'
  | 'cheveningCohort'
  | 'cheveningUniversity'
  | 'camMember'

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
  /**
   * Asked because the organising team's Google Form asks them, and each
   * registration is copied there. Cohort, university and CAM membership only
   * when cheveningScholar is 'yes'.
   */
  cheveningScholar: '' | 'yes' | 'no'
  cheveningCohort: string
  cheveningUniversity: string
  camMember: '' | 'yes' | 'no'
  pdpaAccepted: boolean
}

export interface RegistrationRecord extends Registration {
  reference: string
  submittedAt: string
}
