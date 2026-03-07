# Changelog

## 2026-03-07 (Site v0.8)

### Refactored (DRY & design tokens)
- Centralized accent colors (`--color-pm`, `--color-ds`, `--color-visual`, `--color-journey`, `--color-rose`) in `global.css`
- Extracted shared `.back-link` and `.item` list styles to `global.css`
- Created `JournalPage.astro` layout — 3 journal pages reduced from ~42 to 5 lines each
- Created `ProfessionalDetail.astro` layout — 3 detail pages reduced from ~41 to 10 lines each
- Replaced all hardcoded hex colors with CSS variables across 6 components
- Fixed hardcoded `16px` font-size in `MapScene.svelte` (now `1rem`)
- Standardized spacing with `var(--space-lg)` instead of magic `2.5rem` values
- Net reduction: ~300 lines removed

## 2026-03-01

### Removed (dead code cleanup)
- Removed `@sanity/client` dependency from `package.json` (unused)
- Deleted dead Sanity CMS config files: `sanity.config.ts`, `sanity.cli.ts`, `schemaTypes/index.ts`
- Removed unused `BERKELEY_FALLBACK` constant in `src/utils/weather.ts`
- Removed unused `weatherLoaded` flag in `src/components/bar/RobotBarScene.svelte`
