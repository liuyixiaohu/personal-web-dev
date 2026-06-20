# Brand Guidelines: kunli.co

> Historical lookup for kunli.co. The authoritative cross-repository Design
> System is `personal-web-console/src/pages/design-system.astro`, published at
> `workbench.kunli.co/design-system`. Tokens live in `src/styles/global.css` and
> must match the Console repository exactly.

---

## Design Philosophy

1. **Minimal**: Page depth ≤ 3. Dependencies in single digits. No framework where static HTML will do. If it doesn't serve a purpose, it doesn't exist.
2. **Warm**: The palette was refined from a deeply loved character -- 小龙格林, a little dragon. Warm like the character itself.
3. **Personal**: Who I am, not what I've done.

---

## Colors

**Rules:**

- Never use `#000000`. Use `--text` (`#1f2328`) for all dark text.
- Only use colors from this approved palette. No exceptions.
- `rgba(0, 0, 0, 0.03-0.08)` is allowed for subtle borders, dividers, and hover backgrounds.
- `#ffffff` is allowed for inverse text on colored backgrounds only.

| Hex       | CSS Variable      | Category     | Usage                                 |
| --------- | ----------------- | ------------ | ------------------------------------- |
| `#faf7f2` | `--bg`            | Warm Neutral | Page background                       |
| `#f3efe7` | -                 | Warm Neutral | Subtle background variation           |
| `#e4ddd2` | -                 | Warm Neutral | Warm border / card background         |
| `#e2ded8` | `--border`        | Warm Neutral | Default border color                  |
| `#ddeee7` | `--bubble-visual` | Green        | Light green background                |
| `#a8d7c6` | -                 | Green        | Mid green accent                      |
| `#d6e6f3` | `--bubble-ds`     | Blue         | Light blue background                 |
| `#7a9ab4` | `--color-ds-mid`  | Blue         | Mid blue interactive text             |
| `#7fb6dd` | -                 | Blue         | Life Journey accent                   |
| `#f0d7d7` | `--bubble-pm`     | Pink         | Light pink background                 |
| `#d9797b` | `--color-rose`    | Pink         | Strong pink/rose accent               |
| `#8a939b` | -                 | Gray         | Subtle / decorative                   |
| `#5a636b` | `--text-light`    | Text         | Secondary/muted text (WCAG AA 5.73:1) |
| `#1f2328` | `--text`          | Text         | Primary text                          |

### Professional Area Accents

| Area              | Hex       |
| ----------------- | --------- |
| Product Marketing | `#9a6868` |
| Data Science      | `#5a7a94` |
| Visual Design     | `#5a8a6e` |
| Life Journey      | `#7fb6dd` |

---

## Typography

### Fonts

**English: EB Garamond** -- Humanist serif, elegant, warm, literary.
Weights: 400, 500, 600 (+ italic 400). Source: Google Fonts CDN.

**Chinese: LXGW WenKai (霞鹜文楷)** -- Kai style, handwritten warmth.
Source: cdnjs CDN.

**Pairing rationale:** Both share a "hand-written elegance" quality. EB Garamond has calligraphic DNA from Renaissance humanism; LXGW WenKai derives from Japanese Klee One with modern kai warmth.

### Type Scale: Major Third (1.25x)

Root font-size is fluid: `clamp(1rem, 0.9rem + 0.5vw, 1.25rem)`

| Level       | Size                                           | Usage                   |
| ----------- | ---------------------------------------------- | ----------------------- |
| `--fs-base` | `clamp(1rem, 0.9rem + 0.5vw, 1.25rem)`         | Body text               |
| `--fs-xs`   | `0.75rem`                                      | Labels, tags, badges    |
| `--fs-md`   | `1.25rem`                                      | Subheadings, nav titles |
| `--fs-lg`   | `clamp(1.4375rem, 1.39rem + 0.26vw, 1.563rem)` | Page headings           |
| `--fs-xl`   | `clamp(1.75rem, 1.7rem + 0.38vw, 1.953rem)`    | Hero / display headings |

### Typography Rhythm

All vertical spacing uses `em` units (scales with font size).

| Relationship          | Spacing  |
| --------------------- | -------- |
| Paragraph → Paragraph | `0.75em` |
| Heading → Body        | `0.75em` |
| Body → Heading        | `1.5em`  |

**Letter-spacing:** `-0.01em` (large headings), `0` (default), `0.05em` (small uppercase)

**Line-height:** `1.2` (display) → `1.3` (heading) → `1.4` (subheading) → `1.6` (body) → `1.8` (long-form) → `1.5` (caption). Exception: `1` for icon buttons.

### Rules

- No hardcoded font sizes; always use scale variables.
- Decorative display type and relative `em` sizing may be exceptions only when
  an inline lint suppression explains why a token would change the intended
  relationship.
- Chinese text: never italicize.
- Weights by role:
  - Page titles (h1) and section headings (h2): **700** acceptable for top-level emphasis.
  - Sub-headings (h3), inline `<strong>`, primary buttons, table headers: **600**.
  - Dates, captions, version badges, small utility labels: **500**.

---

## Spacing

Fluid scale using `clamp()`, adapts to viewport width.

| Variable     | Value                            |
| ------------ | -------------------------------- |
| `--space-xs` | `clamp(0.5rem, 1vw, 0.75rem)`    |
| `--space-sm` | `clamp(0.75rem, 1.5vw, 1.25rem)` |
| `--space-md` | `clamp(1rem, 2vw, 2rem)`         |
| `--space-lg` | `clamp(1.5rem, 3vw, 3rem)`       |
| `--space-xl` | `clamp(2rem, 5vw, 5rem)`         |

---

## Layout

Three content width tracks:

| Track   | Width | Usage                                 |
| ------- | ----- | ------------------------------------- |
| Content | 36rem | Body text, prose, navigation          |
| Wide    | 44rem | Tools, tables, wider media            |
| Full    | 100%  | Full-bleed images, immersive sections |

---

## Component Patterns

### Buttons

- Default: `1px solid` border, `--fs-xs`, `--radius-md`
- Primary (inverted): dark background, light text

### Cards / List Items

- Bottom border: `1px solid` at low opacity
- Title: `--fs-md`, weight 500
- Description: `--fs-xs`, `--text-light`

### Pills / Filters

- Small font (~0.72rem), tight padding
- `1px solid` border, `--radius-sm`
- Active state: subtle background fill, stronger border

### Hover States

- **Text links**: opacity `0.7`
- **Bordered controls** (buttons, pills, cards): border-color darkens, optional subtle background
- **Accent elements** (map labels, arrows): color changes to accent

### Transitions

- Micro-interactions (buttons, pills): `0.15s`
- Links and opacity changes: `0.2s`
- View transitions: `0.4s ease-in-out`

### Reference implementations

The visual primitives are exercised in production on `/events`. Refer to:

- `src/components/events/EventCard.svelte` — card / list-item pattern
- `src/components/events/EventFilters.svelte` — pill / filter chip pattern
- `src/styles/global.css` — button, link, dot-separator styles

---

## Border Radius

| Variable        | Value  | Usage                         |
| --------------- | ------ | ----------------------------- |
| `--radius-sm`   | `3px`  | Pills, badges, small controls |
| `--radius-md`   | `6px`  | Buttons, inputs, cards        |
| `--radius-lg`   | `12px` | Modals, overlays, large cards |
| `--radius-full` | `50%`  | Circles, avatars              |

---

## Shadow / Elevation

All shadows use black at 0.04-0.08 opacity for warmth.

| Variable      | Value                         | Usage                  |
| ------------- | ----------------------------- | ---------------------- |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,0.08)` | Popups, floating cards |

---

## Accessibility

### Color Contrast (WCAG AA)

| Color                            | Ratio     | Status          |
| -------------------------------- | --------- | --------------- |
| `--text` (#1f2328)               | 14.78:1   | AA pass         |
| `--text-light` (#5a636b)         | 5.73:1    | AA pass         |
| Accent colors (#5a7a94, #5a8a6e) | 3.7-4.2:1 | AA large only   |
| Rose (#d9797b)                   | 2.82:1    | Decorative only |

### Focus States

- Keyboard: `2px solid` green outline with `2px` offset
- Mouse: no visible focus ring (intentional)

### Reduced Motion

All animations and transitions disabled when user prefers reduced motion.

---

## Images & Media

- All images must have descriptive alt text
- Max width: 100%
- Content images: `--radius-lg` border radius

---

## Logo / Favicon

**Mark:** Serif "K" in EB Garamond on cream background.

| Format | Size     | Usage                       |
| ------ | -------- | --------------------------- |
| SVG    | scalable | Modern browsers (preferred) |
| PNG    | 32px     | Browser tab fallback        |
| PNG    | 256px    | High-res, social sharing    |
| PNG    | 180px    | iOS home screen             |

Colors: `--bg` (#faf7f2) background, `--text` (#1f2328) fill.

---

## Responsive Strategy

- **Primary approach**: Fluid scaling via `clamp()`, no breakpoints for most things.
- **System breakpoints**: `52rem` (tablet) and `32rem` (mobile), defined in `global.css`.
- Some legacy components still use ad-hoc px-based breakpoints (`480px`, `600px`, etc.); migrate them when touched.
- Grid system handles responsive content width automatically.

---

## Analytics

**Guiding principle**: Track only which pages people visit and how long they stay — nothing else.

- Stack: a single `gtag.js` snippet for GA4 (no Tag Manager, no `dataLayer` wrapper) — see `BaseLayout.astro`.
- Track: `page_view` (sent on each view-transition navigation) + automatic engagement time.
- Don't track: custom interaction events, scroll, outbound clicks, or form events. Disable GA4 Enhanced Measurement sub-events except Page views.
- Skipped hosts: `localhost` and `*.pages.dev` preview deploys — only real `kunli.co` visits count.

---

## History

Earlier versions of these notes lived at the public `/brand` page (deleted v0.5 → 2026-05-17). The page was 731 lines of static markup for an audience of one; this Markdown lookup replaces it.
