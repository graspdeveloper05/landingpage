/**
 * A speaker's portrait is optional: it can be removed in the admin panel, and
 * a speaker can be created before their photograph has been supplied. An empty
 * string in `src` renders as a broken image in every browser, so every place
 * that shows a portrait goes through here instead.
 */
export const DEFAULT_PORTRAIT = '/portraits/placeholder-default.svg'

export const portraitSrc = (portrait: string | null | undefined) =>
  portrait?.trim() ? portrait : DEFAULT_PORTRAIT

/**
 * The generated stand-ins that ship with the site, `placeholder-01..08`,
 * `-chair` and `-default`. They are not anybody's photograph, so there is
 * nothing to remove: offering it would only swap one placeholder for another.
 */
export const isPlaceholderPortrait = (portrait: string | null | undefined) =>
  !portrait?.trim() || portrait.startsWith('/portraits/placeholder-')
