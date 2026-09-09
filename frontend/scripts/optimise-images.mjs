import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

/* ============================================================================
 * Turns the supplied source artwork into the web assets the site serves.
 *
 *   cd landingpage && npm install --no-save sharp
 *   node frontend/scripts/optimise-images.mjs
 *
 * sharp is deliberately NOT in package.json. The cPanel deploy runs `npm ci`
 * on a shared host, and adding a binary dependency there risks failing the
 * whole build for a step that only ever needs to run when the artwork changes.
 * Run this locally and commit the output in public/.
 *
 * Sources live in frontend/art/ and are not served.
 * ==========================================================================*/

const SRC = 'frontend/art'
const OUT = 'frontend/public'

/** WebP for browsers that take it, JPEG so nothing is left without an image. */
const JOBS = [
  {
    src: 'hero_scene.jpeg',
    out: 'hero/hero-scene',
    // The hero is full-bleed. 1920 covers most desktops without shipping a
    // 3x file to a phone; the 960 variant is what small screens actually load.
    widths: [1920, 960],
    quality: 78,
  },
  {
    src: 'classical_colonnade.png',
    out: 'scenes/colonnade',
    // Sits behind the Programme and RSVP sections at low opacity, so it can
    // take heavier compression than the hero without anyone noticing.
    widths: [1600],
    quality: 70,
  },
  {
    src: 'seri_negara_dialogue_logo.png',
    out: 'brand/logo',
    // Rendered at ~220px wide in the header; 2x covers retina.
    // Native artwork is ~350px wide and renders at roughly half that in the
    // header, so no upscaling is needed for retina.
    widths: [700],
    quality: 90,
    autocrop: true,
  },
  {
    src: 'heritage_mansion_drawing.jpeg',
    out: 'scenes/heritage',
    // A sepia architectural rendering, supplied on a near-white ground with no
    // alpha. Autocrop trims the empty margin so the drawing can be sized by
    // the building rather than its whitespace; the component then blends the
    // remaining white into the cream section with mix-blend-multiply.
    widths: [1100],
    quality: 84,
    autocrop: true,
  },
  {
    src: 'seri_negara_dialogue_logo.png',
    out: 'brand/emblem',
    // Just the arch and mansion, no wordmark. A stacked lockup is illegible in
    // a 64px header bar, so the header pairs this mark with live HTML text --
    // which also keeps the wordmark translatable and sharp at any size.
    widths: [320],
    quality: 92,
    autocrop: true,
    // Fraction of the cropped artwork height to keep from the top.
    topFraction: 0.565,
  },
]

const ensure = (p) => fs.mkdirSync(path.dirname(p), { recursive: true })
const kb = (p) => (fs.statSync(p).size / 1024).toFixed(0) + ' KB'

/**
 * Finds the real artwork inside a logo supplied on a printed-style card.
 *
 * sharp's own .trim() is no help here: the card has a soft vignette, so every
 * edge pixel differs slightly from its neighbour and nothing gets trimmed. We
 * instead measure distance from the corner colour and keep only pixels far
 * enough away to be ink rather than gradient.
 */
async function contentBox(file, threshold = 120, pad = 6) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const bg = [data[0], data[1], data[2]]

  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels
      const d =
        Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2])
      if (d <= threshold) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }

  if (maxX <= minX || maxY <= minY) return null

  const left = Math.max(0, minX - pad)
  const top = Math.max(0, minY - pad)
  return {
    left,
    top,
    width: Math.min(width - left, maxX - minX + 1 + pad * 2),
    height: Math.min(height - top, maxY - minY + 1 + pad * 2),
  }
}

for (const job of JOBS) {
  const srcPath = path.join(SRC, job.src)
  if (!fs.existsSync(srcPath)) {
    console.log(`  SKIP  ${job.src} — not found in ${SRC}/`)
    continue
  }

  for (const [i, width] of job.widths.entries()) {
    // The widest variant keeps the plain name so existing markup can point at
    // it; narrower ones get a -<width> suffix for srcset.
    const suffix = i === 0 ? '' : `-${width}`
    const base = path.join(OUT, job.out + suffix)
    ensure(base)

    let img = sharp(srcPath)
    if (job.crop) img = img.extract(job.crop)
    if (job.autocrop) {
      const box = await contentBox(srcPath)
      if (box) {
        if (job.topFraction) box.height = Math.round(box.height * job.topFraction)
        img = img.extract(box)
      }
      else console.log(`  WARN  ${job.src} — could not find artwork bounds, using full frame`)
    }
    img = img.resize({ width, withoutEnlargement: true })

    await img.clone().webp({ quality: job.quality }).toFile(`${base}.webp`)
    await img.clone().jpeg({ quality: job.quality, mozjpeg: true }).toFile(`${base}.jpg`)

    const meta = await sharp(`${base}.webp`).metadata()
    console.log(
      `  ${job.out}${suffix}`.padEnd(28) +
        `${meta.width}x${meta.height}`.padEnd(12) +
        `webp ${kb(base + '.webp')}`.padEnd(16) +
        `jpg ${kb(base + '.jpg')}`,
    )
  }
}

console.log('\nDone. Commit the files in frontend/public/.')
