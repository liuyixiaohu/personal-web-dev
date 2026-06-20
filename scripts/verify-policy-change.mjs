import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const EXACT_PROTECTED_PATHS = new Set([
  'AGENTS.md',
  'CLAUDE.md',
  'docs/brand-guidelines.md',
  'package.json',
  'scripts/design-system-tokens.json',
  'stylelint.config.js',
  'scripts/lib/design-system-audit.mjs',
  'scripts/lib/event-data-validation.mjs',
]);

export function isProtectedPolicyPath(path) {
  return (
    EXACT_PROTECTED_PATHS.has(path) ||
    path.startsWith('.github/workflows/') ||
    path.startsWith('scripts/tests/') ||
    /^scripts\/verify-.*\.mjs$/.test(path)
  );
}

export function evaluatePolicyChange(paths, approved) {
  const protectedPaths = [...new Set(paths.filter(isProtectedPolicyPath))].sort();
  return {
    allowed: approved || protectedPaths.length === 0,
    protectedPaths,
  };
}

function runCli() {
  const changedFilesPath = process.argv[2];
  if (!changedFilesPath) {
    console.error('Usage: node scripts/verify-policy-change.mjs <changed-files.txt>');
    process.exit(2);
  }

  const paths = readFileSync(changedFilesPath, 'utf8')
    .split('\n')
    .map((path) => path.trim())
    .filter(Boolean);
  const approved = process.env.POLICY_CHANGE_APPROVED === 'true';
  const result = evaluatePolicyChange(paths, approved);

  if (result.protectedPaths.length === 0) {
    console.log('Policy Guard passed: no enforcement-critical files changed.');
    return;
  }

  console.log('Enforcement-critical files changed:');
  for (const path of result.protectedPaths) console.log(`- ${path}`);

  if (!result.allowed) {
    console.error('Policy Guard failed: add policy-change-approved after explicit owner review.');
    process.exit(1);
  }

  console.log('Policy Guard passed with explicit approval.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) runCli();
