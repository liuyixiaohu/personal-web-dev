# personal-web-dev

Public personal site at **kunli.co**. See `README.md` for the overview.

## Design system — read this before touching any UI

This repo is the source of truth for design tokens, which live in `src/styles/global.css`. The public brand page (**kunli.co/brand**, `src/pages/brand.astro`) describes the visual identity. The private workbench (**personal-web-console**) copies the `:root` token block and is checked against this repo. Check `global.css` before adding or changing styles, and prefer extending existing tokens over inventing new ones.

Rules, enforced in CI:

- **Use design tokens, never literal values.** Colors come from `var(--color-*)`, `var(--bg)`, `var(--text)`, … — never raw hex or named colors. Likewise `--space-*`, `--fs-*`, `--radius-*`, `--shadow-md`. (`rgba()`/gradients and pure white/black are allowed.) Enforced by `npm run lint:css` (stylelint).
- **One typeface.** No monospace font stacks, except code blocks (`<code>`/`<pre>`).
- **Tokens are shared across both repos.** The `:root` block in `src/styles/global.css` must stay byte-identical to personal-web-console's; that repo's CI guard fails on drift. Any token add/remove/change must land in **both** repos in lockstep.
- **Reuse the shared primitives** defined in `global.css` instead of re-implementing: `.back-link`, `.page-shell`, `.section`, `.list-row`, `.pill`, etc.

## Gates (run before pushing)

`npm run check` (types) · `npm run lint:css` (design) · `npm run format:check` · `npm run build` · `npm run test:journey` · `npm run test:tooltips`.

Branch off `main` and open a PR; the team squash-merges.
