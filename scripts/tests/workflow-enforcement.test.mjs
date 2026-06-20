import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const fetchEventsWorkflow = readFileSync('.github/workflows/fetch-events.yml', 'utf8');
const policyGuardWorkflow = readFileSync('.github/workflows/policy-guard.yml', 'utf8');

test('event updates use a pull request and explicitly dispatch required checks', () => {
  for (const requiredFragment of [
    'pull-requests: write',
    'actions: write',
    'automation/event-data',
    'gh pr create',
    'gh workflow run check.yml',
    'gh workflow run policy-guard.yml',
    'gh pr merge "$PR_NUMBER" --auto --squash --delete-branch',
  ]) {
    assert.match(
      fetchEventsWorkflow,
      new RegExp(requiredFragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
  }

  assert.doesNotMatch(fetchEventsWorkflow, /git push(?:\s+origin)?\s+main/);
});

test('policy guard publishes a trusted commit status for the pull request head', () => {
  assert.match(policyGuardWorkflow, /pull_request_target:/);
  assert.match(policyGuardWorkflow, /statuses: write/);
  assert.match(policyGuardWorkflow, /context="Policy Guard"/);
  assert.match(policyGuardWorkflow, /github\.event\.pull_request\.head\.sha/);
});
