import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

import {
  collectGlobalTokens,
  findLiteralColorsOutsideStyles,
  findUndefinedDesignTokens,
} from './lib/design-system-audit.mjs';

// kunli.co's global.css is the single source of truth for design tokens.
// This script checks that every token used in the source is defined there,
// and that no literal colors appear outside style blocks.

const ROOT = process.cwd();
const SOURCE_ROOT = join(ROOT, 'src');
const GLOBAL_STYLES = join(SOURCE_ROOT, 'styles', 'global.css');
const EXTENSIONS = new Set(['.css', '.astro', '.svelte', '.ts', '.js', '.mjs']);

function sourceFiles(directory) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...sourceFiles(path));
    else if (EXTENSIONS.has(extname(entry.name))) files.push(path);
  }

  return files;
}

const definedTokens = collectGlobalTokens(readFileSync(GLOBAL_STYLES, 'utf8'));
const findings = [];

for (const absolutePath of sourceFiles(SOURCE_ROOT)) {
  const path = relative(ROOT, absolutePath).split('\\').join('/');
  const source = readFileSync(absolutePath, 'utf8');
  findings.push(...findUndefinedDesignTokens(path, source, definedTokens));
  findings.push(...findLiteralColorsOutsideStyles(path, source));
}

findings.sort(
  (left, right) =>
    left.path.localeCompare(right.path) ||
    left.line - right.line ||
    left.rule.localeCompare(right.rule),
);

if (findings.length > 0) {
  console.error('Design-system verification failed:');
  for (const finding of findings) {
    console.error(`${finding.path}:${finding.line} ${finding.rule} ${finding.value}`);
  }
  process.exit(1);
}

console.log('Design-system verification passed.');
