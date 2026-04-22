import ExcelJS from 'exceljs';
import type { InsuranceType, RawFileData, RawRecord } from './types.ts';
import { WorkbenchError } from './types.ts';

// ============ Helpers (mirror of old ExcelTool.svelte logic) ============

function normalizeHeader(s: unknown): string {
  if (s == null) return '';
  return String(s).trim().replace(/\s+/g, '').replace(/（/g, '(').replace(/）/g, ')');
}

function findColumnIndex(headers: unknown[], ...names: string[]): number {
  const normalized = headers.map((h) => (h != null ? normalizeHeader(h) : ''));
  for (const name of names) {
    const target = normalizeHeader(name);
    const idx = normalized.findIndex((h) => h === target);
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
