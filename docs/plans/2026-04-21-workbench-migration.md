# Workbench Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore 笑笑的摸鱼工作台 (removed in `747fb7a` on 2026-03-21) to the site under `/console/workbench`, drop the `xlsx` dependency in favor of `exceljs` alone, and verify behavioral equivalence with a dual-reader comparison harness.

**Architecture:** Single Svelte 5 component at `src/components/console/Workbench.svelte` orchestrates UI. Data processing split into three pure-function modules under `src/utils/workbench/`: `parse.ts` (exceljs reads), `aggregate.ts` (company/month grouping), `write.ts` (formatted exceljs writes). A thin Astro page at `src/pages/console/workbench.astro` mounts the component. The `/console/` index gets a third card linking to the new page. No in-app auth (Cloudflare Access gates `/console/*`).

**Tech Stack:** Astro 5, Svelte 5 (runes), TypeScript, exceljs (production). `xlsx` used only by the test harness, never shipped.

**Design reference:** [docs/plans/2026-04-21-workbench-migration-design.md](./2026-04-21-workbench-migration-design.md)

**Old source reference:** `git show 747fb7a^:src/components/tools/ExcelTool.svelte` (1214 lines). Throughout the plan, "OLD:Lxxx-Lyyy" refers to line ranges in that file.

**Related skills:**
- @superpowers:test-driven-development — TDD discipline on parse/aggregate/write
- @superpowers:verification-before-completion — before declaring each task done
- @superpowers:systematic-debugging — if dual-reader comparison flags diffs

---

## Task 1: Add dependencies and scaffold directories

**Files:**
- Modify: `package.json` (add `exceljs` to dependencies, add `xlsx` to devDependencies for harness only)
- Create: `src/components/console/.gitkeep` (empty, ensures directory is tracked)
- Create: `src/utils/workbench/.gitkeep`
- Create: `scripts/.gitkeep` (may already exist, check first)

**Step 1: Check current state**

Run:
```bash
ls scripts/ 2>/dev/null || echo "missing"
ls src/components/console/ 2>/dev/null || echo "missing"
ls src/utils/workbench/ 2>/dev/null || echo "missing"
```

**Step 2: Install dependencies**

Run:
```bash
npm install exceljs@^4.4.0 --save
npm install xlsx@^0.18.5 --save-dev
```

Expected: `package.json` shows `exceljs` in `dependencies` and `xlsx` in `devDependencies`. `package-lock.json` updates.

**Step 3: Create directories**

Run:
```bash
mkdir -p src/components/console src/utils/workbench scripts
```

**Step 4: Verify**

Run:
```bash
ls src/components/console src/utils/workbench scripts
cat package.json | grep -E '"exceljs"|"xlsx"'
```

Expected: three directories exist, both deps present.

**Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add exceljs dep and xlsx devDep for workbench migration"
```

---

## Task 2: Define shared TypeScript types

**Files:**
- Create: `src/utils/workbench/types.ts`

**Step 1: Write the types file**

Content (copy verbatim from OLD:L14-L66, tidy imports):

```typescript
export type InsuranceType = 'youmi' | 'renBao';
export type FileRole = 'output' | InsuranceType;
export type TaskId = 'supernova' | 'neutron' | 'redgiant';

export interface UploadedFile {
  name: string;
  role: FileRole;
  roleLabel: string;
  buffer: ArrayBuffer;
}

export interface RawRecord {
  company: string;
  amount: number;
  month: number;
  year: number;
}

export interface RawFileData {
  name: string;
  insuranceType: InsuranceType;
  records: RawRecord[];
}

export interface AggregatedRow {
  company: string;
  amounts: Record<string, number>;
}

export interface AggregatedResult {
  year: number;
  month: number;
  insuranceColumns: string[];
  rows: AggregatedRow[];
  totals: Record<string, number>;
  grandTotal: number;
}

export interface MonthBlock {
  month: number;
  headers: string[];
  rows: { company: string; amounts: Record<string, number> }[];
  totals: Record<string, number>;
  grandTotal: number;
}

export interface Task {
  id: TaskId;
  label: string;
}

export class WorkbenchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkbenchError';
  }
}

export const TASKS: Task[] = [
  { id: 'supernova', label: '超新星小吕' },
  { id: 'neutron', label: '中子星小吕' },
  { id: 'redgiant', label: '红巨星小吕' },
];

export const INSURANCE_LABELS: Record<InsuranceType, string> = {
  youmi: '优米',
  renBao: '人保',
};
```

**Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit src/utils/workbench/types.ts
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/utils/workbench/types.ts
git commit -m "feat(workbench): add shared types and constants"
```

---

## Task 3: Build test harness skeleton

**Files:**
- Create: `scripts/test-workbench.mjs`

**Step 1: Write the harness skeleton**

```javascript
#!/usr/bin/env node
// Temporary test harness for workbench migration.
// DELETED before merge. Not committed beyond the plan's test phase.

import ExcelJS from 'exceljs';
import XLSX from 'xlsx';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(__dirname, '../tmp/workbench-fixtures');

// ============ Fixture generation ============
function setupFixtures() {
  rmSync(FIXTURE_DIR, { recursive: true, force: true });
  mkdirSync(FIXTURE_DIR, { recursive: true });
}

// ============ Assertion helper ============
let passed = 0, failed = 0;
function assertEqual(label, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
    console.log(`  PASS: ${label}`);
  } else {
    failed++;
    console.log(`  FAIL: ${label}`);
    console.log(`    expected: ${e}`);
    console.log(`    actual:   ${a}`);
  }
}

// ============ Main ============
async function main() {
  console.log('\n=== Workbench test harness ===\n');
  setupFixtures();

  // Test blocks added task-by-task below this line.

  console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
```

**Step 2: Verify the harness runs**

Run:
```bash
node scripts/test-workbench.mjs
```

Expected: prints `=== Workbench test harness ===`, then `=== 0 passed, 0 failed ===`, exits 0.

**Step 3: Commit**

```bash
git add scripts/test-workbench.mjs
git commit -m "test: add workbench test harness skeleton"
```

---

## Task 4: Generate Set A fixture files

**Files:**
- Modify: `scripts/test-workbench.mjs` (add fixture generators)

**Step 1: Extract the fixture generator spec**

Append to harness, replacing `setupFixtures()` and adding generators:

```javascript
function makeRawWorkbook({ insuranceType, year, month, rows }) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  ws.addRow(['公司名称', '金额', '日期']);
  for (const [company, amount, day] of rows) {
    ws.addRow([company, amount, new Date(year, month - 1, day)]);
  }
  return wb;
}

function makeOutputWorkbook(existingBlocks = []) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('保险登记');
  // Minimal starter: just a title row; supernova writer fills the rest
  ws.addRow(['保险登记']);
  // Existing blocks (if any) are written by an earlier supernova run
  return wb;
}

async function writeFixture(name, wb) {
  const path = join(FIXTURE_DIR, name);
  await wb.xlsx.writeFile(path);
  return path;
}

async function makeSetA() {
  // A1: output file (empty starting shell)
  await writeFixture('保险登记-2026.xlsx', makeOutputWorkbook());

  // A2: youmi 2026-02
  await writeFixture('优米-2026-02.xlsx', makeRawWorkbook({
    insuranceType: 'youmi', year: 2026, month: 2,
    rows: [['阿里巴巴', 100.00, 5], ['腾讯', 200.00, 15]],
  }));

  // A3: renBao 2026-02
  await writeFixture('人保-2026-02.xlsx', makeRawWorkbook({
    insuranceType: 'renBao', year: 2026, month: 2,
    rows: [['阿里巴巴', 50.00, 5], ['字节跳动', 75.00, 20]],
  }));

  // A4: 安淇瑞 alias for youmi, 2026-03
  await writeFixture('安淇瑞-2026-03.xlsx', makeRawWorkbook({
    insuranceType: 'youmi', year: 2026, month: 3,
    rows: [['小米', 300.00, 10]],
  }));

  // A5: cross-month bad data
  const badWb = new ExcelJS.Workbook();
  const badWs = badWb.addWorksheet('Sheet1');
  badWs.addRow(['公司名称', '金额', '日期']);
  badWs.addRow(['混乱公司', 10, new Date(2026, 1, 5)]);  // Feb
  badWs.addRow(['混乱公司', 20, new Date(2026, 2, 5)]);  // Mar
  await writeFixture('优米-混乱.xlsx', badWb);
}
```

Call `await makeSetA();` at the start of `main()` after `setupFixtures()`.

**Step 2: Run harness**

```bash
node scripts/test-workbench.mjs
ls tmp/workbench-fixtures/
```

Expected: 5 `.xlsx` files created.

**Step 3: Add .gitignore entry for tmp/**

Check if `.gitignore` already ignores `tmp/`. If not:
```bash
echo "tmp/" >> .gitignore
```

**Step 4: Commit**

```bash
git add scripts/test-workbench.mjs .gitignore
git commit -m "test: add Set A fixture generators"
```

---

## Task 5: Build `parse.ts` with TDD (dual-reader comparison)

**Files:**
- Create: `src/utils/workbench/parse.ts`
- Modify: `scripts/test-workbench.mjs` (add reference xlsx parser + comparison scenarios)

This is the highest-risk task. Follow TDD strictly.

**Step 1: Add reference `parseRawFileXlsx` to harness**

Extract the old xlsx-based read logic from OLD:L284-L355. Translate to harness utility:

```javascript
// Reference parser using xlsx (SheetJS) — matches OLD implementation exactly.
function parseRawFileXlsx(buffer, filename) {
  const insuranceType = detectInsuranceType(filename);
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });

  // First row is header; locate columns by exact label match
  const header = rows[0];
  const companyIdx = header.indexOf('公司名称');
  const amountIdx = header.indexOf('金额');
  const dateIdx = header.indexOf('日期');
  if (companyIdx < 0 || amountIdx < 0 || dateIdx < 0) {
    throw new Error(`无法识别表头：${filename}`);
  }

  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;
    const company = String(r[companyIdx] ?? '').trim();
    const amount = Number(r[amountIdx]);
    const date = r[dateIdx];
    if (!company || !Number.isFinite(amount) || !date) continue;
    const d = date instanceof Date ? date : new Date(date);
    records.push({
      company, amount,
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    });
  }

  // Enforce single month
  const months = new Set(records.map(r => `${r.year}-${r.month}`));
  if (months.size > 1) {
    throw new Error(`文件 ${filename} 包含多个月份的数据，请拆分后重试`);
  }

  return { name: filename, insuranceType, records };
}

function detectInsuranceType(filename) {
  if (filename.includes('人保')) return 'renBao';
  if (filename.includes('优米') || filename.includes('安淇瑞')) return 'youmi';
  throw new Error(`无法分类：${filename}`);
}
```

**Step 2: Add failing comparison scenario**

```javascript
async function testParse() {
  console.log('\n--- parse.ts ---');

  // Dynamic import so harness doesn't die if module is missing
  let parseExceljs;
  try {
    const mod = await import('../src/utils/workbench/parse.ts');
    parseExceljs = mod.parseRawFile;
  } catch (e) {
    console.log('  SKIP: parse.ts not yet implemented');
    return;
  }

  const files = ['优米-2026-02.xlsx', '人保-2026-02.xlsx', '安淇瑞-2026-03.xlsx'];
  for (const f of files) {
    const buf = readFileSync(join(FIXTURE_DIR, f));
    const expected = parseRawFileXlsx(buf, f);
    const actual = await parseExceljs(buf.buffer, f);
    assertEqual(`parse ${f}`, actual, expected);
  }
}
```

Add `await testParse();` in `main()`. Add `import { readFileSync } from 'node:fs';` at top.

**Step 3: Run — expect SKIP (not yet implemented)**

```bash
node scripts/test-workbench.mjs
```

Expected: `SKIP: parse.ts not yet implemented`.

**Step 4: Implement minimal `parse.ts`**

```typescript
import ExcelJS from 'exceljs';
import type { InsuranceType, RawFileData, RawRecord } from './types';
import { WorkbenchError } from './types';

function detectInsuranceType(filename: string): InsuranceType {
  if (filename.includes('人保')) return 'renBao';
  if (filename.includes('优米') || filename.includes('安淇瑞')) return 'youmi';
  throw new WorkbenchError(`无法分类：${filename}`);
}

function coerceToYearMonth(value: unknown): { year: number; month: number } | null {
  if (value instanceof Date) {
    return { year: value.getFullYear(), month: value.getMonth() + 1 };
  }
  if (typeof value === 'string') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }
  if (typeof value === 'number') {
    // Excel serial date
    const d = new Date(Math.round((value - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }
  return null;
}

export async function parseRawFile(buffer: ArrayBuffer, filename: string): Promise<RawFileData> {
  const insuranceType = detectInsuranceType(filename);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new WorkbenchError(`文件 ${filename} 没有工作表`);

  // Row 1 is header
  const header = ws.getRow(1).values as unknown[];
  const companyIdx = header.indexOf('公司名称');
  const amountIdx = header.indexOf('金额');
  const dateIdx = header.indexOf('日期');
  if (companyIdx < 0 || amountIdx < 0 || dateIdx < 0) {
    throw new WorkbenchError(`无法识别表头：${filename}`);
  }

  const records: RawRecord[] = [];
  ws.eachRow({ includeEmpty: false }, (row, rowNum) => {
    if (rowNum === 1) return;
    const values = row.values as unknown[];
    const company = String(values[companyIdx] ?? '').trim();
    const amount = Number(values[amountIdx]);
    const dateRaw = values[dateIdx];
    if (!company || !Number.isFinite(amount) || dateRaw == null) return;
    const ym = coerceToYearMonth(dateRaw);
    if (!ym) return;
    records.push({ company, amount, month: ym.month, year: ym.year });
  });

  const months = new Set(records.map(r => `${r.year}-${r.month}`));
  if (months.size > 1) {
    throw new WorkbenchError(`文件 ${filename} 包含多个月份的数据，请拆分后重试`);
  }

  return { name: filename, insuranceType, records };
}
```

**Note on exceljs row.values**: exceljs returns values as a 1-indexed array (index 0 is always empty/undefined). When `header.indexOf(...)` locates a column, the same indexing pattern applies to data rows. Verify this works by running the harness.

**Step 5: Run — expect PASS**

```bash
node scripts/test-workbench.mjs
```

Expected: all 3 `parse ...` assertions PASS.

**Step 6: If FAIL — debug**

Common issues:
- exceljs 1-indexed values: dump `row.values` for one row to confirm offset
- Header row handling: exceljs may return `row.values` with a leading undefined
- Date coercion: check which branch of `coerceToYearMonth` is hit

Use: `ExcelJS` API docs + `console.log` inside `parseRawFile` (remove before commit).

**Step 7: Add error-path scenarios**

Append to `testParse()`:
```javascript
try {
  const buf = readFileSync(join(FIXTURE_DIR, '优米-混乱.xlsx'));
  await parseExceljs(buf.buffer, '优米-混乱.xlsx');
  assertEqual('cross-month should throw', 'no throw', 'WorkbenchError');
} catch (e) {
  assertEqual('cross-month error message', e.message.includes('多个月份'), true);
}
```

Run harness. Expected: PASS.

**Step 8: Commit**

```bash
git add src/utils/workbench/parse.ts scripts/test-workbench.mjs
git commit -m "feat(workbench): parse.ts with dual-reader test coverage"
```

---

## Task 6: Build `aggregate.ts`

**Files:**
- Create: `src/utils/workbench/aggregate.ts`
- Modify: `scripts/test-workbench.mjs` (add aggregate scenarios)

**Step 1: Add failing scenarios to harness**

```javascript
async function testAggregate() {
  console.log('\n--- aggregate.ts ---');
  let aggregate;
  try {
    const mod = await import('../src/utils/workbench/aggregate.ts');
    aggregate = mod.aggregate;
  } catch (e) {
    console.log('  SKIP: aggregate.ts not yet implemented');
    return;
  }

  // Scenario A1: two files, same month, different insurance types
  const raws = [
    { name: 'y', insuranceType: 'youmi', records: [
      { company: '阿里', amount: 100, month: 2, year: 2026 },
      { company: '腾讯', amount: 200, month: 2, year: 2026 },
    ]},
    { name: 'r', insuranceType: 'renBao', records: [
      { company: '阿里', amount: 50, month: 2, year: 2026 },
      { company: '字节', amount: 75, month: 2, year: 2026 },
    ]},
  ];
  const result = aggregate(raws);
  assertEqual('agg year', result.year, 2026);
  assertEqual('agg month', result.month, 2);
  assertEqual('agg columns', result.insuranceColumns.sort(), ['优米', '人保'].sort());
  assertEqual('agg row count', result.rows.length, 3);  // 阿里, 腾讯, 字节
  assertEqual('agg 阿里 youmi', result.rows.find(r => r.company === '阿里').amounts['优米'], 100);
  assertEqual('agg 阿里 renBao', result.rows.find(r => r.company === '阿里').amounts['人保'], 50);
  assertEqual('agg grand total', result.grandTotal, 100 + 200 + 50 + 75);
}
```

Add `await testAggregate();` in `main()`.

**Step 2: Run — expect SKIP**

```bash
node scripts/test-workbench.mjs
```

**Step 3: Implement `aggregate.ts`**

Port OLD:L356-L440 (approximate range; use `git show 747fb7a^:src/components/tools/ExcelTool.svelte` to find the actual aggregation function). Translate to standalone module:

```typescript
import type { AggregatedResult, AggregatedRow, RawFileData } from './types';
import { INSURANCE_LABELS, WorkbenchError } from './types';

export function aggregate(raws: RawFileData[]): AggregatedResult {
  if (raws.length === 0) throw new WorkbenchError('没有原始数据文件');

  // All raws must share year and month
  const first = raws[0].records[0];
  if (!first) throw new WorkbenchError(`文件 ${raws[0].name} 没有有效数据`);
  const { year, month } = first;
  for (const raw of raws) {
    for (const rec of raw.records) {
      if (rec.year !== year || rec.month !== month) {
        throw new WorkbenchError('多个文件的年月不一致');
      }
    }
  }

  // Group by company, then by insurance type
  const byCompany = new Map<string, Record<string, number>>();
  const columnSet = new Set<string>();
  for (const raw of raws) {
    const colLabel = INSURANCE_LABELS[raw.insuranceType];
    columnSet.add(colLabel);
    for (const rec of raw.records) {
      if (!byCompany.has(rec.company)) byCompany.set(rec.company, {});
      const entry = byCompany.get(rec.company)!;
      entry[colLabel] = (entry[colLabel] ?? 0) + rec.amount;
    }
  }

  const insuranceColumns = [...columnSet];
  const rows: AggregatedRow[] = [...byCompany.entries()].map(([company, amounts]) => ({
    company,
    amounts,
  }));

  const totals: Record<string, number> = {};
  for (const col of insuranceColumns) {
    totals[col] = rows.reduce((sum, r) => sum + (r.amounts[col] ?? 0), 0);
  }
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  return { year, month, insuranceColumns, rows, totals, grandTotal };
}
```

**Step 4: Run — expect PASS**

```bash
node scripts/test-workbench.mjs
```

Expected: all `agg ...` assertions PASS.

**Step 5: Commit**

```bash
git add src/utils/workbench/aggregate.ts scripts/test-workbench.mjs
git commit -m "feat(workbench): aggregate.ts with coverage"
```

---

## Task 7: Build `write.ts`

**Files:**
- Create: `src/utils/workbench/write.ts`
- Modify: `scripts/test-workbench.mjs` (add write + round-trip scenarios)

**Step 1: Add round-trip scenario to harness**

```javascript
async function testWrite() {
  console.log('\n--- write.ts ---');
  let updateOutputWorkbook;
  try {
    const mod = await import('../src/utils/workbench/write.ts');
    updateOutputWorkbook = mod.updateOutputWorkbook;
  } catch (e) {
    console.log('  SKIP: write.ts not yet implemented');
    return;
  }

  // Build an AggregatedResult directly
  const result = {
    year: 2026, month: 2,
    insuranceColumns: ['优米', '人保'],
    rows: [
      { company: '阿里', amounts: { '优米': 100, '人保': 50 } },
      { company: '腾讯', amounts: { '优米': 200 } },
    ],
    totals: { '优米': 300, '人保': 50 },
    grandTotal: 350,
  };

  const outputBuf = readFileSync(join(FIXTURE_DIR, '保险登记-2026.xlsx'));
  const blob = await updateOutputWorkbook(outputBuf.buffer, result);
  const outPath = join(FIXTURE_DIR, '保险登记-updated.xlsx');
  writeFileSync(outPath, Buffer.from(await blob.arrayBuffer()));

  // Re-read and verify
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(outPath);
  const ws = wb.worksheets[0];

  // Scan rows for expected content
  let foundMonth = false, foundAli = false, foundTotal = false;
  ws.eachRow((row) => {
    const vals = (row.values as any[]).map(v => String(v ?? ''));
    if (vals.some(v => v.includes('2026') && v.includes('2'))) foundMonth = true;
    if (vals.includes('阿里')) foundAli = true;
    if (vals.some(v => v.includes('350'))) foundTotal = true;
  });

  assertEqual('write month header', foundMonth, true);
  assertEqual('write 阿里 row', foundAli, true);
  assertEqual('write grand total', foundTotal, true);
}
```

**Step 2: Run — expect SKIP**

**Step 3: Implement `write.ts`**

Copy OLD:L441-L698 verbatim (the `updateOutputWorkbook` function). Adapt:
- Extract into exported function `updateOutputWorkbook(buffer, result) => Blob`
- Return a `Blob` constructed from the exceljs output buffer
- Preserve ALL formatting code (borders, fills, alignment, number format) unchanged

The function signature:
```typescript
import ExcelJS from 'exceljs';
import type { AggregatedResult } from './types';

export async function updateOutputWorkbook(
  buffer: ArrayBuffer,
  result: AggregatedResult,
): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  // ... (copy the rest of OLD:L441-L698 logic here, adapted for module context)
  const outBuf = await wb.xlsx.writeBuffer();
  return new Blob([outBuf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
```

Read the old source carefully: `git show 747fb7a^:src/components/tools/ExcelTool.svelte | sed -n '441,698p'` and port function-by-function.

**Step 4: Run — expect PASS**

```bash
node scripts/test-workbench.mjs
```

If failures: open `tmp/workbench-fixtures/保险登记-updated.xlsx` in Excel/LibreOffice and compare visually to what the old tool would produce.

**Step 5: Commit**

```bash
git add src/utils/workbench/write.ts scripts/test-workbench.mjs
git commit -m "feat(workbench): write.ts with round-trip coverage"
```

---

## Task 8: Generate Set B stress fixtures and re-run dual-reader

**Files:**
- Modify: `scripts/test-workbench.mjs` (add Set B generator + rerun comparison over Set B)

**Step 1: Add Set B generator**

```javascript
async function makeSetB() {
  // B1: 25 companies with punctuation in names, mixed date formats
  const b1 = new ExcelJS.Workbook();
  const ws1 = b1.addWorksheet('Sheet1');
  ws1.addRow(['公司名称', '金额', '日期']);
  const companies = [
    '阿里巴巴（中国）有限公司', '腾讯·深圳', '字节·跳动，北京',
    '小米科技', '美团', '京东', '百度', '网易', '搜狐', '新浪',
    '滴滴', '快手', 'B站', '知乎', '豆瓣', '虎扑', '雪球',
    '携程', '去哪儿', '马蜂窝', '大众点评', '饿了么', '58同城',
    '赶集网', '智联招聘',
  ];
  for (let i = 0; i < companies.length; i++) {
    const amt = [0.01, 99999999.99, 1234.56, 0.0001, 500][i % 5];
    const dateValue = i % 3 === 0
      ? new Date(2026, 3, (i % 28) + 1)
      : (i % 3 === 1 ? `2026-04-${String((i % 28) + 1).padStart(2, '0')}` : 43922 + (i % 28));
    ws1.addRow([companies[i], amt, dateValue]);
  }
  await writeFixture('优米-2026-04-stress.xlsx', b1);

  // B2: whitespace in company names + blank rows
  const b2 = new ExcelJS.Workbook();
  const ws2 = b2.addWorksheet('Sheet1');
  ws2.addRow(['公司名称', '金额', '日期']);
  ws2.addRow(['  前空格公司', 100, new Date(2026, 3, 1)]);
  ws2.addRow([]);  // empty row
  ws2.addRow(['后空格公司  ', 200, new Date(2026, 3, 2)]);
  ws2.addRow([]);
  ws2.addRow(['正常公司', 300, new Date(2026, 3, 3)]);
  await writeFixture('人保-2026-04-spaces.xlsx', b2);
}
```

Add `await makeSetB();` after `await makeSetA();`.

**Step 2: Extend testParse to cover Set B**

```javascript
const setBFiles = ['优米-2026-04-stress.xlsx', '人保-2026-04-spaces.xlsx'];
for (const f of setBFiles) {
  const buf = readFileSync(join(FIXTURE_DIR, f));
  const expected = parseRawFileXlsx(buf, f);
  const actual = await parseExceljs(buf.buffer, f);
  assertEqual(`parse-B ${f}`, actual, expected);
}
```

**Step 3: Run — expect PASS or diff output**

```bash
node scripts/test-workbench.mjs
```

If diffs appear: they reveal real xlsx-vs-exceljs divergence. Fix `parse.ts` (typically coercion logic for Excel serial dates or whitespace) until all `parse-B ...` assertions PASS.

**Step 4: Commit**

```bash
git add scripts/test-workbench.mjs
git commit -m "test: Set B stress fixtures catch reader edge cases"
```

---

## Task 9: Output cell-by-cell comparison

**Files:**
- Modify: `scripts/test-workbench.mjs`

**Step 1: Add output-comparison scenario**

```javascript
async function testOutputEquivalence() {
  console.log('\n--- output equivalence (xlsx vs exceljs pipelines) ---');
  const { parseRawFile } = await import('../src/utils/workbench/parse.ts');
  const { aggregate } = await import('../src/utils/workbench/aggregate.ts');
  const { updateOutputWorkbook } = await import('../src/utils/workbench/write.ts');

  const rawFiles = ['优米-2026-02.xlsx', '人保-2026-02.xlsx'];
  const outputBuf = readFileSync(join(FIXTURE_DIR, '保险登记-2026.xlsx'));

  // Pipeline X: xlsx reader → aggregate → write
  const rawsX = rawFiles.map(f => {
    const b = readFileSync(join(FIXTURE_DIR, f));
    return parseRawFileXlsx(b, f);
  });
  const resultX = aggregate(rawsX);
  const blobX = await updateOutputWorkbook(outputBuf.buffer.slice(0), resultX);
  const pathX = join(FIXTURE_DIR, 'out-xlsx.xlsx');
  writeFileSync(pathX, Buffer.from(await blobX.arrayBuffer()));

  // Pipeline E: exceljs reader → aggregate → write
  const rawsE = [];
  for (const f of rawFiles) {
    const b = readFileSync(join(FIXTURE_DIR, f));
    rawsE.push(await parseRawFile(b.buffer, f));
  }
  const resultE = aggregate(rawsE);
  const blobE = await updateOutputWorkbook(outputBuf.buffer.slice(0), resultE);
  const pathE = join(FIXTURE_DIR, 'out-exceljs.xlsx');
  writeFileSync(pathE, Buffer.from(await blobE.arrayBuffer()));

  // Re-read both, cell-by-cell compare
  const wbX = new ExcelJS.Workbook();
  const wbE = new ExcelJS.Workbook();
  await wbX.xlsx.readFile(pathX);
  await wbE.xlsx.readFile(pathE);

  const diffs = [];
  wbX.worksheets[0].eachRow((rowX, rowNum) => {
    const rowE = wbE.worksheets[0].getRow(rowNum);
    rowX.eachCell({ includeEmpty: true }, (cellX, colNum) => {
      const cellE = rowE.getCell(colNum);
      if (JSON.stringify(cellX.value) !== JSON.stringify(cellE.value)) {
        diffs.push({ at: `${rowNum},${colNum}`, x: cellX.value, e: cellE.value });
      }
      // Style comparison (border, fill, numFmt)
      const sx = JSON.stringify({ b: cellX.border, f: cellX.fill, n: cellX.numFmt });
      const se = JSON.stringify({ b: cellE.border, f: cellE.fill, n: cellE.numFmt });
      if (sx !== se) {
        diffs.push({ at: `${rowNum},${colNum} STYLE`, x: sx, e: se });
      }
    });
  });

  assertEqual('output file diffs', diffs, []);
  if (diffs.length > 0) {
    console.log('  DIFF details:');
    for (const d of diffs.slice(0, 10)) console.log(`    ${d.at}: xlsx=${JSON.stringify(d.x)} exceljs=${JSON.stringify(d.e)}`);
  }
}
```

Add `await testOutputEquivalence();` after `testWrite()`.

**Step 2: Run**

```bash
node scripts/test-workbench.mjs
```

Expected: `output file diffs` PASS (zero diffs). If not, inspect the diff list and fix `parse.ts` until diffs reach zero.

**Step 3: Commit**

```bash
git add scripts/test-workbench.mjs
git commit -m "test: add output cell-by-cell equivalence check"
```

---

## Task 10: Create Workbench.svelte — skeleton + TaskSelector + DropZone

**Files:**
- Create: `src/components/console/Workbench.svelte`

**Step 1: Write skeleton**

```svelte
<script lang="ts">
  import { subscribeLang, getLang } from '../../i18n/langStore';
  import type { Lang } from '../../i18n/translations';
  import { TASKS, type TaskId, type UploadedFile, WorkbenchError } from '../../utils/workbench/types';
  import { parseRawFile } from '../../utils/workbench/parse';
  import { aggregate } from '../../utils/workbench/aggregate';
  import { updateOutputWorkbook } from '../../utils/workbench/write';
  import { track } from '../../utils/analytics';

  let lang: Lang = $state('en');
  $effect(() => subscribeLang(() => { lang = getLang(); }));

  let selectedTask: TaskId = $state('supernova');
  let uploadedFiles: UploadedFile[] = $state([]);
  let processing = $state(false);
  let errorMessage = $state('');

  function classifyFile(name: string): { role: 'output' | 'youmi' | 'renBao', label: string } | null {
    if (name.includes('保险登记')) return { role: 'output', label: '输出文件' };
    if (name.includes('人保')) return { role: 'renBao', label: '人保' };
    if (name.includes('优米') || name.includes('安淇瑞')) return { role: 'youmi', label: '优米' };
    return null;
  }

  async function handleFiles(files: FileList | File[]) {
    errorMessage = '';
    const arr = Array.from(files);
    const added: UploadedFile[] = [];
    for (const f of arr) {
      const cls = classifyFile(f.name);
      if (!cls) {
        errorMessage = `无法识别文件：${f.name}。请检查文件名是否包含'保险登记'、'人保'、'优米'或'安淇瑞'`;
        return;
      }
      const buf = await f.arrayBuffer();
      added.push({ name: f.name, role: cls.role, roleLabel: cls.label, buffer: buf });
    }
    uploadedFiles = [...uploadedFiles, ...added];
  }

  function removeFile(idx: number) {
    uploadedFiles = uploadedFiles.filter((_, i) => i !== idx);
  }

  async function handleProcess() {
    // Implemented in Task 11
  }

  // Drag state
  let dragActive = $state(false);
  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragActive = false;
    if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
  }
</script>

<div class="workbench">
  <section class="task-selector">
    <h2>选择任务</h2>
    {#each TASKS as task}
      <label class="task-option">
        <input type="radio" bind:group={selectedTask} value={task.id} />
        {task.label}
      </label>
    {/each}
  </section>

  <section class="workspace">
    <div
      class="drop-zone"
      class:active={dragActive}
      ondragover={(e) => { e.preventDefault(); dragActive = true; }}
      ondragleave={() => dragActive = false}
      ondrop={onDrop}
    >
      <p>拖拽 Excel 文件到这里，或</p>
      <input type="file" multiple accept=".xlsx,.xls" onchange={(e) => {
        const target = e.currentTarget as HTMLInputElement;
        if (target.files) handleFiles(target.files);
      }} />
    </div>

    {#if uploadedFiles.length > 0}
      <ul class="file-list">
        {#each uploadedFiles as file, i}
          <li>
            <span class="role-tag">{file.roleLabel}</span>
            <span class="file-name">{file.name}</span>
            <button type="button" onclick={() => removeFile(i)}>移除</button>
          </li>
        {/each}
      </ul>
    {/if}

    {#if errorMessage}
      <div class="error-banner">{errorMessage}</div>
    {/if}

    <button
      type="button"
      class="process-btn"
      disabled={processing || uploadedFiles.length === 0}
      onclick={handleProcess}
    >
      {processing ? '处理中...' : '开始处理'}
    </button>
  </section>
</div>

<style>
  /* CSS copied in Task 13 */
  .workbench { display: flex; gap: 2rem; }
  .task-selector { min-width: 12rem; }
  .workspace { flex: 1; }
  .drop-zone { border: 2px dashed #ccc; padding: 2rem; text-align: center; }
  .drop-zone.active { border-color: #333; background: #f5f5f5; }
  .file-list { list-style: none; padding: 0; }
  .error-banner { background: #c33; color: white; padding: 0.5rem 1rem; margin: 1rem 0; }
  .process-btn { padding: 0.5rem 1.5rem; }
</style>
```

**Step 2: Verify Svelte compiles**

```bash
npx astro check
```

Expected: no errors in `Workbench.svelte`. If there are unused import warnings for `WorkbenchError`, `parseRawFile`, `aggregate`, `updateOutputWorkbook`, `track` — that's OK, they're wired in Task 11.

**Step 3: Commit**

```bash
git add src/components/console/Workbench.svelte
git commit -m "feat(workbench): Svelte component skeleton with task selector and drop zone"
```

---

## Task 11: Wire up `handleProcess` and task runners

**Files:**
- Modify: `src/components/console/Workbench.svelte`

**Step 1: Replace stub `handleProcess`**

```typescript
  async function handleProcess() {
    errorMessage = '';
    const outputs = uploadedFiles.filter(f => f.role === 'output');
    const raws = uploadedFiles.filter(f => f.role !== 'output');

    if (selectedTask !== 'supernova') {
      const task = TASKS.find(t => t.id === selectedTask);
      errorMessage = `${task?.label ?? selectedTask} 暂未实现`;
      return;
    }

    if (outputs.length === 0) {
      errorMessage = "请至少上传一个输出文件（文件名包含'保险登记'）";
      return;
    }
    if (outputs.length > 1) {
      errorMessage = `只能上传一个输出文件，当前检测到 ${outputs.length} 个`;
      return;
    }
    if (raws.length === 0) {
      errorMessage = '请至少上传一个原始数据文件';
      return;
    }

    processing = true;
    try {
      track({ event: 'workbench_run', task: selectedTask, raw_count: raws.length });
      const rawDatas = [];
      for (const r of raws) {
        rawDatas.push(await parseRawFile(r.buffer, r.name));
      }
      const result = aggregate(rawDatas);
      const blob = await updateOutputWorkbook(outputs[0].buffer, result);

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = outputs[0].name.replace(/\.xlsx$/, `-${Date.now()}.xlsx`);
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      if (e instanceof WorkbenchError) {
        errorMessage = e.message;
      } else {
        console.error(e);
        errorMessage = `处理时出错：${(e as Error).message}`;
      }
    } finally {
      processing = false;
    }
  }
```

**Step 2: Verify**

```bash
npx astro check
```

Expected: 0 errors.

**Step 3: Commit**

```bash
git add src/components/console/Workbench.svelte
git commit -m "feat(workbench): wire up supernova runner and placeholders"
```

---

## Task 12: Copy CSS from old component

**Files:**
- Modify: `src/components/console/Workbench.svelte` (replace placeholder styles)

**Step 1: Extract old styles**

```bash
git show 747fb7a^:src/components/tools/ExcelTool.svelte | sed -n '/^<style>/,/^<\/style>/p' > /tmp/old-styles.css
wc -l /tmp/old-styles.css
```

**Step 2: Port styles**

Replace the `<style>` block in Workbench.svelte with the old styles, **omitting these selectors** (password UI is gone):
- `.password-screen`
- `.password-input`
- `.password-button`
- `.password-error`
- Any selectors that only exist on the pre-auth screen

Keep everything else (drop zone, file list, task selector, button, responsive media queries).

**Step 3: Verify layout**

```bash
npm run dev
```

Open browser to `http://localhost:4321/console/workbench` (page doesn't exist yet, 404 expected). But Svelte compilation of the component should succeed.

Alternative verification:
```bash
npx astro check
```

Expected: 0 errors.

**Step 4: Commit**

```bash
git add src/components/console/Workbench.svelte
git commit -m "style(workbench): port CSS from old ExcelTool, drop password UI styles"
```

---

## Task 13: Create `/console/workbench.astro` page

**Files:**
- Create: `src/pages/console/workbench.astro`

**Step 1: Write the page**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Workbench from '../../components/console/Workbench.svelte';
---

<BaseLayout title="笑笑的摸鱼工作台" description="Console workbench for Excel processing.">
  <main class="workbench-page">
    <a href="/console" class="back-link">&larr; Console</a>
    <Workbench client:only="svelte" />
  </main>
</BaseLayout>

<style>
  .workbench-page {
    max-width: 60rem;
    margin: 0 auto;
    padding: clamp(4rem, 8vh, 6rem) var(--content-padding) 4rem;
    min-height: 100dvh;
  }

  @media (max-width: 32rem) {
    .workbench-page {
      padding-top: 3rem;
    }
  }
</style>
```

**Step 2: Verify**

```bash
npx astro check
npm run dev
```

Browse to `http://localhost:4321/console/workbench`. Expected: page loads, shows task selector + drop zone. Picking files and processing should work end-to-end with the Set A fixtures.

Test flow:
- Drag `保险登记-2026.xlsx` + `优米-2026-02.xlsx` + `人保-2026-02.xlsx` from `tmp/workbench-fixtures/` into the drop zone
- Click 开始处理
- Expect: downloaded file appears; open it in Excel/LibreOffice; verify borders/fills/formatting look right

**Step 3: Commit**

```bash
git add src/pages/console/workbench.astro
git commit -m "feat(workbench): add /console/workbench page"
```

---

## Task 14: Add Workbench card to `/console/index.astro`

**Files:**
- Modify: `src/pages/console/index.astro`

**Step 1: Add the card**

Between the "New Jobs" card and the closing `</nav>`, insert:

```astro
      <a href="/console/workbench" class="console-card">
        <span class="console-card-title">Workbench</span>
        <span class="console-card-desc">笑笑的摸鱼工作台</span>
      </a>
```

**Step 2: Verify**

```bash
npx astro check
npm run dev
```

Browse to `http://localhost:4321/console`. Expected: three cards now; Workbench card links to `/console/workbench`.

**Step 3: Commit**

```bash
git add src/pages/console/index.astro
git commit -m "feat(console): add Workbench card"
```

---

## Task 15: Full manual verification

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Checklist (manual, in browser)**

- [ ] `/console` shows 3 cards; Workbench links correctly
- [ ] `/console/workbench` loads, shows "笑笑的摸鱼工作台" in tab title
- [ ] Task selector shows 3 options; supernova is default
- [ ] Drop zone accepts files by drag and by click
- [ ] Uploaded files show role tags (优米 / 人保 / 输出文件)
- [ ] Unclassifiable file name shows error banner
- [ ] Click 开始处理 without output file → error banner
- [ ] Click 开始处理 with valid Set A files → file downloads
- [ ] Downloaded file opens in Excel/LibreOffice
- [ ] Visual check: borders on all cells, fill colors on headers/totals, numbers formatted to 2 decimals, rows sorted by company
- [ ] Select neutron → click process → "中子星小吕 暂未实现"
- [ ] Select redgiant → click process → "红巨星小吕 暂未实现"
- [ ] Back link returns to `/console`
- [ ] Language toggle works (content is Chinese; English locale keeps Chinese title, toggle doesn't break page)

**Step 3: Run astro check**

```bash
npx astro check
```

Expected: 0 errors, 0 warnings.

**Step 4: Build**

```bash
npm run build
```

Expected: build succeeds. Check bundle size: workbench page should lazy-load exceljs.

**Step 5: If anything fails**

STOP. Use @superpowers:systematic-debugging to diagnose. Do not proceed to cleanup.

---

## Task 16: Cleanup — remove test harness and xlsx devDep

**Files:**
- Delete: `scripts/test-workbench.mjs`
- Delete: `tmp/workbench-fixtures/` (if committed; should already be gitignored)
- Modify: `package.json` (remove `xlsx` from devDependencies)

**Step 1: Remove test files**

```bash
rm scripts/test-workbench.mjs
rm -rf tmp/workbench-fixtures
```

**Step 2: Remove xlsx devDep**

```bash
npm uninstall xlsx
```

**Step 3: Verify final state**

```bash
cat package.json | grep -E '"xlsx"|"exceljs"'
```

Expected: only `exceljs` appears (in `dependencies`). `xlsx` is gone.

```bash
npx astro check && npm run build
```

Expected: clean build.

**Step 4: Final manual smoke test**

Run dev server once more, confirm `/console/workbench` still works end-to-end after removing xlsx.

**Step 5: Commit**

```bash
git add package.json package-lock.json scripts/
git commit -m "chore: remove workbench test harness and xlsx devDep"
```

---

## Task 17: Create PR

**Step 1: Push branch and open PR**

```bash
git push -u origin HEAD
gh pr create --title "feat: restore 笑笑的摸鱼工作台 under /console/workbench" --body "$(cat <<'EOF'
## Summary
- Restore the Excel-processing tool (removed in 747fb7a on 2026-03-21) to a new home under `/console/workbench`
- Drop the `xlsx` SheetJS dependency; `exceljs` handles both reads and writes
- No in-app auth: Cloudflare Access gates `/console/*`, consistent with existing console pages

## Design
See [docs/plans/2026-04-21-workbench-migration-design.md](./docs/plans/2026-04-21-workbench-migration-design.md) for the full design rationale.

## Verification
- Dual-reader comparison harness (xlsx reference vs exceljs production) ran on two fixture sets (functional + stress) and produced zero diffs on both the intermediate `RawFileData[]` and final output .xlsx files (cell values + styles)
- Manual browser end-to-end flow verified: file upload → process → download → open in Excel, formatting preserved

## Test plan
- [ ] `/console` shows Workbench card
- [ ] `/console/workbench` processes Set A fixtures successfully
- [ ] Downloaded output opens cleanly in Excel with all formatting
- [ ] `neutron` and `redgiant` placeholders show "暂未实现" message
- [ ] `astro check` passes
- [ ] `npm run build` succeeds

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Note: before pushing, confirm with user. Do not push automatically.

---

## Completion checklist

Per @superpowers:verification-before-completion:
- [ ] All tasks 1-16 committed
- [ ] `astro check` exit 0
- [ ] `npm run build` exit 0
- [ ] `/console/workbench` works end-to-end in browser
- [ ] `xlsx` no longer in `package.json`
- [ ] `exceljs` in `dependencies`
- [ ] `scripts/test-workbench.mjs` deleted
- [ ] Downloaded output passes visual inspection in Excel
