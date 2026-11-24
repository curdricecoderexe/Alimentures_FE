# Alimenture — Landing Page Design System

Seed.com-inspired editorial layout, coloured from the Alimenture logo.

> seed.com does not publish a `designs.md` (both `/designs.md` and `/design.md` return 404),
> and its CSS sits behind a Cloudflare challenge. This file captures Seed's layout and UX
> patterns as observed on its homepage, re-expressed in Alimenture's own brand colours.
> No Seed assets, copy, or trademarks are used.

---

## 1. Colour — sampled from `public/logo.png` (plum · amber · sandalwood)

Logo scan: petals/wordmark run `#C80088` (pink) → `#D4148F` → **`#B0128F`** → `#6A1A8A`; bee/“PRIVATE LIMITED” **`#F8A830`**; flower centre `#5C3410`.
The brand colour is a **pink→violet blend** from the logo wordmark: pink `#D4148F` → mix `#B0128F` → violet `#6A1A8A`, exposed as `--brand-gradient` / `bg-brand` / `.text-brand-gradient`. Token names `berry` / `plum` are kept for compatibility. Tailwind `violet-*` is remapped to plum shades.

| Token | Hex | Role |
|---|---|---|
| `berry` (logo plum) | `#B0128F` | Primary buttons, links, accents, `<em>` in headlines |
| `berry-bright` | `#D4148F` | Hover glows, gradients |
| `berry-deep` | `#6A1A8A` | Dark plum text, shadows |
| `berry-tint` | `#FBE9F5` | Icon chips, soft fills |
| `plum` / `plum-deep` | `#7A1E96` / `#3A0A40` | Deep plum gradients |
| `night` / `night-soft` | `#2B0B33` / `#3A1042` | Hero, closing CTA and footer fields (darkened logo plum — Seed's deep green equivalent) |
| `gold-light` | `#F8A830` | Logo amber: badges, headline emphasis on dark, wordmark |
| `gold` | `#C7801A` | Gold text/icons on light backgrounds |
| `gold-tint` | `#FEF3E0` | Warm washes |
| `cream` (sandal-light) | `#F7F0E3` | Page background |
| `cream-deep` / `sandal` / `sandal-deep` | `#EBDDC3` / `#E6D3B3` / `#CDB48A` | Product plates, hairlines, warm surfaces |
| `paper` | `#FFFDF9` | Cards and panels |
| `ink` / `ink-soft` / `ink-muted` | `#1F1726` / `#574D60` / `#8A8193` | Text |

**Rules**
- Plum carries the action. Gold carries highlight and promo. Sandal carries the surface.
- On dark `night` fields: headline in `#FFFDF9`, emphasis in `gold-light`, CTA `.btn-light`.
- Never put `gold-light` text on sandal (low contrast); use `gold`.

**Seed shape language:** large curved panels (`rounded-hero` = 40px, 28px on mobile) inset 8–12px from the viewport edge, 28px cards, fully rounded 52px pill buttons, and outlined `.chip-code` pills.

## 2. Typography

| Role | Class | Spec |
|---|---|---|
| Section headline | `.headline` | Outfit 500, tracking −0.03em, line-height 1.04, balanced wrap. Sizes 2.1–5.25rem. |
| Headline emphasis | `.headline em` | Not italic: berry colour (Seed emphasises with colour, not weight). |
| Eyebrow label | `.eyebrow` | Outfit 600, 0.72rem, uppercase, tracking 0.16em, preceded by an 8px brand dot "●". |
| Body | Tailwind `font-sans` | Plus Jakarta Sans, 15–17px, `ink-soft`, relaxed leading. |
| Big stat | `.headline` at text-5xl–7xl | Number in berry, unit (`%`) in gold-light. |

Seed's voice is **large and light**: oversized headlines at medium weight, never heavy 800/900 display type in section heads.

---

## 3. Components

| Component | Class | Notes |
|---|---|---|
| Primary button | `.btn-pill` | Fully rounded, 52px, solid plum, hover → `night`. Flat. `.btn-pill-sm` = 38px. |
| Light / gold buttons | `.btn-light`, `.btn-gold` | For dark fields (Seed's cream \"Take the Quiz\") and promos. |
| Promo badge | `.badge-gold` | Small gold pill above the hero headline. |
| Code chip | `.chip-code` | Outlined pill on product cards (Seed's DS-01® chip). |
| Secondary button | `.btn-outline` | Transparent with a 1px ink/22% hairline; hover tints berry. |
| Text link | `.link-arrow` | Underlined label plus arrow ("Shop now →"); the gap widens on hover. |
| Eyebrow | `.eyebrow`, `.eyebrow-gold`, `.eyebrow-light` | Replaces the old pill-shaped kickers. |
| Dividers | `border-ink/10` | Hairline rules between list rows and stat cells. |

---

## 4. Section patterns (landing page order)

| # | Section | Seed pattern it follows | Component |
|---|---|---|---|
| 1 | Hero | Dark brand field with curves, badge, light headline, light pill and arrow link, admin slideshow in a rounded stage | `Home.jsx` |
| 2 | Benefit band | \"Benefits you can feel in 7 days\": one line plus a 4-up icon panel | `BenefitBand` |
| 2b | **Craft spotlight** | "● ViaCap® Technology": full-bleed photo with a slow zoom, a frosted glass panel, headline, pill, glass stat card and a product anatomy with dotted leader lines | `CraftSpotlight` |
| 4 | Featured products | Product grid | `Home.jsx` |
| 5 | **Shop by need** | "Whole-body benefits start here": stacked rows of name, one line and "Shop now" | `CategoryRows` |
| 6 | Catalog | Product grid | `Home.jsx` |
| 7 | Catalogue download / Trust pillars | Benefit cards | existing |
| 8 | **Farm to pantry timeline** | "Benefits in 7 days / 2 weeks / 4 weeks / 3 months": numbered milestones on a rail | `ProcessTimeline` |
| 9 | Brand film | Video explainer | `BrandFilm` |
| 10–15 | Lineup, grains, purpose, story, 3S, crafting, commitment | Editorial / science blocks | existing, restyled |
| 16 | **Closing bookend** | "Change your gut health for good.": one line and one CTA on a brand field | `ClosingCta` |

New sections live in `src/components/home/SeedSections.jsx`.

**Recurring rhythm (every section):** eyebrow → headline → one short paragraph → one CTA.

---

## 5. Layout & spacing

- Content max-width `1240px`; gutters `px-4 / sm:px-6 / lg:px-8`.
- Section padding `py-16` on mobile and `sm:py-28` from tablet up, for generous, unhurried whitespace.
- Editorial split: 12-column grid, headline in 8 columns and support copy plus CTAs in 4 (aligned to the bottom).
- Category rows: a sticky heading column on the left (4 columns) and a list on the right (8 columns).

## 6. Motion

- Entrances only: `Reveal` (fade plus 26px rise, `cubic-bezier(.16,1,.3,1)`, 0.7s), staggered 50–80ms.
- No ambient floating blobs or grid overlays on the landing page.
- Everything collapses to static under `prefers-reduced-motion`.

## 7. Content guardrails

Seed backs its claims with clinical footnotes. Alimenture copy must only state facts the business can stand behind (ingredients, FSSAI registration, baked in Chennai, grain count). Do not add health-outcome or timeline claims ("feel results in 7 days") without substantiation.

## Navigation (Seed pattern)

- **Two floating frosted pills.** Left: logo, **Shop ▾**, Our Story, Sustainability, Philosophy. Right: search, wishlist, cart, and **Sign in** (or the account menu when logged in). They get more opaque on scroll.
- **Shop mega-menu** (`src/components/nav/ShopMenu.jsx`). Opens on hover or click and closes on Escape or navigation. Admin → Categories run down the left (thumbnail and product count). The hovered category's first 4 products are on the right (photo, name, "from ₹"). "Shop all products →" sits at the bottom.
- **Search** is a dropdown under the right pill. It shows category chips when empty and live results once you type.
- **Mobile drawer:** a "Shop by category" tile grid plus a gradient "Shop all products" button.

## Illustration (from docs/Untitled design.pdf)

The catalogue frames every page with **engraved botanical line art**: millet and sorghum heads, gold wheat and long veined leaves, drawn in fine single-colour plum strokes on cream. The site recreates this as original SVG in `src/components/home/BotanicalArt.jsx`. Nothing is copied from the PDF; the art is drawn in code, so it stays crisp, light and recolourable.

- `MilletSpray` / `WheatSpray`: corner frames. Keep them at section edges, behind content (`pointer-events-none`), and never under body text.
- `SpotMillet`, `SpotWholeGrain`, `SpotSugarcane`, `SpotSeal`: 56px spot illustrations for tiles, set on a `.plate-sandal` square.
- Colours: plum `#B0128F` with gold `#C7801A` accents.
- Used in: the Benefit band ("Alimenture bakes you can feel good about").

## Premium tones (buttons & footer)

Derived from a logo scan: petals and wordmark sit at hue ≈310° with 86–94% saturation, which is too loud for large surfaces. Premium tones keep the exact hue and lower the saturation.

| Token | Hex | HSL | Use | White text contrast |
|---|---|---|---|---|
| `mulberry` | `#7C276E` | 310° 52% 32% | All primary buttons (`.btn-pill`, `.btn-brand`, `.btn-berry`, `bg-mulberry`) | 8.9 : 1 |
| `mulberry-deep` | `#5F1C54` | 310° 55% 24% | Button hover | 11.8 : 1 |
| `mulberry-tint` | `#F7EDF6` | 310° 40% 95% | Soft fills | n/a |
| `aubergine` | `#542650` → `#401C3E` | 306° / 304°, ~40% | Footer gradient (never black) | 11.9 : 1 |

The bright `berry` plum (`#B0128F`) stays for small text accents and links.
