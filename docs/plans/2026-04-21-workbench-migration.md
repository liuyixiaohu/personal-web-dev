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

**IMPORTANT — Real column schema (from `git show 747fb7a^:src/components/tools/ExcelTool.svelte`):**

The old tool did NOT use generic `公司名称 / 金额 / 日期` headers. Fixtures MUST use the exact column names the production parser looks for:

**优米 (youmi)** — single format, amount already in 元:
- Company: `被派遣单位`
- Amount (元): `费用（元）`
- Date: `保险起期`

**人保 (renBao)** — two formats, auto-detected, amount in **分** (divide by 100 → 元):
- **Short-term** (when `场地名称` column is present):
  - Company: `场地名称`
  - Amount (分): `保费（分）`
  - Date: `打卡时间` OR `参保时间` (either works, first match wins)
- **Long-term** (when `场地名称` is absent):
  - Company: `分组`
  - Amount (分): `保费（分）`
  - Date: `投保时间` OR `生效时间`

**Header normalization**: the parser strips whitespace and converts full-width `（）` to half-width `()`, so `费用（元）` ≡ `费用(元)` ≡ `费用 （元）`. Fixtures stay with full-width parens to match typical real-world input.

**Files:**
- Modify: `scripts/test-workbench.mjs` (add fixture generators)

**Step 1: Add fixture generators**

Append helper builders and the Set A generator:

```javascript
// ============ Schema helpers ============
const YOUMI_HEADERS = ['被派遣单位', '费用（元）', '保险起期'];
const RENBAO_SHORT_HEADERS = ['场地名称', '保费（分）', '打卡时间'];
const RENBAO_LONG_HEADERS  = ['分组',    '保费（分）', '投保时间'];

function makeYoumiWorkbook({ year, month, rows }) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  ws.addRow(YOUMI_HEADERS);
  for (const [company, amountYuan, day] of rows) {
    ws.addRow([company, amountYuan, new Date(year, month - 1, day)]);
  }
  return wb;
}

function makeRenBaoShortWorkbook({ year, month, rows }) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  ws.addRow(RENBAO_SHORT_HEADERS);
  for (const [company, amountFen, day] of rows) {
    ws.addRow([company, amountFen, new Date(year, month - 1, day)]);
  }
  return wb;
}

function makeRenBaoLongWorkbook({ year, month, rows }) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sheet1');
  ws.addRow(RENBAO_LONG_HEADERS);
  for (const [company, amountFen, day] of rows) {
    ws.addRow([company, amountFen, new Date(year, month - 1, day)]);
  }
  return wb;
}

function makeOutputWorkbook() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('保险登记');
  ws.addRow(['保险登记']);
  return wb;
}

async function writeFixture(name, wb) {
  const path = join(FIXTURE_DIR, name);
  await wb.xlsx.writeFile(path);
  return path;
}

async function makeSetA() {
  // A1: output file (starting shell — writer fills the rest)
  await writeFixture('保险登记-2026.xlsx', makeOutputWorkbook());

  // A2: youmi 2026-02 (amounts already in 元)
  await writeFixture('优米-2026-02.xlsx', makeYoumiWorkbook({
    year: 2026, month: 2,
    rows: [['阿里巴巴', 100.00, 5], ['腾讯', 200.00, 15]],
  }));

  // A3a: renBao SHORT-term 2026-02 (amounts in 分, will ÷100 at parse time)
  // Expected parsed: 阿里巴巴=50.00元, 字节跳动=75.00元
  await writeFixture('人保-短期-2026-02.xlsx', makeRenBaoShortWorkbook({
    year: 2026, month: 2,
    rows: [['阿里巴巴', 5000, 5], ['字节跳动', 7500, 20]],
  }));

  // A3b: renBao LONG-term 2026-02 (amounts in 分)
  // Expected parsed: 网易=30.00元
  await writeFixture('人保-长期-2026-02.xlsx', makeRenBaoLongWorkbook({
    year: 2026, month: 2,
    rows: [['网易', 3000, 10]],
  }));

  // A4: 安淇瑞 alias — filename contains '安淇瑞' → detected as youmi
  await writeFixture('安淇瑞-2026-03.xlsx', makeYoumiWorkbook({
    year: 2026, month: 3,
    rows: [['小米', 300.00, 10]],
  }));

  // A5: cross-month bad data (youmi schema so it parses headers, but mixed months)
  const badWb = new ExcelJS.Workbook();
  const badWs = badWb.addWorksheet('Sheet1');
  badWs.addRow(YOUMI_HEADERS);
  badWs.addRow(['混乱公司', 10.00, new Date(2026, 1, 5)]);  // Feb
  badWs.addRow(['混乱公司', 20.00, new Date(2026, 2, 5)]);  // Mar
  await writeFixture('优米-混乱.xlsx', badWb);
}
```

Call `await makeSetA();` at the start of `main()` after `setupFixtures()`.

**Step 2: Run harness**

```bash
node scripts/test-workbench.mjs
ls tmp/workbench-fixtures/
```

Expected: 6 `.xlsx` files created:
- `保险登记-2026.xlsx`
- `优米-2026-02.xlsx`
- `人保-短期-2026-02.xlsx`
- `人保-长期-2026-02.xlsx`
- `安淇瑞-2026-03.xlsx`
- `优米-混乱.xlsx`

**Step 3: Add .gitignore entry for tmp/**

```bash
grep -q '^tmp/' .gitignore || echo "tmp/" >> .gitignore
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

This is the highest-risk task. The implementation must match the old code's domain semantics **exactly**, because "same output as before" is the acceptance criterion. Reference source: `git show 747fb7a^:src/components/tools/ExcelTool.svelte` lines ~200-355.

### Domain logic summary (replicating the old code)

1. **`normalizeHeader(s)`**: strip whitespace, `（）` → `()`, so `费用（元）` ≡ `费用(元)`
2. **`findColumnIndex(headers, ...names)`**: normalize each header, try each candidate name in order, return first match index (or -1)
3. **`parseDate(value)`**: three branches, tried in order:
   - `Date` object → `{month, year}` from `getMonth()+1`/`getFullYear()`
   - String containing `(\d{4})-(\d{2})-(\d{2})` (regex, not full Date parse — first match wins)
   - Number `> 25000` treated as Excel serial: `new Date((value - 25569) * 86400 * 1000)`
   - Otherwise `null`
4. **Insurance-type branching**:
   - **youmi**: company=`被派遣单位`, amount=`费用（元）`, date=`保险起期`. Amount used as-is (in 元).
   - **renBao**: first check if `场地名称` exists:
     - Short-term (yes): company=`场地名称`, date=`打卡时间`|`参保时间`
     - Long-term (no): company=`分组`, date=`投保时间`|`生效时间`
     - Both: amount=`保费（分）`, then **divide by 100** to get 元
5. **Multi-sheet**: iterate every sheet in the workbook, collect records from all. A sheet that lacks required columns is **skipped** (not an error) — the old code logs a warning and continues.
6. **Per-row skip**: if `row[companyCol]` is falsy, skip the row.
7. **Date fallback**: if `parseDate` returns null, the record still gets pushed with `{month: 0, year: 0}`. This is a sentinel. Cross-month detection treats 0-0 records as "no date" and they don't block.
8. **Cross-month check**: happens at a higher level (in aggregate.ts, not parse.ts). The old code does NOT throw in the parser for mixed months; it happens in aggregation. However, the parse.ts caller in Workbench.svelte may still want to surface it early — we'll keep this out of parse.ts for now and add the check in aggregate.ts (Task 6).

### Step 1: Add reference `parseRawFileXlsx` + helpers to harness

This is the **xlsx-based** reference implementation used only for comparison. It must match the old code's behavior literally.

```javascript
// ============ Reference xlsx-based parser (matches 747fb7a^) ============

function normalizeHeader(s) {
  if (s == null) return '';
  return String(s).trim().replace(/\s+/g, '').replace(/（/g, '(').replace(/）/g, ')');
}

function findColumnIndex(headers, ...names) {
  const normalized = headers.map(h => h ? normalizeHeader(h) : '');
  for (const name of names) {
    const target = normalizeHeader(name);
    const idx = normalized.findIndex(h => h === target);
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return { month: value.getMonth() + 1, year: value.getFullYear() };
  }
  const str = String(value);
  const match = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return { month: parseInt(match[2], 10), year: parseInt(match[1], 10) };
  }
  if (typeof value === 'number' && value > 25000) {
    const d = new Date((value - 25569) * 86400 * 1000);
    if (!isNaN(d.getTime())) {
      return { month: d.getMonth() + 1, year: d.getFullYear() };
    }
  }
  return null;
}

function detectInsuranceType(filename) {
  if (filename.includes('人保')) return 'renBao';
  if (filename.includes('优米') || filename.includes('安淇瑞')) return 'youmi';
  throw new Error(`无法分类：${filename}`);
}

function parseRawFileXlsx(buffer, filename) {
  const insuranceType = detectInsuranceType(filename);
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const records = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
    if (data.length < 2) continue;
    const headers = data[0];

    if (insuranceType === 'youmi') {
      const companyCol = findColumnIndex(headers, '被派遣单位');
      const amountCol = findColumnIndex(headers, '费用（元）');
      const dateCol = findColumnIndex(headers, '保险起期');
      if (companyCol < 0 || amountCol < 0) continue;

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[companyCol]) continue;
        const amount = parseFloat(String(row[amountCol])) || 0;
        const dateInfo = dateCol >= 0 ? parseDate(row[dateCol]) : null;
        records.push({
          company: String(row[companyCol]).trim(),
          amount,
          month: dateInfo?.month || 0,
          year: dateInfo?.year || 0,
        });
      }
    } else {
      // renBao
      const amountCol = findColumnIndex(headers, '保费（分）');
      if (amountCol < 0) continue;
      const siteCol = findColumnIndex(headers, '场地名称');
      const isShortTerm = siteCol >= 0;
      const companyCol = isShortTerm ? siteCol : findColumnIndex(headers, '分组');
      if (companyCol < 0) continue;
      const dateCol = isShortTerm
        ? findColumnIndex(headers, '打卡时间', '参保时间')
        : findColumnIndex(headers, '投保时间', '生效时间');

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[companyCol]) continue;
        const amountFen = parseFloat(String(row[amountCol])) || 0;
        const amountYuan = amountFen / 100;
        const dateInfo = dateCol >= 0 ? parseDate(row[dateCol]) : null;
        records.push({
          company: String(row[companyCol]).trim(),
          amount: amountYuan,
          month: dateInfo?.month || 0,
          year: dateInfo?.year || 0,
        });
      }
    }
  }

  return { name: filename, insuranceType, records };
}
```

### Step 2: Add failing comparison scenario

```javascript
async function testParse() {
  console.log('\n--- parse.ts ---');
  let parseExceljs;
  try {
    const mod = await import('../src/utils/workbench/parse.ts');
    parseExceljs = mod.parseRawFile;
  } catch (e) {
    console.log('  SKIP: parse.ts not yet implemented');
    return;
  }

  const files = [
    '优米-2026-02.xlsx',
    '人保-短期-2026-02.xlsx',
    '人保-长期-2026-02.xlsx',
    '安淇瑞-2026-03.xlsx',
  ];
  for (const f of files) {
    const buf = readFileSync(join(FIXTURE_DIR, f));
    const expected = parseRawFileXlsx(buf, f);
    const actual = await parseExceljs(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), f);
    assertEqual(`parse ${f}`, actual, expected);
  }
}
```

Add `await testParse();` in `main()`. Add `import { readFileSync } from 'node:fs';` at the top of the harness.

**Note on `buffer.slice(...)`**: Node's `Buffer.buffer` may be a shared ArrayBuffer covering more than the file; `.slice(byteOffset, byteOffset + byteLength)` extracts the exact file bytes. Without it, exceljs may read junk.

### Step 3: Run — expect SKIP (parse.ts not yet implemented)

```bash
node scripts/test-workbench.mjs
```

### Step 4: Implement `parse.ts`

```typescript
import ExcelJS from 'exceljs';
import type { InsuranceType, RawFileData, RawRecord } from './types';
import { WorkbenchError } from './types';

// ============ Helpers (mirror of old ExcelTool.svelte logic) ============

function normalizeHeader(s: unknown): string {
  if (s == null) return '';
  return String(s).trim().replace(/\s+/g, '').replace(/（/g, '(').replace(/）/g, ')');
}

function findColumnIndex(headers: unknown[], ...names: string[]): number {
  const normalized = headers.map(h => (h != null ? normalizeHeader(h) : ''));
  for (const name of names) {
    const target = normalizeHeader(name);
    const idx = normalized.findIndex(h => h === target);
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseDate(value: unknown): { month: number; year: number } | null {
  if (!value) return null;
  if (value instanceof Date) {
    return { month: value.getMonth() + 1, year: value.getFullYear() };
  }
  const str = String(value);
  const match = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return { month: parseInt(match[2], 10), year: parseInt(match[1], 10) };
  }
  if (typeof value === 'number' && value > 25000) {
    const d = new Date((value - 25569) * 86400 * 1000);
    if (!isNaN(d.getTime())) {
      return { month: d.getMonth() + 1, year: d.getFullYear() };
    }
  }
  return null;
}

function detectInsuranceType(filename: string): InsuranceType {
  if (filename.includes('人保')) return 'renBao';
  if (filename.includes('优米') || filename.includes('安淇瑞')) return 'youmi';
  throw new WorkbenchError(`无法分类：${filename}`);
}

// ============ exceljs row.values normalization ============
// exceljs returns row.values as a 1-indexed array (index 0 is undefined).
// We slice to get a 0-indexed array matching xlsx's sheet_to_json({header:1}) output.
function rowValuesToArray(row: ExcelJS.Row, headerLen: number): unknown[] {
  const vals = row.values as unknown[];
  // vals[0] is always undefined. Drop it and pad to headerLen.
  const arr = Array.isArray(vals) ? vals.slice(1) : [];
  while (arr.length < headerLen) arr.push(null);
  return arr;
}

function sheetToArrays(ws: ExcelJS.Worksheet): unknown[][] {
  const rows: unknown[][] = [];
  // Use rowCount to include potentially empty rows, then drop truly empty ones
  const colCount = ws.columnCount;
  ws.eachRow({ includeEmpty: false }, (row) => {
    rows.push(rowValuesToArray(row, colCount));
  });
  return rows;
}

// ============ Main parser ============

export async function parseRawFile(buffer: ArrayBuffer, filename: string): Promise<RawFileData> {
  const insuranceType = detectInsuranceType(filename);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const records: RawRecord[] = [];

  for (const ws of wb.worksheets) {
    const data = sheetToArrays(ws);
    if (data.length < 2) continue;
    const headers = data[0];

    if (insuranceType === 'youmi') {
      const companyCol = findColumnIndex(headers, '被派遣单位');
      const amountCol = findColumnIndex(headers, '费用（元）');
      const dateCol = findColumnIndex(headers, '保险起期');
      if (companyCol < 0 || amountCol < 0) continue;

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[companyCol]) continue;
        const amount = parseFloat(String(row[amountCol])) || 0;
        const dateInfo = dateCol >= 0 ? parseDate(row[dateCol]) : null;
        records.push({
          company: String(row[companyCol]).trim(),
          amount,
          month: dateInfo?.month || 0,
          year: dateInfo?.year || 0,
        });
      }
    } else {
      // renBao: detect short-term vs long-term by presence of 场地名称
      const amountCol = findColumnIndex(headers, '保费（分）');
      if (amountCol < 0) continue;
      const siteCol = findColumnIndex(headers, '场地名称');
      const isShortTerm = siteCol >= 0;
      const companyCol = isShortTerm ? siteCol : findColumnIndex(headers, '分组');
      if (companyCol < 0) continue;
      const dateCol = isShortTerm
        ? findColumnIndex(headers, '打卡时间', '参保时间')
        : findColumnIndex(headers, '投保时间', '生效时间');

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[companyCol]) continue;
        const amountFen = parseFloat(String(row[amountCol])) || 0;
        const amountYuan = amountFen / 100;
        const dateInfo = dateCol >= 0 ? parseDate(row[dateCol]) : null;
        records.push({
          company: String(row[companyCol]).trim(),
          amount: amountYuan,
          month: dateInfo?.month || 0,
          year: dateInfo?.year || 0,
        });
      }
    }
  }

  return { name: filename, insuranceType, records };
}
```

**Important notes for the implementer:**

- Do NOT add cross-month validation here — the old code does that in aggregate, not parse. Task 6 handles it.
- Do NOT use `WorkbenchError` for "missing columns on a sheet" — the old code silently skips bad sheets (just logs a warning). Only `detectInsuranceType` throws.
- The `rowValuesToArray` helper normalizes exceljs's 1-indexed values into xlsx-style 0-indexed arrays, so the shared `findColumnIndex` + row-access logic works identically for both parsers. This is the key to making the dual-reader comparison valid.
- exceljs may return cell values as `{ richText: [...] }` or `{ result, formula }` objects for special cells. If real data needs this we'll add coercion later, but fixtures in Set A/B should produce plain values.

### Step 5: Run — expect PASS

```bash
node scripts/test-workbench.mjs
```

Expected: all 4 `parse <filename>` assertions PASS.

### Step 6: If FAIL — debug systematically

Follow this order:
1. `console.log` the first row of `data` from both parsers, compare shape
2. Dump `headers` array for both; confirm `findColumnIndex` returns same index
3. For date mismatches: log the `parseDate` input type and output
4. For amount mismatches on renBao: confirm both parsers divide by 100

Remove debug logs before commit.

### Step 7: Commit

```bash
git add src/utils/workbench/parse.ts scripts/test-workbench.mjs
git commit -m "feat(workbench): parse.ts with dual-reader test coverage"
```

---

## Task 6: Build `aggregate.ts`

**Files:**
- Create: `src/utils/workbench/aggregate.ts`
- Modify: `scripts/test-workbench.mjs` (add aggregate scenarios)

### Domain semantics (matching OLD:L357-L449)

- **Return type**: old code returns `AggregatedResult | string` where `string` is a user-facing error message. New code: throw `WorkbenchError(msg)` using the **exact same Chinese messages** so the UI banner reads identically:
  - No valid dates found: `'无法从数据中检测到日期信息'`
  - Multiple months detected: `` `检测到 ${monthList}，一次只能处理一个月份的` `` where `monthList` is periods joined by `、` and formatted as `"${year}年${month}月"`.
- **Period detection**: iterate all records from all files; only count records with `year && month` (skip `{year:0, month:0}` sentinels from failed `parseDate`). Use the **last** valid record's year/month as the detected period (old behavior — `detectedYear`/`detectedMonth` are overwritten in the loop).
- **Column order**: fixed — `['优米', '人保']`. Sort with `order.indexOf(a) - order.indexOf(b)`. Do NOT rely on Set insertion order.
- **Grouping**: by company, then by insurance column (youmi → '优米', renBao → '人保'). Multiple records for same company/column sum into one cell.
- **Totals**: per-column sum, plus `grandTotal = sum(all totals)`.

### Step 1: Add failing scenarios to harness

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

  // Scenario: two files, same month, different insurance types
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
  assertEqual('agg columns', result.insuranceColumns, ['优米', '人保']);  // fixed order
  assertEqual('agg row count', result.rows.length, 3);  // 阿里, 腾讯, 字节
  assertEqual('agg 阿里 youmi', result.rows.find(r => r.company === '阿里').amounts['优米'], 100);
  assertEqual('agg 阿里 renBao', result.rows.find(r => r.company === '阿里').amounts['人保'], 50);
  assertEqual('agg grand total', result.grandTotal, 100 + 200 + 50 + 75);

  // Scenario: cross-month should throw with exact message
  try {
    aggregate([{ name: 'x', insuranceType: 'youmi', records: [
      { company: 'A', amount: 10, month: 2, year: 2026 },
      { company: 'A', amount: 20, month: 3, year: 2026 },
    ]}]);
    assertEqual('cross-month should throw', 'no throw', 'WorkbenchError');
  } catch (e) {
    assertEqual('cross-month exact msg', e.message, '检测到 2026年2月、2026年3月，一次只能处理一个月份的');
  }

  // Scenario: no valid dates
  try {
    aggregate([{ name: 'x', insuranceType: 'youmi', records: [
      { company: 'A', amount: 10, month: 0, year: 0 },
    ]}]);
    assertEqual('no-date should throw', 'no throw', 'WorkbenchError');
  } catch (e) {
    assertEqual('no-date exact msg', e.message, '无法从数据中检测到日期信息');
  }
}
```

Add `await testAggregate();` in `main()`.

**Step 2: Run — expect SKIP**

```bash
node scripts/test-workbench.mjs
```

**Step 3: Implement `aggregate.ts`**

Port OLD:L361-L449. The key fidelity points from the old code are spelled out above ("Domain semantics").

```typescript
import type { AggregatedResult, AggregatedRow, InsuranceType, RawFileData } from './types';
import { INSURANCE_LABELS, WorkbenchError } from './types';

const COLUMN_ORDER = ['优米', '人保'];

export function aggregate(raws: RawFileData[]): AggregatedResult {
  // Collect all valid (year, month) pairs and remember the last one seen
  const periods = new Set<string>();
  let detectedYear = 0;
  let detectedMonth = 0;

  for (const rf of raws) {
    for (const r of rf.records) {
      if (r.year && r.month) {
        periods.add(`${r.year}-${r.month}`);
        detectedYear = r.year;
        detectedMonth = r.month;
      }
    }
  }

  if (periods.size === 0) {
    throw new WorkbenchError('无法从数据中检测到日期信息');
  }

  if (periods.size > 1) {
    const monthList = [...periods]
      .map(p => {
        const [y, m] = p.split('-');
        return `${y}年${m}月`;
      })
      .join('、');
    throw new WorkbenchError(`检测到 ${monthList}，一次只能处理一个月份的`);
  }

  // Group by (column, company)
  const companyMap = new Map<string, Record<string, number>>();
  const columnSet = new Set<string>();

  for (const rf of raws) {
    const colLabel: string = INSURANCE_LABELS[rf.insuranceType as InsuranceType];
    columnSet.add(colLabel);
    for (const r of rf.records) {
      const existing = companyMap.get(r.company) ?? {};
      existing[colLabel] = (existing[colLabel] ?? 0) + r.amount;
      companyMap.set(r.company, existing);
    }
  }

  const insuranceColumns = [...columnSet].sort(
    (a, b) => COLUMN_ORDER.indexOf(a) - COLUMN_ORDER.indexOf(b),
  );

  const rows: AggregatedRow[] = [];
  const totals: Record<string, number> = {};
  for (const col of insuranceColumns) totals[col] = 0;

  for (const [company, amounts] of companyMap) {
    rows.push({ company, amounts });
    for (const col of insuranceColumns) {
      if (amounts[col]) totals[col] += amounts[col];
    }
  }

  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);

  return {
    year: detectedYear,
    month: detectedMonth,
    insuranceColumns,
    rows,
    totals,
    grandTotal,
  };
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

Port OLD:L451-L696. The goal is **byte-identical output formatting** to the old tool. Copy the three internal functions (`getSheetName`, `parseExistingBlocks`, `writeMonthBlock`) and the top-level `updateOutputFile` verbatim into the module, renaming the exported function to `updateOutputWorkbook`.

### Non-negotiable fidelity requirements

These come from OLD:L451-L696 and must survive the port:

| Item | Value | Source (OLD) |
|---|---|---|
| Sheet name format | `` `${year % 100}年` `` → e.g. 2026 → `"26年"` | L451-L454 |
| Sheet created if missing | Yes, via `workbook.addWorksheet(sheetName)` | L616-L619 |
| Header row cells | A=`月份`, B=`名称`, C+=insurance columns | L540-L544 |
| Header cell style | `bold: true`, `alignment: { horizontal: 'center' }`, `fill: { type: 'pattern', pattern: 'solid', fgColor: { theme: 7, tint: 0.6 } }`, thin border all sides | L546-L556 |
| Data cell amount format | `numFmt = '#,##0.00'` | L578 |
| Data cell zero/undefined | **Skip** — do not write a value | L576 (guard) |
| Data cell border | thin border all sides | L582-L584 |
| Month cell value | numeric `block.month` (not string) | L570 |
| 合计 row col A | `'合计'` | L592 |
| 合计 row values | per-column totals, skip zero/undefined | L595-L600 |
| 合计 row border + bold | columns 1..lastDataCol (NOT the grandTotal cell) | L612-L616 |
| Grand total cell | column `allColumns.length + 3`, value = `block.grandTotal` | L604 |
| Grand total fill | yellow `{ argb: 'FFFFFF00' }` | L608-L610 |
| Grand total style | bold, yellow fill, **no border** | L618-L619 |
| Blank rows between blocks | **5 rows** (not after the last block) | L661-L664 |
| Month ordering | descending (newest first) | L652-L653 |
| Sheet clear before rebuild | all cells in 20-column-wide range set to `null`, style `{}` | L638-L647 |
| Gridlines | off: `ws.views = [{ showGridLines: false, state: 'normal' }]` | L668 |
| Column widths | col 1=8, col 2=36, cols 3-10=14 | L671-L675 |

### Function signature

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

**Purpose**: Set A confirms the happy path. Set B stresses the edge cases where `xlsx` and `exceljs` are most likely to diverge: date format variants, half/full-width parens in headers, whitespace, multi-sheet files, and alias column names.

**Step 1: Add Set B generator**

```javascript
async function makeSetB() {
  // B1: youmi with 25 companies, mixed date formats, full-width parens in header
  const b1 = new ExcelJS.Workbook();
  const ws1 = b1.addWorksheet('Sheet1');
  ws1.addRow(['被派遣单位', '费用（元）', '保险起期']);  // full-width parens
  const companies = [
    '阿里巴巴（中国）有限公司', '腾讯·深圳', '字节·跳动，北京',
    '小米科技', '美团', '京东', '百度', '网易', '搜狐', '新浪',
    '滴滴', '快手', 'B站', '知乎', '豆瓣', '虎扑', '雪球',
    '携程', '去哪儿', '马蜂窝', '大众点评', '饿了么', '58同城',
    '赶集网', '智联招聘',
  ];
  for (let i = 0; i < companies.length; i++) {
    const amt = [0.01, 99999999.99, 1234.56, 0.0001, 500][i % 5];
    // Cycle through 3 date representations: Date object, string, Excel serial
    const dateValue = i % 3 === 0
      ? new Date(2026, 3, (i % 28) + 1)
      : (i % 3 === 1
          ? `2026-04-${String((i % 28) + 1).padStart(2, '0')} 09:00:00`
          : 43922 + (i % 28));  // Excel serial for 2026-04
    ws1.addRow([companies[i], amt, dateValue]);
  }
  await writeFixture('优米-2026-04-stress.xlsx', b1);

  // B2: renBao short-term with whitespace company names + blank rows + date alias
  //     Use '参保时间' instead of '打卡时间' to test the fallback
  //     Amounts in 分 (will ÷100). Header uses half-width parens this time.
  const b2 = new ExcelJS.Workbook();
  const ws2 = b2.addWorksheet('Sheet1');
  ws2.addRow(['场地名称', '保费(分)', '参保时间']);  // half-width; date alias
  ws2.addRow(['  前空格公司', 10000, new Date(2026, 3, 1)]);   // 100元
  ws2.addRow([]);  // blank row
  ws2.addRow(['后空格公司  ', 20000, new Date(2026, 3, 2)]);   // 200元
  ws2.addRow([]);
  ws2.addRow(['正常公司', 30000, new Date(2026, 3, 3)]);       // 300元
  await writeFixture('人保-短期-spaces.xlsx', b2);

  // B3: renBao long-term with '生效时间' alias (not '投保时间'), multi-sheet
  //     First sheet has required columns, second sheet does NOT → should be skipped
  const b3 = new ExcelJS.Workbook();
  const ws3a = b3.addWorksheet('主表');
  ws3a.addRow(['分组', '保费（分）', '生效时间']);  // '生效时间' alias
  ws3a.addRow(['A组', 5000, new Date(2026, 3, 5)]);   // 50元
  ws3a.addRow(['B组', 7500, new Date(2026, 3, 6)]);   // 75元
  const ws3b = b3.addWorksheet('说明');
  ws3b.addRow(['无关列1', '无关列2']);
  ws3b.addRow(['这个 sheet 应被跳过', '不报错']);
  await writeFixture('人保-长期-multi-sheet.xlsx', b3);
}
```

Add `await makeSetB();` after `await makeSetA();`.

**Step 2: Extend `testParse` to cover Set B**

```javascript
const setBFiles = [
  '优米-2026-04-stress.xlsx',
  '人保-短期-spaces.xlsx',
  '人保-长期-multi-sheet.xlsx',
];
for (const f of setBFiles) {
  const buf = readFileSync(join(FIXTURE_DIR, f));
  const expected = parseRawFileXlsx(buf, f);
  const actual = await parseExceljs(
    buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    f,
  );
  assertEqual(`parse-B ${f}`, actual, expected);
}
```

**Step 3: Run — expect PASS or diff output**

```bash
node scripts/test-workbench.mjs
```

If diffs appear, they reveal real xlsx-vs-exceljs divergence. Most likely fix sites in `parse.ts`:
- Excel serial date coercion threshold
- Whitespace trimming in company names (should happen in both)
- Multi-sheet iteration order (should match `wb.SheetNames` in xlsx, `wb.worksheets` in exceljs)

Debug by logging `data[0]` (headers) and `data[1]` (first row) from both parsers side-by-side until the diff localizes.

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
