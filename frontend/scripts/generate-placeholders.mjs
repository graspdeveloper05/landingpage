import fs from 'node:fs'
import path from 'node:path'

/* ============================================================================
 * PLACEHOLDER IMAGERY GENERATOR
 * ----------------------------------------------------------------------------
 * Produces stand-ins matching the crops and tonal balance of the approved
 * UI/UX concept, so the layout can be judged before licensed photography
 * arrives. Replace the files in /public/hero, /public/scenes and
 * /public/portraits with the real assets at the same dimensions.
 *
 *   node scripts/generate-placeholders.mjs
 * ==========================================================================*/

const NAVY = '#0B2140'
const NAVY_D = '#071A33'
const GOLD = '#C9A227'
const GOLD_L = '#E7CE7E'
const CREAM = '#FBF8F1'

const out = (p) => path.join('public', p)
const ensure = (d) => fs.mkdirSync(d, { recursive: true })

/* -- Hero scene: skyline, heritage building, flag and attendees ------------ */
function heroScene() {
  const W = 1600
  const H = 900

  // Back skyline, kept pale so the headline stays dominant.
  let far = ''
  let x = -20
  const heights = [90, 140, 110, 175, 130, 200, 150, 120, 185, 145, 165, 105, 190, 135, 155, 115]
  for (const h of heights) {
    far += `<rect x="${x}" y="${620 - h}" width="52" height="${h + 90}" rx="2"/>`
    x += 64
  }

  // Landmark towers, mid-ground.
  const towers = `
    <g fill="#8FA6BE" opacity="0.55">
      <path d="M1052 640V330c0-12 7-19 17-22l12-58 12 58c10 3 17 10 17 22v310z"/>
      <path d="M1142 640V330c0-12 7-19 17-22l12-58 12 58c10 3 17 10 17 22v310z"/>
      <rect x="1094" y="436" width="56" height="8"/>
      <path d="M1272 640V392h22v248z"/>
      <ellipse cx="1283" cy="386" rx="29" ry="21"/>
      <rect x="1279" y="342" width="8" height="26"/>
    </g>`

  // Heritage building, the focal mid-ground element.
  const win = [372, 420, 560, 608]
    .map((wx) => `<rect x="${wx}" y="556" width="34" height="54" fill="#1B3E68" opacity="0.24"/>`)
    .join('')
  const pil = [360, 412, 464, 528, 580, 626]
    .map((px) => `<rect x="${px}" y="620" width="10" height="46" fill="#E6DECC"/>`)
    .join('')
  const building = `
    <g>
      <rect x="348" y="500" width="300" height="166" fill="#F7F3EA" stroke="#DED5C1"/>
      <path d="M330 500L498 412l168 88z" fill="#A9614C" stroke="#8B4B39"/>
      <rect x="470" y="566" width="56" height="100" fill="#A9614C" opacity="0.8"/>
      ${win}
      ${pil}
    </g>`

  // Flag, fully inside the frame.
  let stripes = ''
  for (let i = 0; i < 7; i++) {
    stripes += `<rect x="4" y="${5 + i * 14}" width="164" height="7" fill="#CC0001"/>`
  }
  const flag = `
    <g transform="translate(1372 296)">
      <rect x="0" y="0" width="4" height="248" fill="#9AA1A8"/>
      <rect x="4" y="5" width="164" height="98" fill="#FBF8F1"/>
      ${stripes}
      <rect x="4" y="5" width="86" height="56" fill="#1B3E68"/>
      <circle cx="38" cy="33" r="15" fill="#C9A227"/>
      <circle cx="45" cy="30" r="12" fill="#1B3E68"/>
      <path d="M66 22l3 9 9 1-7 6 2 9-7-5-8 5 2-9-6-6 9-1z" fill="#C9A227"/>
    </g>`

  // Attendees, as calm silhouettes rather than faces — a stand-in for the
  // group photograph, sized so they read as people at a glance.
  const figures = [
    { x: 940, s: 1.0, c: '#2A4A6E' },
    { x: 1020, s: 1.14, c: '#1B3E68' },
    { x: 1108, s: 0.96, c: '#345C82' },
    { x: 1186, s: 1.08, c: '#22456A' },
    { x: 1268, s: 0.92, c: '#3B6288' },
    { x: 1344, s: 1.03, c: '#1B3E68' },
  ]
  const people = figures
    .map(({ x: fx, s, c }) => {
      const head = 20 * s
      const headY = 666 - 108 * s
      const bodyTop = headY + head + 6 * s
      const halfW = 34 * s
      const shoulder = 26 * s
      return `<g fill="${c}" opacity="0.88">
        <circle cx="${fx}" cy="${headY}" r="${head}"/>
        <path d="M${fx - halfW} 700
          V${bodyTop + shoulder}
          q0-${shoulder} ${halfW - head * 0.72}-${shoulder}
          h${head * 1.44}
          q${halfW - head * 0.72} 0 ${halfW - head * 0.72} ${shoulder}
          V700 Z"/>
      </g>`
    })
    .join('')

  const trees = [110, 224, 760, 862]
    .map((cx) => `<ellipse cx="${cx}" cy="646" rx="76" ry="52"/>`)
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" preserveAspectRatio="xMidYMax slice">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#CADCEF"/><stop offset="48%" stop-color="#E9EEF4"/><stop offset="100%" stop-color="#F8F2E6"/>
    </linearGradient>
    <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FBF8F1" stop-opacity="0"/><stop offset="100%" stop-color="#FBF8F1"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <circle cx="1150" cy="330" r="104" fill="#FFF6DF" opacity="0.55"/>
  <g fill="#A6B9CD" opacity="0.32">${far}</g>
  ${towers}
  <g fill="#5E8767" opacity="0.4">${trees}</g>
  ${building}
  ${flag}
  ${people}
  <rect x="0" y="640" width="${W}" height="260" fill="url(#haze)"/>
</svg>`
}

/* -- Group of attendees, right edge of the hero ---------------------------- */
function people() {
  const W = 780
  const H = 900
  const skin = ['#C9A98C', '#B3856A', '#D6BB9E', '#A97C5F', '#C29A78', '#BE9070']
  const wear = ['#1B3E68', '#7C1F2E', '#2F5D4A', '#3C3F55', '#6B4A7A', '#264B6B']
  const figures = [
    { x: 150, y: 430, r: 62 },
    { x: 330, y: 336, r: 70 },
    { x: 520, y: 404, r: 65 },
    { x: 246, y: 566, r: 58 },
    { x: 452, y: 590, r: 56 },
    { x: 646, y: 526, r: 60 },
  ]

  const body = figures
    .map((f, i) => {
      const w = f.r * 2.05
      return `<g>
      <path d="M${f.x - w} ${H} c0-${f.r * 2.2} ${f.r}-${f.r * 3.2} ${w} -${f.r * 3.2} s${w} ${f.r} ${w} ${f.r * 3.2}z" fill="${wear[i % wear.length]}"/>
      <circle cx="${f.x}" cy="${f.y}" r="${f.r}" fill="${skin[i % skin.length]}"/>
    </g>`
    })
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">
  <defs>
    <linearGradient id="fadeL" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FBF8F1"/><stop offset="30%" stop-color="#FBF8F1" stop-opacity="0"/>
    </linearGradient>
  </defs>
  ${body}
  <rect width="${W}" height="${H}" fill="url(#fadeL)"/>
</svg>`
}

/* -- Heritage building illustration, About section ------------------------- */
function heritage() {
  const win = [150, 206, 374, 430]
    .map((x) => `<rect x="${x}" y="252" width="40" height="66" fill="#1B3E68" opacity="0.28"/>`)
    .join('')
  const col = [134, 200, 266, 354, 420, 466]
    .map((x) => `<rect x="${x}" y="336" width="11" height="64" fill="#E2DAC8"/>`)
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="620" height="460" viewBox="0 0 620 460" role="img">
  <rect x="120" y="200" width="380" height="200" fill="#F6F2E9" stroke="#DCD3BF"/>
  <path d="M96 200L310 92l214 108z" fill="#8C4A38" stroke="#6F3A2C"/>
  <rect x="278" y="270" width="64" height="130" fill="#8C4A38" opacity="0.82"/>
  ${win}
  ${col}
  <rect x="110" y="398" width="400" height="8" fill="#E2DAC8"/>
</svg>`
}

/* -- Colonnade backdrop, Programme section --------------------------------- */
function colonnade() {
  const W = 1600
  const H = 900
  let cols = ''
  for (let i = 0; i < 9; i++) {
    const x = 60 + i * 180
    cols += `<g opacity="0.92">
      <rect x="${x}" y="180" width="58" height="556" fill="#EFE7D6"/>
      <rect x="${x - 12}" y="150" width="82" height="34" fill="#E6DCC6"/>
      <rect x="${x - 12}" y="732" width="82" height="26" fill="#E6DCC6"/>
      <path d="M${x - 12} 150 q41-58 82 0z" fill="#F4EDDE"/>
    </g>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">
  <defs><linearGradient id="fl" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#FFFDF7"/><stop offset="100%" stop-color="#E8DFCB"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#fl)"/>
  <rect y="736" width="${W}" height="164" fill="#DCD1B8"/>
  ${cols}
</svg>`
}

/* -- Crest -------------------------------------------------------------- */
function crest(stroke) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120" role="img">
  <g fill="none" stroke="${stroke}" stroke-width="2.6" stroke-linejoin="round">
    <path d="M60 10l42 21v35c0 27-19 44-42 52-23-8-42-25-42-52V31z"/>
    <path d="M38 78V56l22-15 22 15v22"/>
    <path d="M30 78h60M52 78V64h16v14"/>
  </g>
  <circle cx="60" cy="32" r="4" fill="${stroke}"/>
</svg>`
}

/* -- Speaker portraits ---------------------------------------------------- */
function portrait(seed) {
  let s = seed >>> 0
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
  const skin = ['#C9A98C', '#B58A6E', '#D6BB9E', '#A97C5F', '#C29A78', '#BE9070']
  const suits = ['#22405F', '#2C3A4C', '#3B3F49', '#5C2B33', '#2E4F45', '#414059']
  const shirts = ['#F2EFE7', '#E8E4DA', '#EDE9DF']
  const tone = skin[Math.floor(rnd() * skin.length)]
  const suit = suits[Math.floor(rnd() * suits.length)]
  const shirt = shirts[Math.floor(rnd() * shirts.length)]

  // Head sized like a real headshot crop: roughly a sixth of the frame,
  // sitting in the upper third, with shoulders filling the base.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="720" viewBox="0 0 600 720" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F5F1E8"/><stop offset="100%" stop-color="#E4DDCD"/>
    </linearGradient>
  </defs>
  <rect width="600" height="720" fill="url(#bg)"/>

  <!-- shoulders -->
  <path d="M118 720c0-104 58-176 138-196h88c80 20 138 92 138 196z" fill="${suit}"/>
  <!-- collar and shirt -->
  <path d="M256 524h88l-18 44-26 30-26-30z" fill="${shirt}"/>
  <!-- neck -->
  <path d="M270 470h60v66c0 12-14 20-30 20s-30-8-30-20z" fill="${tone}" opacity="0.92"/>
  <!-- head -->
  <ellipse cx="300" cy="382" rx="86" ry="102" fill="${tone}"/>
  <!-- hair -->
  <path d="M214 372c0-58 38-98 86-98s86 40 86 98c0-34-38-52-86-52s-86 18-86 52z" fill="#3A2E28" opacity="0.75"/>
  <rect x="0" y="714" width="600" height="6" fill="#C9A227" opacity="0.45"/>
</svg>`
}

/* -- Social share card ---------------------------------------------------- */
function og() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${NAVY_D}"/><stop offset="100%" stop-color="${NAVY}"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="46" y="46" width="1108" height="538" fill="none" stroke="${GOLD}" stroke-opacity="0.45"/>
  <text x="600" y="236" text-anchor="middle" font-family="Georgia,serif" font-size="76" fill="${CREAM}">MANY HISTORIES.</text>
  <text x="600" y="322" text-anchor="middle" font-family="Georgia,serif" font-size="76" fill="${GOLD_L}">ONE FUTURE.</text>
  <rect x="530" y="362" width="140" height="1" fill="${GOLD}"/>
  <text x="600" y="416" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="26" fill="${CREAM}" letter-spacing="4">SERI NEGARA DIALOGUE 2026</text>
  <text x="600" y="482" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="21" fill="#B9C6D6">8 October 2026 · 2.30 PM · Muzium Negara, Kuala Lumpur</text>
</svg>`
}

function favicon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="${NAVY}"/>
  <g fill="none" stroke="${GOLD}" stroke-width="3" stroke-linejoin="round">
    <path d="M32 11l19 10v17c0 13-9 21-19 25-10-4-19-12-19-25V21z"/>
    <path d="M23 41V30l9-7 9 7v11"/>
  </g>
</svg>`
}

ensure(out('hero'))
ensure(out('scenes'))
ensure(out('portraits'))

fs.writeFileSync(out('hero/hero-scene.svg'), heroScene())
fs.writeFileSync(out('hero/people.svg'), people())
fs.writeFileSync(out('scenes/heritage.svg'), heritage())
fs.writeFileSync(out('scenes/colonnade.svg'), colonnade())
fs.writeFileSync(out('crest-gold.svg'), crest(GOLD))
fs.writeFileSync(out('crest-navy.svg'), crest(NAVY))
fs.writeFileSync(out('og-image.svg'), og())
fs.writeFileSync(out('favicon.svg'), favicon())

for (let i = 1; i <= 8; i++) {
  fs.writeFileSync(out(`portraits/placeholder-0${i}.svg`), portrait(4000 + i * 911))
}
fs.writeFileSync(out('portraits/placeholder-chair.svg'), portrait(31337))

console.log('placeholder imagery generated')
