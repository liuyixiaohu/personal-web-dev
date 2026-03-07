# Brand Guidelines — kunli.co

> Developer reference for the visual design system.
> Live showcase: [kunli.co/brand](https://kunli.co/brand)

---

## Design Principles

1. **Minimal** — Less is more. No decoration for decoration's sake.
2. **Fast** — Static HTML, zero unnecessary JS, CDN fonts.
3. **Warm** — Cream tones, serif fonts, literary voice.
4. **Bilingual** — Every visible text has English and Chinese via `data-i18n`.

---

## Colors

**Rules:**
- Never use `#000000`. Use `--text` (`#1F2328`) for all dark text.
- Only use colors from this approved palette. No exceptions.

### Core Palette

| Hex | CSS Variable | Category | Usage |
|---|---|---|---|
| `#FAF7F2` | `--bg` | Warm Neutral | Page background |
| `#F3EFE7` | — | Warm Neutral | Subtle background variation |
| `#E4DDD2` | — | Warm Neutral | Warm border / card background |
| `#DDEEE7` | `--bubble-visual` | Green | Light green background |
| `#A8D7C6` | — | Green | Mid green accent |
| `#D6E6F3` | `--bubble-ds` | Blue | Light blue background |
| `#7FB6DD` | — | Blue | Blue accent (Life Journey) |
| `#F0D7D7` | `--bubble-pm` | Pink | Light pink background |
| `#D9797B` | — | Pink | Strong pink/rose accent |
| `#8A939B` | `--text-light` | Text | Secondary/muted text |
| `#5A636B` | — | Text | Mid-tone text |
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

**English — EB Garamond**
- Source: Google Fonts CDN
- Weights: 400, 500, 600, 700 (+ italic 400i, 500i)
- Character: Humanist serif, elegant, warm, literary

**Chinese — LXGW WenKai (霞鹜文楷)**
- Source: cdnjs CDN (`lxgw-wenkai-web`)
- Character: Kai (楷书) style, handwritten warmth

**Pairing rationale:** Both share a "hand-written elegance" quality. EB Garamond has calligraphic DNA from Renaissance humanism; LXGW WenKai derives from Japanese Klee One with modern kai warmth.

```css
--font-body: 'EB Garamond', Garamond, 'Times New Roman', serif;
--font-zh: 'LXGW WenKai', 'PingFang SC', 'Microsoft YaHei', sans-serif;
```

### Type Scale — Major Third (1.25×)

| Variable | Ratio | Value | Usage |
|---|---|---|---|
| `--fs-xs` | — | `0.75rem` | Labels, tags, captions, secondary text |
| (base) | 1.25⁰ | `1rem` | Body text |
| `--fs-md` | 1.25¹ | `1.25rem` | Subheadings, nav titles |
| `--fs-lg` | 1.25² | `1.563rem` | Page headings |
| `--fs-xl` | 1.25³ | `1.953rem` | Hero / display headings |

Root font-size is fluid: `--fs-base: clamp(1rem, 0.9rem + 0.5vw, 1.25rem)`

### Rules

- No hardcoded font sizes — always use scale variables.
- Chinese text: never italicize. Use `font-style: normal` override.
- Use weight 500 or 600 for emphasis (keeps elegance over bold 700).

---

## Spacing

Fluid scale using `clamp()` — adapts to viewport width.

| Variable | Value |
|---|---|
| `--space-xs` | `clamp(0.5rem, 1vw, 0.75rem)` |
| `--space-sm` | `clamp(0.75rem, 1.5vw, 1.25rem)` |
| `--space-md` | `clamp(1rem, 2vw, 2rem)` |
| `--space-lg` | `clamp(1.5rem, 3vw, 3rem)` |
| `--space-xl` | `clamp(2rem, 5vw, 5rem)` |

---

## Layout: Grid System

Named-line CSS Grid with three content tracks:

| Track | Width | Class | Usage |
|---|---|---|---|
| content | 36rem | (default) | Body text, prose, navigation |
| wide | 44rem | `.wide` | Tools, tables, wider media |
| full | 100% | `.full` | Full-bleed images, immersive sections |

```html
<main class="grid-page">
  <h1>Title</h1>                <!-- auto → content (36rem) -->
  <div class="wide">...</div>   <!-- wide (44rem) -->
  <div class="full">...</div>   <!-- full-bleed (100%) -->
</main>
```

```css
--grid-content: 36rem;
--grid-wide: 44rem;
--grid-gutter: var(--content-padding);  /* clamp(1rem, 4vw, 3rem) */
```

---

## Component Patterns

### Buttons

```css
/* Default */
padding: 0.5rem 1rem;
border: 1px solid var(--border);
border-radius: 4px;
font-size: var(--fs-xs);
transition: background 0.15s, border-color 0.15s;

/* Primary (inverted) */
background: var(--text);
color: var(--bg);
```

### Cards / List Items

```css
padding: 0.6rem 0;
border-bottom: 1px solid rgba(0, 0, 0, 0.04);
/* Title: --fs-md, weight 500 */
/* Description: --fs-xs, color --text-light */
```

### Pills / Filters

```css
font-size: 0.72rem;
padding: 0.2em 0.55em;
border: 1px solid rgba(0, 0, 0, 0.1);
border-radius: 3px;
/* Active: background rgba(0, 0, 0, 0.06), border rgba(0, 0, 0, 0.15) */
```

### Links

```css
color: var(--text);
text-decoration: none;
transition: opacity 0.2s ease;
/* Hover: opacity 0.7 */
```

### Transitions

- Micro-interactions (buttons, pills): `0.15s`
- Links and opacity changes: `0.2s`
- View transitions: `0.4s ease-in-out`

---

## Responsive Strategy

- **Primary approach**: Fluid scaling via `clamp()` — no breakpoints for most things.
- **Single breakpoint**: `@media (max-width: 480px)` for layout-level changes only.
- Grid system handles responsive content width automatically via `min()` function.

---

## i18n

All visible text uses `data-i18n` attributes for bilingual support (EN/ZH):

```html
<span data-i18n="key.name">English fallback</span>
```

- Translation keys defined in `src/i18n/translations.ts`
- Language state managed by `src/stores/langStore.ts`
- Chinese font applied via `html[data-lang="zh"]` selector in global CSS
- Svelte components use `getLang()` + `t()` from `langStore.ts`
