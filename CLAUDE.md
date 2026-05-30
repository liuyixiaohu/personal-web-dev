# personal-web-dev

Public personal site at **kunli.co**. See `README.md` for the overview.

## Design system — read this before touching any UI

This repo and its sibling **personal-web-console** (the private workbench) share **one** design system, documented at **workbench.kunli.co/design-system** (the page lives in personal-web-console). It is the single source of truth for both. Check it before adding or changing styles, and prefer extending it over inventing something new.

Rules, enforced in CI:

- **Use design tokens, never literal values.** Colors come from `var(--color-*)`, `var(--bg)`, `var(--text)`, … — never raw hex or named colors. Likewise `--space-*`, `--fs-*`, `--radius-*`, `--shadow-md`. (`rgba()`/gradients and pure white/black are allowed.) Enforced by `npm run lint:css` (stylelint).
- **One typeface.** No monospace font stacks, except code blocks (`<code>`/`<pre>`).
- **Tokens are shared across both repos.** The `:root` block in `src/styles/global.css` must stay byte-identical to personal-web-console's; that repo's CI guard fails on drift. Any token add/remove/change must land in **both** repos in lockstep.
- **Reuse the documented primitives** instead of re-implementing: `.back-link`, `.page-shell`, `.section`, `.list-row`, `.pill`, the chapter table-of-contents, etc. (all shown on /design-system).

## Gates (run before pushing)

`npm run check` (types) · `npm run lint:css` (design) · `npm run format:check` · `npm run build` · `npm run test:journey` · `npm run test:tooltips`.

Branch off `main` and open a PR; the team squash-merges.
