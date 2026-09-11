/*
 * docs/USER-MANUAL.md  ->  docs/Seri-Negara-Dialogue-2026-User-Manual.pdf
 *
 *   node scripts/build-manual-pdf.mjs
 *
 * The Markdown stays the source of truth: edit it, run this, hand the client
 * the PDF. Nothing to install -- it renders through the Chrome already on the
 * machine, driven over the DevTools protocol so the pages can carry a footer
 * with real page numbers (the plain --print-to-pdf flag cannot).
 *
 * The converter below handles only the Markdown this one document uses:
 * headings, paragraphs, tables, lists, task lists, blockquotes, rules and
 * inline emphasis/code/links. It is not a general Markdown implementation and
 * is not meant to become one.
 */

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = join(ROOT, 'docs', 'USER-MANUAL.md')
const OUT = join(ROOT, 'docs', 'Seri-Negara-Dialogue-2026-User-Manual.pdf')

const BRAND = {
  title: 'Seri Negara Dialogue 2026',
  subtitle: 'Website User Manual',
  footer: 'Seri Negara Dialogue 2026 · Website User Manual',
}

/* ── Markdown ─────────────────────────────────────────────────────────── */

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Heading -> anchor, matching the slugs GitHub generates, so the table of
 * contents in the Markdown keeps working as clickable links inside the PDF.
 */
function slug(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
}

function inline(raw) {
  // Code spans are pulled out before anything else, so `**not bold**` inside
  // one survives as literal text.
  const code = []
  let s = raw.replace(/`([^`]+)`/g, (_, c) => {
    code.push(c)
    return `\u0000${code.length - 1}\u0000`
  })

  s = escapeHtml(s)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, href) => `<a href="${href}">${t}</a>`)
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(^|[\s(—])\*([^*]+)\*/g, '$1<em>$2</em>')

  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${escapeHtml(code[Number(i)])}</code>`)
}

const cells = (row) =>
  row
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim())

function render(markdown) {
  const lines = markdown.split(/\r?\n/)
  const out = []
  let i = 0
  let sections = 0

  const flushParagraph = (buf) => {
    if (buf.length) out.push(`<p>${inline(buf.join(' '))}</p>`)
    buf.length = 0
  }
  const para = []

  while (i < lines.length) {
    const line = lines[i]

    // Horizontal rules only separated sections in the Markdown; in print the
    // page break does that job, so they are dropped rather than drawn.
    if (/^---+\s*$/.test(line)) {
      flushParagraph(para)
      i++
      continue
    }

    if (!line.trim()) {
      flushParagraph(para)
      i++
      continue
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/)
    if (heading) {
      flushParagraph(para)
      const level = heading[1].length
      const text = inline(heading[2])
      const id = slug(heading[2])
      if (level === 2) {
        // Every numbered section starts a fresh page -- except the first,
        // which follows the cover.
        out.push(`<h2 id="${id}"${sections++ ? ' class="break"' : ''}>${text}</h2>`)
      } else {
        out.push(`<h${level} id="${id}">${text}</h${level}>`)
      }
      i++
      continue
    }

    // Table: a pipe row followed by a |---| separator.
    if (line.trim().startsWith('|') && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] ?? '')) {
      flushParagraph(para)
      const head = cells(line)
      i += 2
      const body = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        body.push(cells(lines[i]))
        i++
      }
      // A table whose header row is blank is a two-column layout, not a
      // table with headings -- don't print an empty header band.
      const headed = head.some((c) => c !== '')
      out.push(
        '<table>' +
          (headed
            ? `<thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead>`
            : '') +
          `<tbody>${body
            .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`)
            .join('')}</tbody>` +
          '</table>',
      )
      continue
    }

    if (line.startsWith('> ')) {
      flushParagraph(para)
      const quote = []
      while (i < lines.length && lines[i].startsWith('>')) {
        quote.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      out.push(`<blockquote>${inline(quote.join(' '))}</blockquote>`)
      continue
    }

    const bullet = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/)
    if (bullet) {
      flushParagraph(para)
      const ordered = /\d/.test(bullet[2])
      const items = []
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)$/)
        if (!m) {
          // A wrapped continuation line belongs to the item above it.
          if (items.length && lines[i].trim() && /^\s{2,}\S/.test(lines[i])) {
            items[items.length - 1] += ' ' + lines[i].trim()
            i++
            continue
          }
          break
        }
        items.push(m[3])
        i++
      }
      const li = items
        .map((text) => {
          const task = text.match(/^\[( |x|X)\]\s+(.*)$/)
          if (task) {
            return `<li class="task"><span class="box">${
              task[1] === ' ' ? '' : '✓'
            }</span>${inline(task[2])}</li>`
          }
          return `<li>${inline(text)}</li>`
        })
        .join('')
      out.push(`<${ordered ? 'ol' : 'ul'}${items[0]?.startsWith('[') ? ' class="tasks"' : ''}>${li}</${ordered ? 'ol' : 'ul'}>`)
      continue
    }

    para.push(line.trim())
    i++
  }
  flushParagraph(para)
  return out.join('\n')
}

/* ── Page ─────────────────────────────────────────────────────────────── */

const CSS = `
:root {
  --navy: #0B2140;
  --navy-700: #1B3A63;
  --gold: #C9A227;
  --ink: #16202E;
  --slate: #5A6474;
  --hair: #DDDCD8;
  --cream: #FAF8F3;
}

/* Nirmala UI and Microsoft YaHei are named explicitly: the manual quotes the
   Tamil and Chinese language names, and the default stack renders them as
   boxes in print. */
@page { size: A4; margin: 18mm 16mm 20mm; }

* { box-sizing: border-box; }

body {
  margin: 0;
  color: var(--ink);
  font: 10.5pt/1.55 "Segoe UI", "Nirmala UI", "Microsoft YaHei", system-ui, sans-serif;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

h1, h2, h3, h4 {
  font-family: Georgia, "Playfair Display", serif;
  color: var(--navy);
  font-weight: 600;
  line-height: 1.25;
}

h2 {
  margin: 0 0 1.1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--gold);
  font-size: 17pt;
}
h2.break { break-before: page; }

h3 {
  margin: 1.5rem 0 0.5rem;
  font-size: 12.5pt;
  color: var(--navy-700);
}

p { margin: 0 0 0.7rem; }

a { color: var(--navy-700); text-decoration: none; border-bottom: 0.5pt solid var(--hair); }

code {
  font-family: "Cascadia Mono", Consolas, monospace;
  font-size: 0.88em;
  background: var(--cream);
  border: 0.5pt solid var(--hair);
  border-radius: 2px;
  padding: 0.05em 0.3em;
}

strong { color: var(--navy); }

/* Tables carry most of this manual's reference content, so they must never
   split across a page and lose their heading row. */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.5rem 0 1rem;
  font-size: 9.5pt;
  break-inside: avoid;
}
thead th {
  background: var(--navy);
  color: var(--cream);
  text-align: left;
  font-weight: 600;
  font-size: 8.5pt;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.42rem 0.55rem;
}
td {
  border-bottom: 0.5pt solid var(--hair);
  padding: 0.42rem 0.55rem;
  vertical-align: top;
}
tbody tr:nth-child(even) { background: #FBFAF7; }
table:not(:has(thead)) td:first-child { width: 30%; color: var(--navy); font-weight: 600; }

ul, ol { margin: 0 0 0.8rem; padding-left: 1.15rem; }
li { margin-bottom: 0.28rem; }
ol { counter-reset: none; }

ul.tasks { list-style: none; padding-left: 0; }
li.task { display: flex; gap: 0.5rem; align-items: flex-start; }
li.task .box {
  flex: none;
  width: 0.78rem;
  height: 0.78rem;
  margin-top: 0.16rem;
  border: 0.75pt solid var(--navy-700);
  border-radius: 1.5px;
  font-size: 7pt;
  line-height: 0.72rem;
  text-align: center;
  color: var(--gold);
}

blockquote {
  margin: 0.8rem 0;
  padding: 0.6rem 0.85rem;
  background: var(--cream);
  border-left: 2.5pt solid var(--gold);
  break-inside: avoid;
}

/* ── Cover ── */
.cover {
  break-after: page;
  height: 245mm;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.cover .rule { width: 54pt; height: 2.5pt; background: var(--gold); margin-bottom: 1.6rem; }
.cover h1 {
  margin: 0;
  font-size: 30pt;
  letter-spacing: -0.01em;
}
.cover .sub {
  margin: 0.5rem 0 0;
  font-family: Georgia, serif;
  font-size: 17pt;
  color: var(--gold);
}
.cover .lede {
  margin: 2.2rem 0 0;
  max-width: 118mm;
  color: var(--slate);
  font-size: 11pt;
  line-height: 1.7;
}
.cover .where {
  margin-top: 2.4rem;
  padding-top: 1rem;
  border-top: 0.5pt solid var(--hair);
  font-size: 9.5pt;
  color: var(--slate);
}
.cover .where b { display: inline-block; min-width: 34mm; color: var(--navy); font-weight: 600; }
.cover .foot { margin-top: auto; font-size: 8.5pt; color: var(--slate); letter-spacing: 0.04em; }
`

function page(bodyHtml) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${BRAND.title} — ${BRAND.subtitle}</title>
<style>${CSS}</style></head>
<body>${bodyHtml}</body></html>`
}

/* ── Chrome ───────────────────────────────────────────────────────────── */

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean)
  const found = candidates.find((p) => existsSync(p))
  if (!found) {
    throw new Error(
      'No Chrome or Edge found. Set CHROME_PATH to the browser executable and run again.',
    )
  }
  return found
}

/** Minimal CDP client -- enough to open a page and print it. */
function connect(url) {
  return new Promise((ok, fail) => {
    const ws = new WebSocket(url)
    const pending = new Map()
    const listeners = []
    let id = 0

    ws.addEventListener('open', () =>
      ok({
        send(method, params = {}, sessionId) {
          const msg = { id: ++id, method, params, ...(sessionId ? { sessionId } : {}) }
          ws.send(JSON.stringify(msg))
          return new Promise((res, rej) => pending.set(msg.id, { res, rej }))
        },
        once(method) {
          return new Promise((res) => listeners.push({ method, res }))
        },
        close: () => ws.close(),
      }),
    )
    ws.addEventListener('error', () => fail(new Error(`Cannot reach Chrome at ${url}`)))
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data)
      if (m.id && pending.has(m.id)) {
        const { res, rej } = pending.get(m.id)
        pending.delete(m.id)
        m.error ? rej(new Error(`${m.error.message} (${JSON.stringify(m.error)})`)) : res(m.result)
        return
      }
      for (let n = listeners.length - 1; n >= 0; n--) {
        if (listeners[n].method === m.method) listeners.splice(n, 1)[0].res(m.params)
      }
    })
  })
}

async function waitForEndpoint(port, deadlineMs = 20000) {
  const until = Date.now() + deadlineMs
  for (;;) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`)
      if (r.ok) return (await r.json()).webSocketDebuggerUrl
    } catch {
      /* not listening yet */
    }
    if (Date.now() > until) throw new Error('Chrome did not open a debugging port in time.')
    await new Promise((r) => setTimeout(r, 150))
  }
}

const footerTemplate = `
<div style="width:100%;margin:0 16mm;padding-top:4mm;border-top:0.5px solid #DDDCD8;
            font:7pt 'Segoe UI',sans-serif;color:#5A6474;display:flex;justify-content:space-between;">
  <span>${BRAND.footer}</span>
  <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
</div>`

async function main() {
  if (!existsSync(SOURCE)) throw new Error(`Not found: ${SOURCE}`)
  // Normalised to LF: the cover is split off by locating a line-ending-
  // sensitive marker, and an editor that saved CRLF would otherwise make that
  // search miss and print the title page twice.
  const markdown = readFileSync(SOURCE, 'utf8').replace(/\r\n/g, '\n')

  // The cover is built from the document's own opening, which is then dropped
  // from the flow so it is not printed twice. Failing to find the marker would
  // silently print that opening a second time, so it is an error, not a
  // fallback.
  const split = markdown.indexOf('\n---\n')
  if (split === -1) throw new Error('No "---" rule after the title block in USER-MANUAL.md.')
  const body = markdown.slice(split + 5)
  const cover = `
<section class="cover">
  <div class="rule"></div>
  <h1>${BRAND.title}</h1>
  <p class="sub">${BRAND.subtitle}</p>
  <p class="lede">For the organising team. No technical knowledge assumed.<br><br>
     This manual explains what the website is, what every part of it does, and
     how to run it yourself — editing content, managing registrations and
     reading your visitor numbers — without calling a developer.</p>
  <div class="where">
    <p><b>Public website</b> serinegaradialogue.org</p>
    <p><b>Admin panel</b> serinegaradialogue.org/admin</p>
  </div>
  <p class="foot">Chevening Alumni Malaysia · ${new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}</p>
</section>`

  const profile = mkdtempSync(join(tmpdir(), 'manual-pdf-'))
  // MANUAL_HTML_OUT writes the intermediate page somewhere it survives, for
  // checking the layout in a real browser window.
  const html = process.env.MANUAL_HTML_OUT
    ? resolve(process.env.MANUAL_HTML_OUT)
    : join(profile, 'manual.html')
  writeFileSync(html, page(cover + render(body)), 'utf8')

  const port = 9411 + (process.pid % 200)
  const chrome = spawn(
    findChrome(),
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--hide-scrollbars',
      'about:blank',
    ],
    { stdio: 'ignore' },
  )

  let client
  try {
    client = await connect(await waitForEndpoint(port))
    const { targetId } = await client.send('Target.createTarget', {
      url: pathToFileURL(html).href,
    })
    const { sessionId } = await client.send('Target.attachToTarget', { targetId, flatten: true })

    await client.send('Page.enable', {}, sessionId)
    const loaded = client.once('Page.loadEventFired')
    await client.send('Page.navigate', { url: pathToFileURL(html).href }, sessionId)
    await Promise.race([loaded, new Promise((r) => setTimeout(r, 8000))])

    const { data } = await client.send(
      'Page.printToPDF',
      {
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate,
      },
      sessionId,
    )

    mkdirSync(dirname(OUT), { recursive: true })
    const pdf = Buffer.from(data, 'base64')
    writeFileSync(OUT, pdf)
    console.log(`${OUT}  (${(pdf.length / 1024).toFixed(0)} KB)`)
  } finally {
    client?.close()
    chrome.kill()
    // Chrome needs a moment to release the profile before it can be removed.
    await new Promise((r) => setTimeout(r, 400))
    rmSync(profile, { recursive: true, force: true })
  }
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
