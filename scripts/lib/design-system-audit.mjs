const EXACT_DESIGN_TOKENS = new Set(['--bg', '--text', '--border', '--content-padding']);
const DESIGN_TOKEN_PREFIXES = [
  '--gray-',
  '--color-',
  '--bubble-',
  '--font-',
  '--fs-',
  '--space-',
  '--radius-',
  '--shadow-',
  '--grid-',
];

export function parseGlobalTokenMap(source) {
  const root = source.match(/:root\s*\{([\s\S]*?)\}/);
  if (!root) return new Map();

  return new Map(
    [...root[1].matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)].map((match) => [
      match[1],
      match[2].trim().replace(/\s+/g, ' '),
    ]),
  );
}

export function collectGlobalTokens(source) {
  return new Set(parseGlobalTokenMap(source).keys());
}

export function compareTokenMaps(actual, canonical) {
  const differences = [];

  for (const [name, value] of actual) {
    if (!canonical.has(name)) {
      differences.push(`${name} exists locally but not in the Console design system`);
    } else if (canonical.get(name) !== value) {
      differences.push(
        `${name} is "${value}" locally but "${canonical.get(name)}" in the Console design system`,
      );
    }
  }

  for (const name of canonical.keys()) {
    if (!actual.has(name)) {
      differences.push(`${name} is missing locally but required by the Console design system`);
    }
  }

  return differences.sort();
}

function isDesignToken(name) {
  return (
    EXACT_DESIGN_TOKENS.has(name) || DESIGN_TOKEN_PREFIXES.some((prefix) => name.startsWith(prefix))
  );
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split('\n').length;
}

export function findUndefinedDesignTokens(path, source, definedTokens) {
  const findings = [];

  for (const match of source.matchAll(/var\((--[a-z0-9-]+)/gi)) {
    const value = match[1];
    if (!isDesignToken(value) || definedTokens.has(value)) continue;

    findings.push({
      rule: 'undefined-design-token',
      path,
      line: lineNumberAt(source, match.index),
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

function hasReasonedSuppression(line) {
  const match = line.match(/design-lint-disable-next-line literal-color --\s*(.+?)(?:\s*-->)?\s*$/);
  return Boolean(match?.[1]?.trim());
}

export function findLiteralColorsOutsideStyles(path, source) {
  if (/\.css$/i.test(path) || path === 'src/styles/global.css') return [];

  const lines = withoutStyleBlocks(source).split('\n');
  const findings = [];

  for (let index = 0; index < lines.length; index += 1) {
    const matches = [...lines[index].matchAll(/#[0-9a-fA-F]{3,8}\b/g)];
    if (matches.length === 0 || hasReasonedSuppression(lines[index - 1] ?? '')) continue;

    for (const match of matches) {
      findings.push({
        rule: 'literal-color',
        path,
        line: index + 1,
        value: match[0],
      });
    }
  }

  return findings;
}
