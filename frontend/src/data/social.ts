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
 * PLACEHOLDER — no accounts have been created for the Dialogue yet.
 * Each entry points at "#" and is flagged, so `npm run check:placeholders`
 * blocks a deploy while any dead link remains. Replace `url` with the real
 * profile and drop the flag, or delete the entry if that network is not used.
 * ==========================================================================*/
export const socialLinks: SocialLink[] = [
  { id: 'so-linkedin', icon: 'linkedin', network: 'LinkedIn', url: '#', placeholder: true },
  { id: 'so-facebook', icon: 'facebook', network: 'Facebook', url: '#', placeholder: true },
  { id: 'so-youtube', icon: 'youtube', network: 'YouTube', url: '#', placeholder: true },
]

/**
 * PLACEHOLDER — confirm the address the organising team wants published.
 * §12 asks for spam protection; a mailto: is the simplest and is fine for a
 * one-off event, but it will be scraped.
 */
export const contactEmail = 'hello@serinegaradialogue.org'
