// Build-time i18n audit. Scans .astro / .svelte / .ts for static i18n key
// references and cross-checks against src/i18n/translations.ts. Writes a JSON
// report to public/console/data/i18n-audit.json for the Console page to read.
//
// Detects four classes of issues:
//   (a) missing       referenced in code but not defined in translations.ts
//   (b) unused        defined but not statically referenced (dynamic refs missed)
//   (c) emptySide     one of {en, zh} is empty
//   (d) lengthMismatch en/zh length ratio outside [0.8, 8.0]

import { readdirSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'fs';
import { resolve, join, dirname, relative } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'public/console/data/i18n-audit.json');

const LENGTH_RATIO_MIN = 0.8;
const LENGTH_RATIO_MAX = 8.0;

function walk(dir, exts) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      out.push(...walk(path, exts));
    } else if (exts.some((e) => path.endsWith(e))) {
      out.push(path);
    }
  }
  return out;
}

function parseTranslations() {
  const content = readFileSync(join(SRC, 'i18n/translations.ts'), 'utf-8');
  const result = {};
  // Matches: 'key': { en: '...', zh: '...' }
  // Tolerant of single/double quotes and multi-line entries; escaped quotes
  // inside values would break it, but the source uses \uXXXX escapes instead.
  const re = /'([^']+?)'\s*:\s*\{\s*en\s*:\s*(['"`])([\s\S]*?)\2\s*,\s*zh\s*:\s*(['"`])([\s\S]*?)\4\s*,?\s*\}/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    result[m[1]] = { en: m[3], zh: m[5] };
  }
  return result;
}

function scanReferences() {
  const staticRefs = new Set();
  const dynamicSites = [];

  const files = walk(SRC, ['.astro', '.svelte', '.ts']);
  for (const file of files) {
    if (file.endsWith('i18n/translations.ts')) continue;
    const content = readFileSync(file, 'utf-8');
    const rel = relative(ROOT, file);

    let m;
    const dataI18nLiteral = /data-i18n=(['"])([^'"]+?)\1/g;
    while ((m = dataI18nLiteral.exec(content)) !== null) staticRefs.add(m[2]);

    const dataI18nDynamic = /data-i18n=\{/g;
    while ((m = dataI18nDynamic.exec(content)) !== null) {
      dynamicSites.push({ file: rel, pattern: 'data-i18n={...}' });
    }

    // Static: t('key') or t("key") — single/double quotes have no interpolation
    const tQuoted = /\bt\((['"])([^'"\n]+?)\1\)/g;
    while ((m = tQuoted.exec(content)) !== null) staticRefs.add(m[2]);

    // Static: t(`key`) — backtick without ${interpolation}
    const tTemplate = /\bt\(`([^`$\n]+?)`\)/g;
    while ((m = tTemplate.exec(content)) !== null) staticRefs.add(m[1]);

    // Dynamic: t(variable) or t(`...${...}...`)
    const tDynamic = /\bt\((?:([a-zA-Z_$][\w$.]*)\)|`[^`]*\$\{)/g;
    while ((m = tDynamic.exec(content)) !== null) {
      const label = m[1] ?? '`...${...}`';
      dynamicSites.push({ file: rel, pattern: `t(${label.slice(0, 20)})` });
    }
  }

  return { staticRefs, dynamicSites };
}

function audit() {
  const translations = parseTranslations();
  const { staticRefs, dynamicSites } = scanReferences();
  const definedKeys = new Set(Object.keys(translations));

  const missing = [...staticRefs].filter((k) => !definedKeys.has(k)).sort();
  const unused = [...definedKeys].filter((k) => !staticRefs.has(k)).sort();

  const emptySide = [];
  for (const [key, { en, zh }] of Object.entries(translations)) {
    if (!en?.trim() || !zh?.trim()) emptySide.push({ key, en, zh });
  }

  const lengthMismatch = [];
  for (const [key, { en, zh }] of Object.entries(translations)) {
    if (!en?.trim() || !zh?.trim()) continue;
    const ratio = en.length / zh.length;
    if (ratio < LENGTH_RATIO_MIN || ratio > LENGTH_RATIO_MAX) {
      lengthMismatch.push({
        key,
        enLength: en.length,
        zhLength: zh.length,
        ratio: Number(ratio.toFixed(2)),
        en: en.length > 80 ? en.slice(0, 77) + '...' : en,
        zh: zh.length > 80 ? zh.slice(0, 77) + '...' : zh,
      });
    }
  }
  lengthMismatch.sort((a, b) => Math.abs(b.ratio - 2.5) - Math.abs(a.ratio - 2.5));

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      definedKeys: definedKeys.size,
      referencedKeys: staticRefs.size,
      dynamicSites: dynamicSites.length,
      missing: missing.length,
      unused: unused.length,
      emptySide: emptySide.length,
      lengthMismatch: lengthMismatch.length,
    },
    missing,
    unused,
    emptySide,
    lengthMismatch,
    dynamicSites,
  };
}

const result = audit();
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log(`i18n audit written to ${relative(ROOT, OUT)}`);
console.log(`  ${result.summary.definedKeys} defined, ${result.summary.referencedKeys} referenced (+${result.summary.dynamicSites} dynamic sites)`);
console.log(`  missing=${result.summary.missing} unused=${result.summary.unused} emptySide=${result.summary.emptySide} lengthMismatch=${result.summary.lengthMismatch}`);
