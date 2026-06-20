# Design System Enforcement Design

**Date:** 2026-06-20
**Status:** Approved for implementation

## Objective

Prevent accidental long-term design drift or broken deployments from human or AI-generated changes. A change must not reach `main` unless automated checks pass. The daily event-data update remains unattended, but it uses the same validated merge path instead of bypassing branch protection.

This design protects against accidental or low-attention changes. It does not attempt to defend against a repository administrator deliberately disabling GitHub rules.

## Chosen approach

Use defense in depth:

1. GitHub protects `main` and requires pull requests plus named status checks.
2. CI enforces build correctness and machine-checkable design-system rules.
3. A policy guard makes weakening the enforcement files visible and blocking.
4. The daily event workflow creates and auto-merges a validated PR.
5. Cloudflare Pages continues deploying from `main`, which now contains only validated commits.
6. Repository instructions tell coding agents not to bypass or weaken the controls.

No approving human review is required for ordinary PRs because this is a solo-maintained site. The checks, rather than a second person, are the merge gate.

## Main-branch rules

Create an active repository ruleset targeting `refs/heads/main` with no routine bypass actors.

Required rules:

- Require a pull request before merging.
- Require zero approving reviews.
- Require the branch to be up to date before merging.
- Require the observed CI check context for job `check` and the trusted commit status `Policy Guard`.
- Block force pushes.
- Block branch deletion.

Repository administrators are subject to the rules during normal work. Emergency recovery remains possible by temporarily disabling the ruleset in repository settings; that action is explicit and auditable.

## CI gate

Keep one stable `Check / check` job name because the GitHub ruleset depends on that identity.

The job runs for:

- every pull request targeting `main`;
- manual `workflow_dispatch` runs on a specified branch, used by the event-data automation;
- pushes to `main` as a post-merge diagnostic.

The job performs, in order:

1. dependency installation with `npm ci`;
2. Astro type and content checks;
3. design-system lint;
4. formatting verification;
5. production build;
6. journey and tooltip verification;
7. event-data validation.

The workflow path filter must include the lint configuration, design-system documentation, verification scripts, package manifests, and workflow files. Pull requests are never path-filtered.

## Design-system enforcement

The private `liuyixiaohu/personal-web-console` repository is the design-system source of truth. Its `src/pages/design-system.astro` page defines the documented system and its `src/styles/global.css` currently defines the canonical set of 33 tokens. This repository keeps a machine-readable snapshot of those tokens so its public CI can detect drift without a private-repository credential.

Stylelint rejects non-token values for colors, font sizes, border radii, box shadows, and font families, with the documented Console exceptions for gradients, `rgba()`, code font stacks, and pure black or white. A dedicated `npm run lint:design` verifier covers rules that Stylelint does not reliably express across Astro, Svelte, CSS, TypeScript, SVG, and HTML:

- no new hardcoded font sizes outside token definitions;
- no new hardcoded brand colors in script or markup files;
- border radii use the documented radius tokens;
- box shadows use the documented shadow tokens;
- design-token references resolve to definitions in `src/styles/global.css`;
- the complete `:root` token map exactly matches `scripts/design-system-tokens.json`;
- explicit exceptions require a local suppression comment with a reason.

The canonical snapshot is enforcement policy. Updating it requires explicit owner review and must reflect an intentional change made first in the Console source of truth.

Rules that require human visual judgment—composition, warmth, hierarchy, or whether a new component should exist—remain documented guidance. Screenshot regression testing is excluded from this first implementation because dynamic event content and external fonts would make it noisy; it can be added later for selected deterministic pages.

## Policy guard

Add a separate required commit status named `Policy Guard`. It fails when a pull request modifies enforcement-critical files without the `policy-change-approved` label.

Protected paths include:

- `.github/workflows/**`;
- `stylelint.config.js`;
- the design verifier and its baseline;
- `package.json` design/check scripts;
- `docs/brand-guidelines.md`;
- `AGENTS.md`.

The guard inspects filenames only and never executes code from the pull-request branch. The `pull_request_target` workflow checks out the trusted verifier from `main`, then publishes the result onto the PR head commit as a custom status. This keeps a PR from weakening its own guard while still producing a required status on the correct commit. The repository owner applies `policy-change-approved` only when intentionally changing policy.

For manual automation runs, the same guard logic compares the automation branch with `main` and attaches the required check to the branch head.

## Daily event-data flow

The scheduled workflow no longer pushes directly to `main`.

It uses a fixed branch, `automation/event-data`, and:

1. starts from the current `main`;
2. fetches and merges event data;
3. stages only `public/data/events.json` and `data/seen_events.json`;
4. exits when neither file changed;
5. commits and pushes the automation branch;
6. creates or updates one pull request;
7. dispatches the Check and Policy Guard workflows on the automation branch;
8. enables squash auto-merge;
9. deletes the branch after merge.

GitHub does not recursively trigger ordinary pull-request workflows for a PR created with the repository `GITHUB_TOKEN`. Explicit `workflow_dispatch` calls ensure the required checks run on the automation commit without a personal access token or custom GitHub App.

If validation fails, the PR remains unmerged and Cloudflare does not receive a new `main` commit. The next scheduled run refreshes the same branch and PR instead of creating duplicates.

## Deployment boundary

Cloudflare Pages may continue using its native GitHub integration and deploying `main`. No separate deployment workflow is required.

Code changes reach `main` only after required checks pass. Event-data changes reach `main` only after the automation PR passes the same checks. Therefore a production deployment starts only from a validated commit.

Preview deployments may still run for pull-request branches. They are not production and do not replace the required checks.

## Agent instructions

Add a root `AGENTS.md` stating that coding agents must:

- work on a branch and open a pull request;
- run the complete local check command before publication;
- use documented design tokens;
- never weaken workflows, rulesets, verification scripts, or baselines without explicit user approval;
- never add a bypass credential or direct-to-`main` push path.

These instructions reduce accidental attempts to work around a failed gate.

## Failure and recovery behavior

- Design or build failure: PR remains blocked; fix the branch and rerun.
- Event-data failure: existing production data remains unchanged.
- Required check does not appear: PR remains blocked; dispatch the workflow on the PR head.
- Policy change is intentional: owner adds `policy-change-approved`, reviews the diff, and reruns the guard.
- GitHub or Actions outage: wait or temporarily disable the ruleset manually; there is no automatic fail-open path.

## Verification criteria

Implementation is complete only when all of the following are demonstrated:

1. the full local check suite passes;
2. a deliberate design-token violation fails `lint:design`;
3. removing the deliberate violation passes again;
4. a normal test PR receives both required checks;
5. a policy-file test change is blocked without the approval label;
6. the event workflow can create or update its PR and dispatch checks;
7. a failed required check prevents merge;
8. a direct push to `main` is rejected;
9. a successful PR merges and produces the expected Cloudflare deployment.
