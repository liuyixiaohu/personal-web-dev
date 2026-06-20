import assert from 'node:assert/strict';
import test from 'node:test';

import {
  collectGlobalTokens,
  compareTokenMaps,
  findLiteralColorsOutsideStyles,
  findUndefinedDesignTokens,
  parseGlobalTokenMap,
} from '../lib/design-system-audit.mjs';

test('collectGlobalTokens returns declared custom properties', () => {
  assert.deepEqual(
    [...collectGlobalTokens(':root { --color-rose: #d9797b; --fs-xs: .75rem; }')],
    ['--color-rose', '--fs-xs'],
  );
});

test('token maps normalize whitespace and report drift in either direction', () => {
  const canonical = new Map([
    ['--bg', '#faf7f2'],
    ['--fs-base', 'clamp(1rem, 0.9rem + 0.5vw, 1.25rem)'],
  ]);
  const actual = parseGlobalTokenMap(`:root {
    --bg: #faf7f2;
    --fs-base: clamp(1rem,  0.9rem + 0.5vw, 1.25rem);
    --extra: 1rem;
  }`);

  assert.deepEqual(compareTokenMaps(actual, canonical), [
    '--extra exists locally but not in the Console design system',
  ]);
});

test('token value changes are reported', () => {
  const actual = new Map([['--bg', '#fff']]);
  const canonical = new Map([['--bg', '#faf7f2']]);

  assert.deepEqual(compareTokenMaps(actual, canonical), [
    '--bg is "#fff" locally but "#faf7f2" in the Console design system',
  ]);
});

test('undefined design tokens are reported but local component variables are ignored', () => {
  const tokens = new Set(['--color-rose']);
  const source = '.a { color: var(--color-missing); width: var(--component-width); }';

  assert.deepEqual(findUndefinedDesignTokens('src/a.css', source, tokens), [
    {
      rule: 'undefined-design-token',
      path: 'src/a.css',
      line: 1,
      value: '--color-missing',
    },
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

test('a suppression without a reason does not hide a literal color', () => {
  const source = `// design-lint-disable-next-line literal-color --
const color = '#d9797b';`;

  assert.equal(findLiteralColorsOutsideStyles('src/a.ts', source).length, 1);
});
