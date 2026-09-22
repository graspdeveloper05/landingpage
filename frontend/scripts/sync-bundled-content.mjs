import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/* ============================================================================
 * Writes the site's bundled fallback content from the backend's config.
 *
 *   node scripts/sync-bundled-content.mjs
 *
 * The event, chairman, speakers and programme live in backend/config, which
 * the database seeder and the content migration both read. The frontend keeps
 * a copy for the moment the API cannot be reached -- and a copy written by
 * hand drifts: it was still showing eight invented speakers after the real
 * line-up had been confirmed. So it is generated, never edited.
 *
 * Needs PHP on the PATH, which any machine that runs the backend has.
 * ==========================================================================*/

const here = path.dirname(fileURLToPath(import.meta.url))
const backend = path.resolve(here, '../../backend')
const out = path.resolve(here, '../src/data/editions/2026')

/** A backend config file, evaluated by PHP and handed over as JSON. */
function config(name) {
  const file = path.join(backend, 'config', `${name}.php`)
  // env() is a Laravel helper; outside the framework it returns the default,
  // which is exactly the value a fresh install ships with.
  const php = `
    function env($k, $d = null) { return $d; }
    echo json_encode(require ${JSON.stringify(file)}, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  `
  return JSON.parse(execFileSync('php', ['-r', php], { encoding: 'utf8' }))
}

const HEADER = `/* ============================================================================
 * GENERATED from backend/config by scripts/sync-bundled-content.mjs.
 * Do not edit by hand -- edit the config and run the script.
 *
 * This is the fallback shown only when the API cannot be reached. The live
 * site reads the same content from the database, where the organising team
 * edits it in the admin panel.
 * ==========================================================================*/
`

const ts = (v) => JSON.stringify(v, null, 2)

const event = config('event')
fs.writeFileSync(
  path.join(out, 'event.ts'),
  `import type { EventDetails } from '@/data/types'

${HEADER}
export const event: EventDetails = ${ts({
    edition: event.edition,
    date: event.date,
    dateLabel: event.date_label,
    startTime: event.start_time,
    timeLabel: event.time_label,
    venue: event.venue,
    venueAddress: event.venue_address,
    mapsUrl: event.maps_url,
    mapEmbedUrl: event.map_embed_url,
    capacity: event.capacity,
  })}
`,
)

const chairman = config('chairman')
const speakers = config('speakers').list
fs.writeFileSync(
  path.join(out, 'speakers.ts'),
  `import type { Chairman, Speaker } from '@/data/types'

${HEADER}
export const speakers: Speaker[] = ${ts(
    speakers.map((s) => ({
      id: s.id,
      name: s.name,
      designation: s.designation,
      organisation: s.organisation,
      portrait: s.portrait,
      bio: s.bio,
      role: s.role,
    })),
  )}

export const chairman: Chairman = ${ts({
    name: chairman.name,
    designation: chairman.designation,
    organisation: chairman.organisation,
    portrait: '',
    message: chairman.message,
    quote: chairman.quote,
    letter: chairman.letter,
  })}
`,
)

const programme = config('programme').list
fs.writeFileSync(
  path.join(out, 'programme.ts'),
  `import type { ProgrammeItem } from '@/data/types'

${HEADER}
export const programme: ProgrammeItem[] = ${ts(
    programme.map((p) => ({
      id: p.id,
      time: p.time,
      title: p.title,
      ...(p.detail ? { detail: p.detail } : {}),
    })),
  )}
`,
)

console.log(
  `bundled content written — ${speakers.length} speakers, ${programme.length} programme items, chairman ${chairman.name}`,
)
