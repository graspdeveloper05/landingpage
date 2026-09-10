# Handover — Seri Negara Dialogue website

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle into dist/
npm run preview    # serve the built bundle
npm run typecheck
```

Node 20 or newer.

## Where the content lives

Everything the organising team will realistically change is in data files, not
components. No React knowledge is needed to edit them.

| To change | Edit |
|---|---|
| Speakers and moderator | `src/data/editions/2026/speakers.ts` |
| Chairman's message and quote | `src/data/editions/2026/speakers.ts` (bottom) |
| Programme timings | `src/data/editions/2026/programme.ts` |
| Date, venue, capacity, map | `src/data/editions/2026/event.ts` |
| Footer links | `src/data/quickLinks.ts` |
| All wording, in all four languages | `scripts/build-locales.mjs` |
| Placeholder imagery | `scripts/generate-placeholders.mjs` |

Photographs go in `public/portraits/` at **5:6** and are referenced by path from
the speaker records. See `PLACEHOLDERS.md` for every asset and its dimensions.

## Adding the 2027 edition

1. Copy `src/data/editions/2026/` to `src/data/editions/2027/`.
2. Register it in the `editions` map in `src/data/index.ts`.
3. Change `CURRENT_EDITION` to `2027`.

No routes, components or styles need to change.

## Translations

**Do not edit `src/i18n/locales/*.json` by hand — they are generated.** All four
languages come from one source in `scripts/build-locales.mjs`, where every
string is written as `L(en, ms, zh, ta)`. Edit there, then:

```bash
node scripts/build-locales.mjs
```

It rewrites all four files and verifies they hold identical keys. This is what
makes it impossible for one language to drift out of sync with the others.

`en` and `ms` are authored. `zh` and `ta` are marked
`"_status": "machine-translated, pending human review"` at the top of their
files — clear that flag once a native speaker has checked them.

To verify parity independently:

```bash
node -e "const fs=require('fs');const flat=(o,p='')=>Object.entries(o).flatMap(([k,v])=>v&&typeof v==='object'&&!Array.isArray(v)?flat(v,p+k+'.'):[p+k]);const L=['en','ms','zh','ta'].map(l=>flat(JSON.parse(fs.readFileSync('src/i18n/locales/'+l+'.json','utf8'))));const b=new Set(L[0]);L.forEach((k,i)=>console.log(['en','ms','zh','ta'][i], [...b].filter(x=>!k.includes(x)).length===0&&k.length===b.size?'OK':'MISMATCH'))"
```

## Before launch

- [ ] Replace every record marked `placeholder: true` with confirmed content
- [ ] Replace every generated asset in `public/` with real photography — see `PLACEHOLDERS.md` for the full list and dimensions
- [ ] Confirm the concept wording ("Many Histories. One Future.", "From Merdeka 70 towards Malaysia 100", the three pillars) is approved
- [ ] Replace `public/crest-*.svg` with the real Seri Negara crest
- [ ] Have a native speaker review `zh.json` and `ta.json`
- [ ] Point `robots.txt` and `sitemap.xml` at the real domain
- [ ] Stand up the Laravel API and set `VITE_API_BASE_URL` (see `API-CONTRACT.md`)
- [ ] Confirm the PDPA notice wording with whoever is accountable for the data
- [x] Analytics — built in, see below
- [ ] Confirm in writing before describing any organisation as a partner,
      supporter or sponsor — §10 of the brief forbids it otherwise

## Deviation from the client brief

The brief (§2) specifies WordPress. This build uses React, Tailwind and Vite,
with Laravel planned for the backend, on internal direction. Two consequences
the client has not yet been told about:

1. **Content editing.** The brief expects the organising team to make routine
   updates themselves. Here that means editing data files and redeploying, not
   logging into an admin panel. If self-service editing matters, a headless CMS
   or a small Laravel admin needs to be scoped.
2. **§15 handover.** The plugin-licence and WordPress-admin items in the brief
   do not apply. Ownership of the domain, hosting, repository, database and
   registration data still transfers as described.

## Analytics

§12 asks for "basic website analytics" alongside "privacy/PDPA considerations"
and a warning against unnecessary subscriptions. Those three pull in the same
direction, so the site counts its own visitors rather than handing them to
anyone else:

- **No cookies, no third party.** The page posts a path to this site's own
  Laravel app. Nothing is set in the browser and nothing leaves the server.
- **No cookie banner needed.** That is a direct consequence of the above, not
  an oversight. Google Analytics would have required one.
- **Nothing identifying is stored.** There is no IP column. Repeat visits
  within a day are matched by a hash of IP and browser salted with the app key
  *and today's date*, so the same person tomorrow is an unlinkable new number.
  The honest limit: daily unique counts, not a visitor history.
- **Referrers keep the host only** — `google.com`, not the words someone
  searched, which for a national event might be their own name.
- **Do Not Track is honoured**, and the admin panel's own pages are never
  counted.
- **Free, and nothing to renew.**

Read it at **/admin → Analytics**: visitors, page views, registrations and the
percentage of visitors who register, over 7, 30 or 90 days, with a per-day
chart and breakdowns by page, referrer and language.

### If the client wants Google Analytics as well

They may ask, because it is what they know. It can be added, but it changes
the privacy position: third-party cookies, attendee browsing sent abroad, and
a consent banner to be designed, translated into four languages and shown
before the tag loads. Raise that before agreeing, rather than after.

### Housekeeping

`page_views` grows by one row per page opened. At this event's scale that is
trivial, but it is attendee-adjacent data with no reason to be kept forever —
clear rows older than a year once the 2026 edition is closed out.
