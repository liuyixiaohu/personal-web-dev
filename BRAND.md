# Brand Reference

Internal design-system notes for kunli.co. Tokens live in `src/styles/global.css` — this doc is just a lookup.

## Principles

- **Minimal** — Page depth ≤ 3. Dependencies in single digits. No framework where static HTML will do. If it doesn't serve a purpose, it doesn't exist.
- **Warm** — Palette refined from 小龙格林, a little dragon.
- **Personal** — Who I am, not what I've done.

## Color palette

| Group | Hex | CSS var | Role |
|---|---|---|---|
| Cream | `#FAF7F2` | `--bg` | Page background |
| Cream | `#F3EFE7` | — | Subtle variation |
| Cream | `#E4DDD2` | — | Warm border |
| Green | `#DDEEE7` | `--bubble-visual` | Tag background |
| Green | `#A8D7C6` | — | Accent |
| Green | `#5a8a6e` | `--color-visual` | Text |
| Blue | `#D6E6F3` | `--bubble-ds` | Tag background |
| Blue | `#7FB6DD` | — | Accent |
| Blue | `#5a7a94` | `--color-ds` | Text |
| Pink | `#F0D7D7` | `--bubble-pm` | Tag background |
| Pink | `#D9797B` | — | Accent |
| Pink | `#9a6868` | `--color-pm` | Text |
| Gray | `#8A939B` | — | Subtle / decorative |
| Gray | `#5A636B` | `--text-light` | Secondary text |
| Gray | `#1F2328` | `--text` | Primary text |

## Typography

- English: **EB Garamond**
- Chinese: **LXGW WenKai · 霞鹜文楷**

Type scale (Major Third, 1.25×):

| Token | Size | Weight | Line height | Role |
|---|---|---|---|---|
| `--fs-xl` | 1.953rem | 500 | 1.2 | Page title |
| `--fs-lg` | 1.563rem | 500 | 1.3 | Section heading |
| `--fs-md` | 1.25rem | 500 | 1.4 | Subheading |
| base | 1rem | 400 | 1.6 | Body |
| `--fs-xs` | 0.75rem | 400 | 1.5 | Caption / label |
| `--fs-xs` | 0.75rem | 600 | 1.5 | Section label (uppercase, letter-spacing 0.05em) |

## Spacing

Fluid scale via `clamp()`:

| Token | Range |
|---|---|
| `--space-xs` | `clamp(0.5rem, 1vw, 0.75rem)` |
| `--space-sm` | `clamp(0.75rem, 1.5vw, 1.25rem)` |
| `--space-md` | `clamp(1rem, 2vw, 2rem)` |
| `--space-lg` | `clamp(1.5rem, 3vw, 3rem)` |
| `--space-xl` | `clamp(2rem, 5vw, 5rem)` |

## Layout

Three named-line CSS Grid tracks:

- `full` — 100% width
- `wide` — 44rem
- `content` — 36rem

Breakpoints unified to **52rem** (tablet) and **32rem** (mobile).

## Components

The visual primitives are exercised in production on `/events`. Refer to:

- `src/components/events/EventCard.svelte` — card / list-item pattern
- `src/components/events/EventFilters.svelte` — pill / filter chip pattern
- `src/styles/global.css` — button, link, dot-separator styles

## History

Earlier versions of these notes lived at the public `/brand` page (deleted v0.5 → 2026-05-17). The page was 731 lines of static markup for an audience of one; this Markdown lookup replaces it.
