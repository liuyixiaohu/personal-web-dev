import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parse } from 'yaml';

const fetchEventsWorkflow = readFileSync('.github/workflows/fetch-events.yml', 'utf8');
const checkWorkflow = readFileSync('.github/workflows/check.yml', 'utf8');
const policyGuardWorkflow = readFileSync('.github/workflows/policy-guard.yml', 'utf8');
const notifySubscribersWorkflow = readFileSync('.github/workflows/notify-subscribers.yml', 'utf8');

test('workflow YAML parses successfully', () => {
  for (const source of [
    fetchEventsWorkflow,
    checkWorkflow,
    policyGuardWorkflow,
    notifySubscribersWorkflow,
  ]) {
    assert.doesNotThrow(() => parse(source));
  }
});

test('event updates use a pull request and explicitly dispatch required checks', () => {
  for (const requiredFragment of [
    'pull-requests: write',
    'actions: write',
    'automation/event-data',
    'gh pr create',
    'gh workflow run check.yml',
    'gh workflow run policy-guard.yml',
    'gh workflow run notify-subscribers.yml --ref main',
    'gh pr merge "$PR_NUMBER" --auto --squash --delete-branch',
  ]) {
    assert.match(
      fetchEventsWorkflow,
      new RegExp(requiredFragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
  }

  assert.doesNotMatch(fetchEventsWorkflow, /git push(?:\s+origin)?\s+main/);
});

test('subscriber notifications wait for production and have a daily fallback', () => {
  for (const requiredFragment of [
    'workflow_dispatch',
    'schedule',
    'EVENT_NOTIFY_SECRET: ${{ secrets.EVENT_NOTIFY_SECRET }}',
    'node scripts/notify-subscribers.mjs',
  ]) {
    assert.match(
      notifySubscribersWorkflow,
      new RegExp(requiredFragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    );
  }
  assert.doesNotMatch(notifySubscribersWorkflow, /RESEND_API_KEY/);
});

test('policy guard publishes a trusted commit status for the pull request head', () => {
  assert.match(policyGuardWorkflow, /pull_request_target:/);
  assert.match(policyGuardWorkflow, /statuses: write/);
  assert.match(policyGuardWorkflow, /context="Policy Guard"/);
  assert.match(policyGuardWorkflow, /github\.event\.pull_request\.head\.sha/);
});

test('full checks publish a Required Check status on the tested head commit', () => {
  assert.match(checkWorkflow, /statuses: write/);
  assert.match(checkWorkflow, /github\.event\.pull_request\.head\.sha/);
  assert.match(checkWorkflow, /steps\.required-checks\.outcome/);
  assert.match(checkWorkflow, /context="Required Check"/);
});
