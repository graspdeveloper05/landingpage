export interface SocialLink {
  id: string
  /** Icon key in components/ui/Icons.tsx */
  icon: 'linkedin' | 'facebook' | 'youtube' | 'instagram'
  /** Accessible name — announced as "Seri Negara Dialogue on LinkedIn". */
  network: string
  url: string
  /**
   * Whose account it is, when it is not the Dialogue's own -- announced in
   * place of "Seri Negara Dialogue", so the label does not promise one
   * account and open another.
   */
  owner?: string
  placeholder?: boolean
}

/* ============================================================================
 * Instagram only, per the client's feedback of September 2026: LinkedIn,
 * Facebook and YouTube are removed.
 *
 * The address is Chevening Alumni Malaysia's, the Dialogue's convenor. The
 * client asked for Instagram without giving one; their own promotional
 * graphic for the MC carries the handle @cheveningMY across its social icons,
 * and the profile was checked to exist under that name. The Dialogue has no
 * account of its own, so the convenor's is the one to follow.
 * ==========================================================================*/
export const socialLinks: SocialLink[] = [
  { id: 'so-instagram', icon: 'instagram', network: 'Instagram', url: 'https://www.instagram.com/cheveningmy/', owner: 'Chevening Alumni Malaysia' },
]

/**
 * PLACEHOLDER — confirm the address the organising team wants published.
 * §12 asks for spam protection; a mailto: is the simplest and is fine for a
 * one-off event, but it will be scraped.
 */
export const contactEmail = 'hello@serinegaradialogue.org'
