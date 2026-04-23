import type { AggregatedResult, AggregatedRow, InsuranceType, RawFileData } from './types.ts';
import { INSURANCE_LABELS, WorkbenchError } from './types.ts';

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
      .map((p) => {
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
