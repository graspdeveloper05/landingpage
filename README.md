# Seri Negara Dialogue 2026

Website for the inaugural Seri Negara Dialogue — 8 October 2026, Muzium Negara,
Kuala Lumpur, convened by Chevening Alumni Malaysia.

React + TypeScript + Tailwind + Vite. Laravel backend to follow; the frontend
talks to a single seam (`src/services/api.ts`) so it drops in without component
changes.

```bash
npm install
npm run dev
```

## Docs

- [`docs/HANDOVER.md`](docs/HANDOVER.md) — how to run it, where content lives, pre-launch checklist
- [`docs/API-CONTRACT.md`](docs/API-CONTRACT.md) — the endpoints Laravel must implement
- [`docs/PLACEHOLDERS.md`](docs/PLACEHOLDERS.md) — **every invented person and piece of content**

Built to the approved UI/UX concept: navy and gold, Playfair Display over
Source Sans 3, gold ornament dividers, scroll reveals and a parallax hero.

## Status

Five routes, four languages, working registration with capacity control and CSV
export. Lighthouse mobile: accessibility 100, best practices 100, SEO 100.

Speaker, programme and imagery content is placeholder — read
`docs/PLACEHOLDERS.md` before showing this to anyone outside the team.

## Regenerating content

```bash
node scripts/build-locales.mjs         # rebuild all four locale files
node scripts/generate-placeholders.mjs # rebuild placeholder imagery
```

The client brief specifies WordPress; this build deliberately does not follow
that. See the deviation note at the end of `docs/HANDOVER.md`.
