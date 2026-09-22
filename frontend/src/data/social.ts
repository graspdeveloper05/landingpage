export interface SocialLink {
  id: string
  /** Icon key in components/ui/Icons.tsx */
  icon: 'linkedin' | 'facebook' | 'youtube' | 'instagram'
  /** Accessible name — announced as "Seri Negara Dialogue on LinkedIn". */
  network: string
  url: string
  placeholder?: boolean
}

/* ============================================================================
 * Instagram only, per the client's feedback of September 2026: LinkedIn,
 * Facebook and YouTube are removed.
 *
 * NO URL YET — the client asked for Instagram without giving the address.
 * Paste the profile link into `url` and drop the flag. Until then the footer
 * leaves the icon out entirely rather than publishing a link to nowhere, and
 * `npm run check:placeholders` still reports it.
 * ==========================================================================*/
export const socialLinks: SocialLink[] = [
  { id: 'so-instagram', icon: 'instagram', network: 'Instagram', url: '', placeholder: true },
]

/**
 * PLACEHOLDER — confirm the address the organising team wants published.
 * §12 asks for spam protection; a mailto: is the simplest and is fine for a
 * one-off event, but it will be scraped.
 */
export const contactEmail = 'hello@serinegaradialogue.org'
