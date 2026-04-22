#!/usr/bin/env node
// Temporary test harness for workbench migration.
// DELETED before merge. Not committed beyond the plan's test phase.

import ExcelJS from 'exceljs';
import XLSX from 'xlsx';
import { writeFileSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = join(__dirname, '../tmp/workbench-fixtures');

// ============ Fixture generation ============
function setupFixtures() {
  rmSync(FIXTURE_DIR, { recursive: true, force: true });
  mkdirSync(FIXTURE_DIR, { recursive: true });
}

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

// ============ Scenario: parse.ts dual-reader comparison ============
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

// ============ Scenario: aggregate.ts ============
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
  assertEqual('agg columns', result.insuranceColumns, ['优米', '人保']);
  assertEqual('agg row count', result.rows.length, 3);
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

// ============ Scenario: write.ts round-trip ============
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
  const blob = await updateOutputWorkbook(
    outputBuf.buffer.slice(outputBuf.byteOffset, outputBuf.byteOffset + outputBuf.byteLength),
    result,
  );
  const outPath = join(FIXTURE_DIR, '保险登记-updated.xlsx');
  writeFileSync(outPath, Buffer.from(await blob.arrayBuffer()));

  // Re-read and verify
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(outPath);
  const ws = wb.getWorksheet('26年');

  // Scan rows for expected content
  let foundMonth = false, foundAli = false, foundTotal = false;
  ws.eachRow((row) => {
    const vals = row.values.map((v) => String(v ?? ''));
    if (vals.includes('月份')) foundMonth = true;
    if (vals.includes('阿里')) foundAli = true;
    if (vals.some((v) => v.includes('350'))) foundTotal = true;
  });

  assertEqual('write month header', foundMonth, true);
  assertEqual('write 阿里 row', foundAli, true);
  assertEqual('write grand total', foundTotal, true);
}

// ============ Main ============
async function main() {
  console.log('\n=== Workbench test harness ===\n');
  setupFixtures();
  await makeSetA();

  // Test blocks added task-by-task below this line.
  await testParse();
  await testAggregate();
  await testWrite();

  console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
