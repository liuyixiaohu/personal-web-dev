# Repository Operating Rules

These rules apply to every human and coding agent working in this repository.

## Change flow

- Never push directly to `main`.
- Work on a branch, run `npm run check:all`, and open a pull request.
- Do not merge while a required check is pending or failing.

## Design system

- Treat `personal-web-console/src/pages/design-system.astro` (published at
  `workbench.kunli.co/design-system`) as the single source of truth.
- Keep the `:root` token block byte-equivalent to
  `personal-web-console/src/styles/global.css`.
- Use only the tokens defined in `src/styles/global.css`.
- Do not introduce literal colors, font sizes, border radii, box shadows, or
  font stacks when a token applies.
- Intentional exceptions require a local lint suppression with a concrete
  reason.

## Enforcement controls

- Do not weaken or remove GitHub workflows, Stylelint rules, verification
  scripts, required checks, or repository rulesets without explicit user
  approval.
- Do not add direct-to-`main` automation, bypass credentials, or long-lived
  personal access tokens.
- Changes to enforcement-critical files require the `policy-change-approved`
  pull-request label.
