import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluatePolicyChange, isProtectedPolicyPath } from '../verify-policy-change.mjs';

const protectedPaths = [
  '.github/workflows/check.yml',
  'CLAUDE.md',
  'stylelint.config.js',
  'scripts/design-system-tokens.json',
  'scripts/verify-design-system.mjs',
  'scripts/lib/design-system-audit.mjs',
  'scripts/tests/design-system-audit.test.mjs',
  'package.json',
  'docs/brand-guidelines.md',
  'AGENTS.md',
];

test('enforcement-critical paths are protected', () => {
  for (const path of protectedPaths) assert.equal(isProtectedPolicyPath(path), true, path);
});

test('ordinary source and generated event data are not policy paths', () => {
  for (const path of [
    'src/pages/index.astro',
    'public/data/events.json',
    'data/seen_events.json',
  ]) {
    assert.equal(isProtectedPolicyPath(path), false, path);
  }
});

test('protected changes fail without explicit approval', () => {
  assert.deepEqual(evaluatePolicyChange(['src/pages/index.astro', 'stylelint.config.js'], false), {
    allowed: false,
    protectedPaths: ['stylelint.config.js'],
  });
});

test('approved policy changes pass', () => {
  assert.deepEqual(evaluatePolicyChange(['stylelint.config.js'], true), {
    allowed: true,
    protectedPaths: ['stylelint.config.js'],
  });
});
