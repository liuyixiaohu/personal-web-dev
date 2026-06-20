# Design System Enforcement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make design-system, build, and data validation mandatory before any commit reaches `main`, while preserving unattended daily event updates through validated auto-merge pull requests.

**Architecture:** GitHub rules protect `main` and require two stable results: the `check` Actions job and the trusted `Policy Guard` commit status. Code rules run inside the existing CI job; the event workflow writes to `automation/event-data`, creates or updates one PR, explicitly dispatches both required workflows, and enables auto-merge. A repository-level `AGENTS.md` tells coding agents not to weaken or bypass the gate.

**Tech Stack:** GitHub Actions, repository rulesets, Node.js 22 built-ins (`node:test`, `fs`, `path`), Astro, Svelte, Stylelint, Python 3.12, Cloudflare Pages.

---

## File map

- Create `AGENTS.md`: permanent operating rules for humans and coding agents.
- Create `scripts/lib/design-system-audit.mjs`: pure design-token and non-CSS color auditing functions.
- Create `scripts/design-system-tokens.json`: canonical snapshot of the 33 tokens from `personal-web-console`.
- Create `scripts/verify-design-system.mjs`: CLI wrapper over the pure audit module.
- Create `scripts/tests/design-system-audit.test.mjs`: unit tests for the design audit.
- Create `scripts/lib/event-data-validation.mjs`: pure event JSON validation functions.
- Create `scripts/verify-event-data.mjs`: CLI wrapper for repository data files.
- Create `scripts/tests/event-data-validation.test.mjs`: unit tests for event validation.
- Create `scripts/verify-policy-change.mjs`: fail closed when protected policy paths change without approval.
- Create `scripts/tests/policy-change.test.mjs`: policy-path tests.
- Create `.github/workflows/policy-guard.yml`: stable required policy check.
- Modify `.github/workflows/check.yml`: stable required CI check plus manual dispatch.
- Modify `.github/workflows/fetch-events.yml`: replace direct `main` pushes with one auto-merge PR.
- Modify `package.json`: add test and enforcement scripts.
- Modify `stylelint.config.js`: require tokens for font size, radius, shadow, family, and colors.
- Modify `src/styles/global.css`: align token definitions exactly with the Console source of truth.
- Modify current Astro/CSS files: convert values to tokens or add reasoned one-line suppressions.
- Modify `docs/brand-guidelines.md`: document the enforced rules and intentional exceptions.
- Remove unused literal pin colors from `src/components/globe/pins.ts`.
- Configure repository setting and ruleset outside Git: auto-merge, branch deletion, required checks, and `main` protection.

### Task 1: Establish agent operating rules

**Files:**

- Create: `AGENTS.md`

- [ ] **Step 1: Add the repository instructions**

```markdown
# Repository Operating Rules

These rules apply to every human and coding agent working in this repository.

## Change flow

- Never push directly to `main`.
- Work on a branch, run `npm run check:all`, and open a pull request.
- Do not merge while a required check is pending or failing.

## Design system

- Use the tokens defined in `src/styles/global.css` and documented in `docs/brand-guidelines.md`.
- Do not introduce literal colors, font sizes, border radii, box shadows, or font stacks when a token applies.
- Intentional exceptions require a local lint suppression with a concrete reason.

## Enforcement controls

- Do not weaken or remove GitHub workflows, Stylelint rules, verification scripts, required checks, or repository rulesets without explicit user approval.
- Do not add direct-to-`main` automation, bypass credentials, or long-lived personal access tokens.
- Changes to enforcement-critical files require the `policy-change-approved` PR label.
```

- [ ] **Step 2: Verify the instructions contain the non-bypass rules**

Run:

```bash
rg -n "Never push directly|Do not weaken|policy-change-approved" AGENTS.md
```

Expected: three matching lines and exit code 0.

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs: define repository enforcement rules"
```

### Task 2: Add design-system audit tests first

**Files:**

- Create: `scripts/tests/design-system-audit.test.mjs`
- Create: `scripts/lib/design-system-audit.mjs`
- Create: `scripts/verify-design-system.mjs`

- [ ] **Step 1: Write failing unit tests**

Create tests using `node:test` for this public API:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectGlobalTokens,
  findLiteralColorsOutsideStyles,
  findUndefinedDesignTokens,
} from '../lib/design-system-audit.mjs';

test('collectGlobalTokens returns declared custom properties', () => {
  assert.deepEqual(
    [...collectGlobalTokens(':root { --color-rose: #d9797b; --fs-xs: .75rem; }')],
    ['--color-rose', '--fs-xs'],
  );
});

test('undefined design tokens are reported but local component variables are ignored', () => {
  const tokens = new Set(['--color-rose']);
  const source = '.a { color: var(--color-missing); width: var(--component-width); }';
  assert.deepEqual(findUndefinedDesignTokens('src/a.css', source, tokens), [
    { rule: 'undefined-design-token', path: 'src/a.css', line: 1, value: '--color-missing' },
  ]);
});

test('literal colors in TypeScript and markup are reported', () => {
  assert.equal(findLiteralColorsOutsideStyles('src/a.ts', "const color = '#d9797b';").length, 1);
  assert.equal(
    findLiteralColorsOutsideStyles('src/a.astro', '<meta name="theme-color" content="#faf7f2">')
      .length,
    1,
  );
});

test('style blocks and a reasoned next-line suppression are ignored', () => {
  const source = `<!-- design-lint-disable-next-line literal-color -- metadata cannot use CSS variables -->
<meta name="theme-color" content="#faf7f2">
<style>.x { color: #d9797b; }</style>`;
  assert.deepEqual(findLiteralColorsOutsideStyles('src/a.astro', source), []);
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```bash
node --test scripts/tests/design-system-audit.test.mjs
```

Expected: FAIL because `scripts/lib/design-system-audit.mjs` does not exist.

- [ ] **Step 3: Implement the pure audit module**

Implement exactly these behaviors:

```js
const TOKEN_PREFIXES = [
  '--bg',
  '--text',
  '--border',
  '--gray-',
  '--color-',
  '--bubble-',
  '--font-',
  '--fs-',
  '--space-',
  '--radius-',
  '--shadow-',
  '--grid-',
  '--content-',
];
const HEX = /#[0-9a-fA-F]{3,8}\b/g;

export function collectGlobalTokens(source) {
  return new Set([...source.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((match) => match[1]));
}

function isDesignToken(name) {
  return TOKEN_PREFIXES.some((prefix) => name === prefix || name.startsWith(prefix));
}

export function findUndefinedDesignTokens(path, source, definedTokens) {
  const findings = [];
  for (const match of source.matchAll(/var\((--[a-z0-9-]+)/gi)) {
    const value = match[1];
    if (!isDesignToken(value) || definedTokens.has(value)) continue;
    findings.push({
      rule: 'undefined-design-token',
      path,
      line: source.slice(0, match.index).split('\n').length,
      value,
    });
  }
  return findings;
}

function withoutStyleBlocks(source) {
  return source.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, (block) =>
    block.replace(/[^\n]/g, ' '),
  );
}

export function findLiteralColorsOutsideStyles(path, source) {
  if (/\.css$/i.test(path) || path === 'src/styles/global.css') return [];
  const searchable = withoutStyleBlocks(source);
  const lines = searchable.split('\n');
  const findings = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!HEX.test(line)) {
      HEX.lastIndex = 0;
      continue;
    }
    HEX.lastIndex = 0;
    const previous = lines[index - 1] ?? '';
    const suppressed =
      previous.includes('design-lint-disable-next-line literal-color --') &&
      previous.split('--').at(-1).trim().length > 0;
    if (suppressed) continue;
    for (const match of line.matchAll(HEX)) {
      findings.push({ rule: 'literal-color', path, line: index + 1, value: match[0] });
    }
  }
  return findings;
}
```

- [ ] **Step 4: Implement the CLI wrapper**

The wrapper recursively scans `src/**/*.{css,astro,svelte,ts,js,mjs}`, reads tokens from `src/styles/global.css`, sorts findings by path/line/rule, prints each as `path:line rule value`, and exits 1 when findings exist. It exports no additional policy and uses only Node built-ins.

- [ ] **Step 5: Verify GREEN**

Run:

```bash
node --test scripts/tests/design-system-audit.test.mjs
node scripts/verify-design-system.mjs
```

Expected: unit tests PASS; the repository audit FAILS only on the known current literals before Task 3 migration.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/design-system-audit.mjs scripts/verify-design-system.mjs scripts/tests/design-system-audit.test.mjs
git commit -m "test: define design-system audit behavior"
```

### Task 3: Enforce Console tokens and migrate current exceptions

**Files:**

- Modify: `stylelint.config.js`
- Modify: `src/styles/global.css`
- Modify: `src/layouts/ArticleLayout.astro`
- Modify: `src/pages/404.astro`
- Modify: `src/pages/touch-fish.astro`
- Modify: `src/styles/probes.css`
- Modify: `src/styles/tooltips.css`
- Modify: `src/pages/life-journey.astro`
- Modify: `src/components/HintTooltip.astro`
- Modify: `src/pages/probes/index.astro`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/components/globe/pins.ts`
- Modify: `docs/brand-guidelines.md`

- [ ] **Step 1: Expand strict-value properties**

Change the Stylelint strict-value property list to:

```js
['/color$/', 'fill', 'stroke', 'font-size', '/border.*radius$/', 'box-shadow', 'font-family'];
```

Keep only semantic CSS keywords in `ignoreValues`; remove literal black and white exceptions. Token definitions remain unaffected because they are custom-property declarations.

- [ ] **Step 2: Snapshot and enforce the Console token map**

Copy the complete token map from `liuyixiaohu/personal-web-console/src/styles/global.css` into `scripts/design-system-tokens.json`. Extend the audit so missing, changed, or additional tokens in this repository fail CI. Do not invent local design-system tokens.

- [ ] **Step 3: Replace straightforward literals with tokens**

Apply these mappings:

```text
0.65rem -> var(--fs-xs)
0.875rem tooltip text -> var(--fs-xs)
tooltip shadow -> var(--shadow-md)
var(--color-rose, #c96b6d) -> var(--color-rose)
code font stack -> documented code-only inline exception
```

Remove the unused `color` field from `PinData` and all six pin objects because no consumer reads it.

- [ ] **Step 4: Add reasoned exceptions where tokens would change intended relative sizing**

Use `stylelint-disable-next-line scale-unlimited/declaration-strict-value -- <reason>` immediately before relative article sizes (`0.9em`, `0.95em`), the decorative `404` clamp, and the two focus-ring radii. Use the same form for `#fff` only where it is inverse text on a colored background.

Add this before the theme-color meta tag:

```astro
<!-- design-lint-disable-next-line literal-color -- HTML metadata cannot consume CSS custom properties -->
```

- [ ] **Step 5: Update the brand documentation**

State that the Console design-system page and token file are authoritative, record the local enforcement behavior, and document that relative `em` sizing, decorative display type, and code font stacks require an inline reasoned suppression.

- [ ] **Step 6: Verify all design checks pass**

Run:

```bash
npm ci
npm run lint:css
node scripts/verify-design-system.mjs
npm run build
```

Expected: all four commands exit 0.

- [ ] **Step 7: Prove a new violation is blocked**

Temporarily add `.design-gate-probe { font-size: 13px; color: #123456; }` to `src/styles/probes.css`.

Run:

```bash
npm run lint:css
```

Expected: FAIL with strict-value errors. Remove the probe and rerun; expected PASS.

- [ ] **Step 8: Commit**

```bash
git add stylelint.config.js src docs/brand-guidelines.md
git commit -m "feat: enforce design tokens in styles and markup"
```

### Task 4: Validate event data with tests first

**Files:**

- Create: `scripts/tests/event-data-validation.test.mjs`
- Create: `scripts/lib/event-data-validation.mjs`
- Create: `scripts/verify-event-data.mjs`

- [ ] **Step 1: Write failing validation tests**

Cover these behaviors with `node:test`:

```js
test('valid event output and seen state pass', () => {
  assert.deepEqual(validateEventData(validPublic, validSeen), []);
});

test('duplicate event ids fail', () => {
  const errors = validateEventData({ ...validPublic, events: [event, event] }, validSeen);
  assert.ok(errors.some((error) => error.includes('duplicate api_id')));
});

test('new_event_ids must exactly match event api ids', () => {
  const errors = validateEventData({ ...validPublic, new_event_ids: [] }, validSeen);
  assert.ok(errors.some((error) => error.includes('new_event_ids')));
});

test('each public event must exist in seen state', () => {
  const errors = validateEventData(validPublic, { last_pruned_at: null, events: {} });
  assert.ok(errors.some((error) => error.includes('seen state')));
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
node --test scripts/tests/event-data-validation.test.mjs
```

Expected: FAIL because the validation module does not exist.

- [ ] **Step 3: Implement validation**

`validateEventData(publicData, seenData)` returns an array and checks:

- both roots and their `events` fields have the expected object/array types;
- `updated_at`, `previous_updated_at`, `last_pruned_at`, `start_at`, `end_at`, and `first_seen_at` are null or valid ISO timestamps as permitted by the current schema;
- every public event has non-empty `api_id`, `name`, `url`, `start_at`, and `first_seen_at` strings;
- `api_id` values are unique;
- sorted `new_event_ids` exactly equal sorted public event IDs;
- every public event ID exists in `seenData.events`;
- no seen-state entry lacks `first_seen_at`.

The CLI reads `public/data/events.json` and `data/seen_events.json`, prints one error per line, and exits 1 on any error.

- [ ] **Step 4: Verify GREEN against tests and production data**

Run:

```bash
node --test scripts/tests/event-data-validation.test.mjs
node scripts/verify-event-data.mjs
```

Expected: tests PASS and current committed data passes.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/event-data-validation.mjs scripts/verify-event-data.mjs scripts/tests/event-data-validation.test.mjs
git commit -m "test: validate generated event data"
```

### Task 5: Add scripts and the stable Check workflow

**Files:**

- Modify: `package.json`
- Modify: `.github/workflows/check.yml`

- [ ] **Step 1: Add package scripts**

Add:

```json
"test:unit": "node --test scripts/tests/*.test.mjs",
"lint:design": "stylelint \"src/**/*.{css,astro,svelte}\" && node scripts/verify-design-system.mjs",
"test:event-data": "node scripts/verify-event-data.mjs",
"check:all": "npm run check && npm run lint:design && npm run format:check && npm run test:unit && npm run build && npm run test:journey && npm run test:tooltips && npm run test:event-data"
```

Keep `lint:css` as a compatibility alias for the raw Stylelint command.

- [ ] **Step 2: Update Check triggers and steps**

Add `workflow_dispatch: {}`. Keep all pull requests to `main` unfiltered. Expand push paths to include:

```yaml
- 'data/**'
- 'docs/brand-guidelines.md'
- 'scripts/**'
- 'stylelint.config.js'
- 'AGENTS.md'
- '.github/workflows/**'
```

Replace separate command steps with named steps while preserving the job id `check`:

```yaml
- name: Install dependencies
  run: npm ci
- name: Run required checks
  run: npm run check:all
```

Add workflow concurrency keyed by workflow and ref, cancelling superseded runs.

- [ ] **Step 3: Verify YAML and the full gate locally**

Run:

```bash
npm run check:all
```

Expected: exit 0 with unit tests, Astro check, lint, format, build, journey, tooltip, and event data all passing.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .github/workflows/check.yml
git commit -m "ci: make repository checks a single required gate"
```

### Task 6: Add the policy guard with tests first

**Files:**

- Create: `scripts/tests/policy-change.test.mjs`
- Create: `scripts/verify-policy-change.mjs`
- Create: `.github/workflows/policy-guard.yml`

- [ ] **Step 1: Write failing policy tests**

Test that `isProtectedPolicyPath(path)` returns true for:

```text
.github/workflows/check.yml
stylelint.config.js
scripts/verify-design-system.mjs
scripts/lib/design-system-audit.mjs
package.json
docs/brand-guidelines.md
AGENTS.md
```

Test that it returns false for `src/pages/index.astro` and both event JSON files. Test that `evaluatePolicyChange(paths, false)` fails for protected paths and `evaluatePolicyChange(paths, true)` passes.

- [ ] **Step 2: Verify RED**

Run:

```bash
node --test scripts/tests/policy-change.test.mjs
```

Expected: FAIL because `scripts/verify-policy-change.mjs` does not exist.

- [ ] **Step 3: Implement the policy verifier**

Export `isProtectedPolicyPath` and `evaluatePolicyChange`. When run as a CLI, read newline-separated paths from the file passed as argument, read `POLICY_CHANGE_APPROVED === 'true'`, print protected paths, and exit 1 unless approved.

- [ ] **Step 4: Create the workflow**

Use workflow name `Policy Guard Runner`; it publishes the stable commit status `Policy Guard`. Trigger on:

```yaml
pull_request_target:
  branches: [main]
  types: [opened, synchronize, reopened, labeled, unlabeled]
workflow_dispatch:
  inputs:
    base_ref:
      required: false
      default: main
```

Give `contents: read`, `pull-requests: read`, and `statuses: write`. For `pull_request_target`, use `gh api --paginate` to write PR filenames to `$RUNNER_TEMP/changed-files.txt` and derive approval from the PR labels. For `workflow_dispatch`, compare the base and dispatched commit. Checkout and execute the verifier from `main`, never from an untrusted PR head, then publish success or failure as `Policy Guard` on the tested head commit.

- [ ] **Step 5: Verify locally**

Run:

```bash
node --test scripts/tests/policy-change.test.mjs
printf '%s\n' src/pages/index.astro > /tmp/changed-files.txt
node scripts/verify-policy-change.mjs /tmp/changed-files.txt
printf '%s\n' stylelint.config.js > /tmp/changed-files.txt
node scripts/verify-policy-change.mjs /tmp/changed-files.txt
```

Expected: tests PASS; normal source path exits 0; policy path exits 1.

- [ ] **Step 6: Commit**

```bash
git add scripts/verify-policy-change.mjs scripts/tests/policy-change.test.mjs .github/workflows/policy-guard.yml
git commit -m "ci: guard enforcement policy changes"
```

### Task 7: Convert the event workflow to an auto-merge PR

**Files:**

- Modify: `.github/workflows/fetch-events.yml`

- [ ] **Step 1: Set minimal explicit permissions and concurrency**

Use:

```yaml
permissions:
  actions: write
  contents: write
  pull-requests: write

concurrency:
  group: event-data-update
  cancel-in-progress: false
```

- [ ] **Step 2: Validate before publication**

After fetching and merging, install Node dependencies and run:

```yaml
- name: Validate generated data
  run: |
    node scripts/verify-event-data.mjs
    npm ci
    npm run build
```

- [ ] **Step 3: Replace direct-main push with a fixed automation branch**

The shell step must:

```bash
git add public/data/events.json data/seen_events.json
git diff --cached --quiet && exit 0
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git checkout -B automation/event-data
git commit -m "chore: update event data $(date -u +%Y-%m-%d)"
git push --force-with-lease origin automation/event-data
```

Expose whether a change was committed through a step output so later steps are skipped when unchanged.

- [ ] **Step 4: Create or reuse one PR**

With `GH_TOKEN: ${{ github.token }}`, find an open PR from `automation/event-data` to `main`. Create it when absent with title `chore: update event data` and a body explaining that it is generated and auto-merged after validation.

- [ ] **Step 5: Explicitly dispatch required checks**

Because a PR created by `GITHUB_TOKEN` does not recursively start ordinary PR workflows, run:

```bash
gh workflow run check.yml --ref automation/event-data
gh workflow run policy-guard.yml --ref automation/event-data -f base_ref=main
gh pr merge "$PR_NUMBER" --auto --squash --delete-branch
```

- [ ] **Step 6: Syntax and dry-run verification**

Run the complete local gate, then use `workflow_dispatch` after the branch is published. Expected: no-change exits cleanly; changed data creates or updates only one PR; both required checks attach to its head; merge waits until both pass.

- [ ] **Step 7: Commit**

```bash
git add .github/workflows/fetch-events.yml
git commit -m "ci: validate event updates through auto-merge PRs"
```

### Task 8: Publish the implementation PR and verify checks

**Files:** all files above

- [ ] **Step 1: Run fresh full verification**

Run:

```bash
npm ci
npm run check:all
git diff --check main...HEAD
git status --short
```

Expected: commands exit 0; only intended committed work is present.

- [ ] **Step 2: Push the implementation branch and open a draft PR**

Use the existing `codex/design-system-enforcement-20260620` branch. The PR body must list the two required check names, explain the automatic event PR, and call out the external ruleset activation as the final step.

- [ ] **Step 3: Create the approval label**

Create `policy-change-approved` with a red warning color and description `Explicit owner approval for CI or design-policy changes`, then add it to this implementation PR because the PR intentionally changes protected files.

- [ ] **Step 4: Verify Actions**

Expected: `Check / check` passes. Verify the policy guard behavior on this bootstrap PR; if the label event cannot run until the workflow exists on `main`, record that bootstrap limitation and require the check only after the workflow is merged.

### Task 9: Activate repository settings and main protection last

**External state:** GitHub repository settings for `liuyixiaohu/personal-web-dev`

- [ ] **Step 1: Enable merge support**

Set:

```json
{
  "allow_auto_merge": true,
  "delete_branch_on_merge": true,
  "allow_squash_merge": true
}
```

Use the GitHub connector where available; use the GitHub REST administration endpoint only for settings the connector does not expose.

- [ ] **Step 2: Merge the bootstrap implementation PR**

Do this before activating the ruleset so the required workflows exist on `main` and the current direct-push event workflow is already replaced.

- [ ] **Step 3: Create an active `Protect main` ruleset**

Target `refs/heads/main`, leave the bypass list empty, and configure:

```text
deletion: blocked
non_fast_forward: blocked
pull_request.required_approving_review_count: 0
required_status_checks.strict_required_status_checks_policy: true
required checks: the observed `check` job context and `Policy Guard`
```

Do not require signed commits or human approval in this solo repository.

- [ ] **Step 4: Prove enforcement**

Perform safe tests:

1. attempt a no-content direct ref update to `main` only if GitHub can reject it without creating a commit; otherwise inspect ruleset evaluation instead;
2. open a temporary PR with a deliberate design violation and verify `Check / check` fails;
3. remove the violation and verify it passes;
4. change a protected policy path and verify Policy Guard fails without the label;
5. add the approval label and verify Policy Guard passes;
6. manually dispatch Fetch Events and verify one automation PR is created or updated and auto-merges only after both checks pass.

- [ ] **Step 5: Confirm production behavior**

Verify the merged `main` commit receives a successful Cloudflare Pages deployment. Confirm the automation PR changes only `public/data/events.json` and `data/seen_events.json`.

- [ ] **Step 6: Final report**

Report the implementation PR, active ruleset URL, required check names, event automation result, Cloudflare result, and any test that could not be safely executed. Do not call the gate complete unless the direct-push rejection and failed-check merge block have both been observed.
