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
  await makeSetA();

  // Test blocks added task-by-task below this line.

  console.log(`\n=== ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
