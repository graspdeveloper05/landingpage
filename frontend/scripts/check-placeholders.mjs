import fs from 'node:fs'
import path from 'node:path'

/* ============================================================================
 * Counts unreplaced placeholder content and fails if any remains.
 *
 *   node scripts/check-placeholders.mjs        # report
 *   node scripts/check-placeholders.mjs --ci   # exit 1 if anything is left
 *
 * Wire the --ci form into the deploy step so invented people cannot reach
 * production by accident.
 * ==========================================================================*/

const files = []
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(ts|tsx|json)$/.test(entry.name)) files.push(full)
  }
}
walk('src')

let records = 0
const machineTranslated = []

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8')
  const hits = text.match(/placeholder:\s*true/g)
  if (hits) records += hits.length
  if (/"_status":\s*"machine-translated/.test(text)) machineTranslated.push(file)
}

const generatedImages = fs.existsSync('public')
  ? walkImages('public').filter((f) => f.endsWith('.svg') && !f.includes('favicon')).length
  : 0

function walkImages(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkImages(full))
    else out.push(full)
  }
  return out
}

const social = fs.readFileSync('src/data/social.ts', 'utf8')
const deadSocial = (social.match(/url:\s*'#'/g) ?? []).length

console.log('Placeholder audit')
console.log('  invented people (placeholder: true)  ', records - deadSocial)
console.log('  social links pointing nowhere        ', deadSocial)
console.log('  locales pending human review         ', machineTranslated.length)
console.log('  generated stand-in images            ', generatedImages)

const blocking = records > 0 || machineTranslated.length > 0 || deadSocial > 0

if (blocking) {
  console.log('\nNOT READY FOR PRODUCTION — see docs/PLACEHOLDERS.md')
  if (process.argv.includes('--ci')) process.exit(1)
} else {
  console.log('\nNo placeholder content remaining.')
}
