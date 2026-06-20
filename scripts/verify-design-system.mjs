import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

import {
  collectGlobalTokens,
  compareTokenMaps,
  findLiteralColorsOutsideStyles,
  findUndefinedDesignTokens,
  parseGlobalTokenMap,
} from './lib/design-system-audit.mjs';

const ROOT = process.cwd();
const SOURCE_ROOT = join(ROOT, 'src');
const GLOBAL_STYLES = join(SOURCE_ROOT, 'styles', 'global.css');
const CANONICAL_TOKENS = join(ROOT, 'scripts', 'design-system-tokens.json');
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

const globalStyles = readFileSync(GLOBAL_STYLES, 'utf8');
const definedTokens = collectGlobalTokens(globalStyles);
const localTokenMap = parseGlobalTokenMap(globalStyles);
const canonicalTokenMap = new Map(
  Object.entries(JSON.parse(readFileSync(CANONICAL_TOKENS, 'utf8')).tokens),
);
const findings = [];

for (const value of compareTokenMaps(localTokenMap, canonicalTokenMap)) {
  findings.push({
    rule: 'console-token-parity',
    path: 'src/styles/global.css',
    line: 1,
    value,
  });
}

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
