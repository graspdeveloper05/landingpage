# Image specification

Every image slot on the site, with the size to export at. Sizes are ~2× the
largest rendered size, so they stay sharp on retina without shipping anything
wasteful.

**Send the largest version you have into `frontend/art/` and stop there.** Do
not resize, compress or convert — `frontend/scripts/optimise-images.mjs`
produces every web variant (WebP, JPEG, phone-sized) and the components point
at its output. Optimising twice only loses quality.

---

## 1. Hero background

| | |
|---|---|
| **Export** | **2400 × 1000** |
| Ratio | 2.4 : 1 (very wide) |
| Nearest AI preset | 21:9, or 1536×640 upscaled |
| File | `art/heritage_mansion_skyline.png` |
| Background | Full-bleed photograph |

The headline sits over the **left 45%**, on a cream gradient that fades out
toward the right. So:

- Keep the building, skyline and flag in the **right two-thirds**
- Nothing important in the left third — it is covered by "MANY HISTORIES."
- Bright, warm, low-contrast on the left so navy text stays readable
- Rendered at 1379 × 750 on a 1360px screen; also crops to 960 × 347 on phones,
  so the subject must survive a **centre crop to 2.77:1**

---

## 2. About — building drawing

| | |
|---|---|
| **Export** | **1400 × 900** |
| Ratio | ~1.55 : 1 |
| Nearest AI preset | 3:2 (1536 × 1024) |
| File | `art/heritage_mansion_drawing.jpeg` |
| Background | **Pure white `#FFFFFF`**, or transparent PNG |

Sits directly on the cream section with no card, border or shadow. The white is
removed with `mix-blend-multiply`, so:

- A cream, grey or off-white ground will show as a **visible box** — it must be
  pure white or transparent
- Leave a small even margin around the building; the script auto-crops to the
  artwork
- Rendered at 465 × 301

---

## 3. Programme + RSVP backdrop

| | |
|---|---|
| **Export** | **2000 × 1400** |
| Ratio | ~1.43 : 1 |
| Nearest AI preset | 3:2 or 4:3 |
| File | `art/classical_colonnade.png` |

Used twice: behind the Programme timeline under a 95% cream veil, and behind
the RSVP panel at 6% opacity on navy. So:

- **Calm and even** — no strong focal point, it must never compete with text
- Avoid high contrast or busy detail in the centre
- Rendered up to 1345 × 981, so it needs real resolution despite being faint

---

## 4. Theme quote card

| | |
|---|---|
| **Export** | **1000 × 620** |
| Ratio | 1.6 : 1 |
| Nearest AI preset | 16:10 |
| File | not yet supplied — currently reuses the hero |

Sits inside a navy card at 25% opacity with a gold quote mark and italic text
over it. Anything atmospheric works — skyline, façade detail, interior.

---

## 5. Speaker portraits — 8 needed

| | |
|---|---|
| **Export** | **700 × 840 each** |
| Ratio | **5 : 6 portrait** |
| Nearest AI preset | 2:3 (1024 × 1536), then crop |
| Files | `art/portrait-01.jpg` … `portrait-08.jpg` |

The last real gap. Rendered at 276 × 331 in the grid and 4:5 in the profile
modal, so:

- **Head in the upper third**, shoulders visible, nothing near the edges
- Consistent background across all eight — plain, light, or a matching setting.
  Mixed backgrounds make the grid look assembled from stock
- Even lighting; the cards sit on cream and dark portraits punch holes in it
- `portrait-08` is the moderator and carries a gold MODERATOR ribbon top-right —
  keep that corner uncluttered

---

## 6. Chairman portrait

| | |
|---|---|
| **Export** | **700 × 840** |
| Ratio | 5 : 6 |
| File | `art/portrait-chairman.jpg` |

Rendered larger than the speakers at 320 × 384, inside a thin gold frame.

---

## 7. Logo

| | |
|---|---|
| **Export** | **1200 × 1100** (full lockup) |
| Background | **Transparent PNG preferred** |
| File | `art/seri_negara_dialogue_logo.png` |

The current file has a cream card baked in with no alpha, which forces two
workarounds: `mix-blend-multiply` on the ivory header, and a light plate behind
it on the navy footer. **A transparent PNG or SVG removes both.**

The header emblem (arch + mansion, no wordmark) is cut from this automatically —
no separate export needed.

---

## 8. Social share card

| | |
|---|---|
| **Export** | **1200 × 630** |
| Ratio | 1.9 : 1 — fixed by Facebook, WhatsApp, LinkedIn |

Currently generated from the hero. A purpose-made card with the logo and event
details would be stronger, since this is the first thing anyone sees when the
link is forwarded (§11).

Keep text well inside the edges — WhatsApp crops the preview differently again.

---

## 9. Favicon

| | |
|---|---|
| **Export** | **512 × 512** |
| Background | Transparent |

Just the emblem, no wordmark — it renders at 16 × 16 in a browser tab.

---

## Summary

| Slot | Size | Ratio | Have it? |
|---|---|---|---|
| Hero background | 2400 × 1000 | 2.4:1 | ✅ |
| About drawing | 1400 × 900 | 1.55:1 | ✅ |
| Programme/RSVP backdrop | 2000 × 1400 | 1.43:1 | ✅ |
| Theme quote card | 1000 × 620 | 1.6:1 | ❌ |
| Speaker portraits ×8 | 700 × 840 | 5:6 | ❌ |
| Chairman portrait | 700 × 840 | 5:6 | ❌ |
| Logo (transparent) | 1200 × 1100 | — | ⚠️ no alpha |
| Share card | 1200 × 630 | 1.9:1 | ⚠️ from hero |
| Favicon | 512 × 512 | 1:1 | ⚠️ generated |

## Regenerating

```bash
npm install --no-save sharp
node frontend/scripts/optimise-images.mjs
```

Then commit whatever lands in `frontend/public/`.
