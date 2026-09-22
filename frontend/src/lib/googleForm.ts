import type { GoogleFormField, GoogleFormTarget, Registration } from '@/data/types'

/**
 * Copies a registration into the organising team's Google Form, from the
 * visitor's browser, once the site has saved it.
 *
 * The team keeps their attendee list in that form's response sheet, so every
 * registration taken here is submitted there too. It goes from the browser
 * because Google refuses the same submission from a server.
 *
 * Which form, and its field numbers, come from the panel (Registrations →
 * Google Form), where the server reads them off the form itself -- so a new
 * form, or a rebuilt question, is fixed by pasting its link there again.
 *
 * What this cannot do: know whether Google accepted it. A cross-site post is
 * answered opaquely, so a refusal is silent. The site's own list (the panel
 * and its CSV) is saved first and is always complete; only the sheet can
 * have gaps.
 */

/**
 * The team's form as read on 22 Sept 2026. Used only when the live settings
 * could not be loaded -- the same fallback rule as the rest of the event.
 */
const BUILT_IN: GoogleFormTarget = {
  id: '1FAIpQLSeIsPbDfMDM-xDdbIng05PSVuMt4x947EchMpnpN9PNGpIh3g',
  entries: {
    fullName: 473554422,
    mobile: 1707445016,
    organisation: 1150494462,
    designation: 8641384,
    dietary: 596513142,
    cheveningScholar: 1120172519,
    cheveningCohort: 1378503810,
    cheveningUniversity: 1443689380,
    camMember: 1220313965,
  },
  pages: {
    fullName: 0,
    mobile: 0,
    organisation: 0,
    designation: 0,
    dietary: 0,
    cheveningScholar: 0,
    cheveningCohort: 1,
    cheveningUniversity: 1,
    camMember: 1,
  },
}

function isLocal() {
  return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(window.location.hostname)
}

/**
 * A developer's machine never sends to the team's form, so test sign-ups stay
 * out of their sheet. It sends only to a test copy named in
 * frontend/.env.local (never committed), and to nothing when none is:
 *
 *   VITE_TEST_GOOGLE_FORM_ID=1FAIpQL...
 *   VITE_TEST_GOOGLE_FORM_ENTRIES={"fullName":123,"mobile":456,...}
 *
 * The test copy is assumed to share the team's page layout.
 */
function localTarget(): GoogleFormTarget | null {
  const id = import.meta.env.VITE_TEST_GOOGLE_FORM_ID as string | undefined
  const entries = import.meta.env.VITE_TEST_GOOGLE_FORM_ENTRIES as string | undefined
  if (!id || !entries) return null
  try {
    return { id, entries: JSON.parse(entries), pages: BUILT_IN.pages }
  } catch {
    return null
  }
}

const yesNo = (v: string) => (v === 'yes' ? 'Yes' : 'No')

/**
 * @param configured the form set in the panel: null when switched off,
 *   undefined when the live settings did not load.
 */
export function copyToGoogleForm(r: Registration, configured: GoogleFormTarget | null | undefined): void {
  const form = isLocal() ? localTarget() : configured === undefined ? BUILT_IN : configured
  if (!form) return

  const scholar = r.cheveningScholar === 'yes'
  const answers: Partial<Record<GoogleFormField, string>> = {
    fullName: r.fullName.trim(),
    mobile: r.mobile.trim(),
    organisation: r.organisation.trim(),
    designation: r.designation.trim(),
    // Required on their form, optional on ours.
    dietary: r.dietary.trim() || 'None',
    cheveningScholar: yesNo(r.cheveningScholar),
    // The alumni questions only for scholars, as their form asks them.
    ...(scholar && {
      cheveningCohort: r.cheveningCohort.trim(),
      cheveningUniversity: r.cheveningUniversity.trim(),
      camMember: yesNo(r.camMember),
    }),
  }

  const body = new URLSearchParams({ emailAddress: r.email.trim(), fvv: '1' })
  const visited = new Set<number>([0])
  for (const [field, value] of Object.entries(answers) as [GoogleFormField, string][]) {
    body.set(`entry.${form.entries[field]}`, value)
    visited.add(form.pages[field] ?? 0)
  }
  // The pages a person would have stepped through to give these answers.
  body.set('pageHistory', [...visited].sort((a, b) => a - b).join(','))

  // no-cors: Google sends no permission for this site to read the answer,
  // and none is needed to deliver it. keepalive lets it finish if the visitor
  // leaves the page straight away.
  fetch(`https://docs.google.com/forms/d/e/${form.id}/formResponse`, {
    method: 'POST',
    mode: 'no-cors',
    keepalive: true,
    body,
  }).catch(() => {
    // Nothing to tell the visitor: their seat is booked either way.
  })
}
