import type { Sponsor } from '@/data/types'

/* ============================================================================
 * The band as it stood when it became editable, shown only while the API
 * cannot be reached. The live site reads /api/sponsors, which the organising
 * team edits in the panel.
 * ==========================================================================*/

export const sponsors: Sponsor[] = [
  { id: 1, name: 'Kementerian Perpaduan Negara (Ministry of National Unity)', tier: 'foundingPatron', logo: '/partners/ministry-national-unity.png', width: 363, height: 284 },
  { id: 2, name: 'Chevening Alumni Malaysia', tier: 'convenedBy', logo: '/partners/chevening-alumni-malaysia.png', width: 274, height: 397 },
  { id: 3, name: 'Koperasi Serbaguna Kebangsaan Berhad (NCMSP)', tier: 'gold', logo: '/partners/ncmsp.png', width: 480, height: 414 },
  { id: 4, name: 'Perintis Akal', tier: 'gold', logo: '/partners/perintis-akal.png', width: 383, height: 368 },
  { id: 5, name: 'Intramiles', tier: 'gold', logo: '/partners/intramiles.png', width: 560, height: 558 },
  { id: 6, name: 'HEYA Inc.', tier: 'marketing', logo: '/partners/heya-inc.png', width: 560, height: 352 },
]
