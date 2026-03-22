# Brand Guidelines: kunli.co

> Visual design system for Kun Li's personal brand.
> Live showcase: [kunli.co/brand](https://kunli.co/brand)

---

## Design Principles

1. **Minimal**: Page depth ≤ 3. Dependencies in single digits. No framework where static HTML will do. If it doesn't serve a purpose, it doesn't exist.
2. **Warm**: The palette was refined from a deeply loved character -- 小龙格林, a little dragon. Warm like the character itself.
3. **Personal**: Who I am, not what I've done.

---

## Colors

**Rules:**
- Never use `#000000`. Use `--text` (`#1F2328`) for all dark text.
- Only use colors from this approved palette. No exceptions.
- `rgba(0, 0, 0, 0.03-0.08)` is allowed for subtle borders, dividers, and hover backgrounds.
- `#FFFFFF` is allowed for inverse text on colored backgrounds only.

### Core Palette

| Hex | CSS Variable | Category | Usage |
|---|---|---|---|
| `#FAF7F2` | `--bg` | Warm Neutral | Page background |
| `#F3EFE7` | - | Warm Neutral | Subtle background variation |
| `#E4DDD2` | - | Warm Neutral | Warm border / card background |
| `#E2DED8` | `--border` | Warm Neutral | Default border color |
| `#DDEEE7` | `--bubble-visual` | Green | Light green background |
| `#A8D7C6` | - | Green | Mid green accent |
| `#D6E6F3` | `--bubble-ds` | Blue | Light blue background |
| `#7FB6DD` | - | Blue | Blue accent (Life Journey) |
| `#7A9AB4` | `--color-ds-mid` | Blue | Mid blue accent (Data Science) |
| `#F0D7D7` | `--bubble-pm` | Pink | Light pink background |
| `#D9797B` | - | Pink | Strong pink/rose accent |
| `#5A636B` | `--text-light` | Text | Secondary/muted text (WCAG AA 5.73:1) |
| `#1F2328` | `--text` | Text | Primary text |

### Professional Area Accents

| Area | Hex |
|---|---|
| Product Marketing | `#9a6868` |
| Data Science | `#5a7a94` |
| Visual Design | `#5a8a6e` |
| Life Journey | `#7FB6DD` |

---

## Typography

### Fonts

**English: EB Garamond**
- Source: Google Fonts CDN
- Weights: 400, 500, 600, 700 (+ italic 400i, 500i)
- Character: Humanist serif, elegant, warm, literary

**Chinese: LXGW WenKai (霞鹜文楷)**
- Source: cdnjs CDN
- Character: Kai (楷书) style, handwritten warmth

**Pairing rationale:** Both share a "hand-written elegance" quality. EB Garamond has calligraphic DNA from Renaissance humanism; LXGW WenKai derives from Japanese Klee One with modern kai warmth.

### Type Scale: Major Third (1.25×)

| Level | Size | Usage |
|---|---|---|
| `--fs-xs` | `0.75rem` | Labels, tags, captions, secondary text |
| `--fs-sm` | `0.8rem` | Secondary text, descriptions, captions |
| (base) | `1rem` | Body text |
| `--fs-md` | `1.25rem` | Subheadings, nav titles |
| `--fs-lg` | `1.563rem` | Page headings |
| `--fs-xl` | `1.953rem` | Hero / display headings |

Root font-size is fluid: `clamp(1rem, 0.9rem + 0.5vw, 1.25rem)`

### Typography Rules

- No hardcoded font sizes; always use scale variables.
- Chinese text: never italicize.
- Use weight 500 or 600 for emphasis (keeps elegance over bold 700).

---

## Spacing

Fluid scale using `clamp()`, adapts to viewport width.

| Variable | Value |
|---|---|
| `--space-xs` | `clamp(0.5rem, 1vw, 0.75rem)` |
| `--space-sm` | `clamp(0.75rem, 1.5vw, 1.25rem)` |
| `--space-md` | `clamp(1rem, 2vw, 2rem)` |
| `--space-lg` | `clamp(1.5rem, 3vw, 3rem)` |
| `--space-xl` | `clamp(2rem, 5vw, 5rem)` |

### Typography Rhythm

All vertical spacing uses `em` units so it scales proportionally with font size.

| Relationship | Spacing | Rationale |
|---|---|---|
| **Paragraph → Paragraph** | `0.75em` | Same-level content, light separation |
| **Heading → Body** | `0.75em` | Same as paragraph spacing for consistent rhythm |
| **Body → Heading** | `1.5em` | New section, strongest visual break |

**Letter-spacing by size:**

| Size | Letter-spacing | Rationale |
|---|---|---|
| `--fs-xl`, `--fs-lg` | `-0.01em` | Large text looks tighter |
| body, `--fs-md` | `0` (default) | Normal tracking |
| `--fs-xs` (Overline) | `0.05em` | Small uppercase needs air |

**Line-height by level:**
`1.2` (display) → `1.3` (heading) → `1.4` (subheading) → `1.6` (body) → `1.8` (long-form) → `1.5` (caption)

---

## Layout

Three content width tracks:

| Track | Width | Usage |
|---|---|---|
| Content | 36rem | Body text, prose, navigation |
| Wide | 44rem | Tools, tables, wider media |
| Full | 100% | Full-bleed images, immersive sections |

---

## Component Patterns

### Buttons

- Default: `1px solid` border, `--fs-xs`, `--radius-md`
- Primary (inverted): dark background, light text
- Transitions: `0.15s`

### Cards / List Items

- Bottom border: `1px solid` at low opacity
- Title: `--fs-md`, weight 500
- Description: `--fs-xs`, `--text-light`

### Pills / Filters

- Small font (~0.72rem), tight padding
- `1px solid` border, `--radius-sm`
- Active state: subtle background fill, stronger border

### Links

- Color: `--text`
- No underline by default
- Hover: `opacity 0.7`

### Hover States

- **Text links**: opacity reduction (`0.7`)
- **Bordered controls** (buttons, pills, cards): border-color darkens, optional subtle background
- **Accent elements** (map labels, arrows): color changes to accent

### Transitions

- Micro-interactions (buttons, pills): `0.15s`
- Links and opacity changes: `0.2s`
- View transitions: `0.4s ease-in-out`

---

## Border Radius

| Variable | Value | Usage |
|---|---|---|
| `--radius-sm` | `3px` | Pills, badges, small controls |
| `--radius-md` | `6px` | Buttons, inputs, cards |
| `--radius-lg` | `12px` | Modals, overlays, large cards |
| `--radius-full` | `50%` | Circles, avatars |

---

## Shadow / Elevation

All shadows use black at 0.04--0.08 opacity for warmth.

| Variable | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 2px 12px rgba(0,0,0,0.08)` | Dropdowns, tooltips |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,0.08)` | Popups, floating cards |
| `--shadow-lg` | `0 8px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)` | Modals, full overlays |

---

## Accessibility

### Color Contrast (WCAG AA)

All text colors must meet 4.5:1 against `--bg` for normal text, 3:1 for large text (18px+ or 14px bold).

| Color | Ratio | Status |
|---|---|---|
| `--text` (#1F2328) | 14.78:1 | AA pass |
| `--text-light` (#5A636B) | 5.73:1 | AA pass |
| Accent colors (#5a7a94, #5a8a6e) | 3.7--4.2:1 | AA large only |
| Rose (#D9797B) | 2.82:1 | Decorative only |

### Focus States

- Keyboard navigation: `2px solid` green outline with `2px` offset
- Mouse clicks: no visible focus ring (intentional)
- Never remove focus styles without a visible alternative

### Reduced Motion

All animations and transitions are disabled when the user prefers reduced motion (respects OS preference).

---

## Images & Media

- All images must have descriptive alt text
- Max width: 100%
- Content images: `--radius-lg` border radius

---

## Logo / Favicon

**Mark:** Serif "K" in EB Garamond on cream background.

| Format | Size | Usage |
|---|---|---|
| SVG | scalable | Modern browsers (preferred) |
| PNG | 32px | Browser tab fallback |
| PNG | 256px | High-res, social sharing |
| PNG | 180px | iOS home screen |

Colors: `--bg` (#FAF7F2) background, `--text` (#1F2328) fill.

---

## Responsive Strategy

- **Primary approach**: Fluid scaling via `clamp()`, no breakpoints for most things.
- **Single breakpoint**: `480px` for layout-level changes only.
- Grid system handles responsive content width automatically.
