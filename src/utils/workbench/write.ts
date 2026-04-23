import ExcelJS from 'exceljs';
import type { AggregatedResult, MonthBlock } from './types.ts';

// ============================================
// Output file update (ExcelJS)
// ============================================

function getSheetName(year: number): string {
  const shortYear = year % 100;
  return `${shortYear}年`;
}

function parseExistingBlocks(ws: ExcelJS.Worksheet): Map<number, MonthBlock> {
  const blocks = new Map<number, MonthBlock>();
  let currentBlock: {
    month: number;
    headers: string[];
    rows: { company: string; amounts: Record<string, number> }[];
    startRow: number;
  } | null = null;

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const cellB = row.getCell(1).value; // Column A (1-indexed in ExcelJS)
    const cellC = row.getCell(2).value; // Column B

    // Detect header row: "月份" in col A, "名称" in col B
    if (String(cellB).trim() === '月份' && String(cellC).trim() === '名称') {
      // Start a new block
      const headers: string[] = [];
      for (let c = 3; c <= row.cellCount; c++) {
        const val = row.getCell(c).value;
        if (val && String(val).trim()) {
          headers.push(String(val).trim());
        }
      }
      currentBlock = { month: 0, headers, rows: [], startRow: rowNumber };
      return;
    }

    if (!currentBlock) return;

    // Detect 合计 row
    if (String(cellB).trim() === '合计') {
      const totals: Record<string, number> = {};
      let grandTotal = 0;
      for (let c = 0; c < currentBlock.headers.length; c++) {
        const val = row.getCell(c + 3).value;
        const num = typeof val === 'number' ? val : parseFloat(String(val)) || 0;
        totals[currentBlock.headers[c]] = num;
      }
      grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);

      if (currentBlock.month > 0) {
        blocks.set(currentBlock.month, {
          month: currentBlock.month,
          headers: currentBlock.headers,
          rows: currentBlock.rows,
          totals,
          grandTotal,
        });
      }
      currentBlock = null;
      return;
    }

    // Data row
    const monthVal = typeof cellB === 'number' ? cellB : parseInt(String(cellB), 10);
    if (monthVal && monthVal >= 1 && monthVal <= 12) {
      if (!currentBlock.month) currentBlock.month = monthVal;

      const company = String(cellC || '').trim();
      if (!company) return;

      const amounts: Record<string, number> = {};
      for (let c = 0; c < currentBlock.headers.length; c++) {
        const val = row.getCell(c + 3).value;
        if (val !== null && val !== undefined && val !== '') {
          const num = typeof val === 'number' ? val : parseFloat(String(val));
          if (!isNaN(num)) {
            amounts[currentBlock.headers[c]] = num;
          }
        }
      }
      currentBlock.rows.push({ company, amounts });
    }
  });

  return blocks;
}

function writeMonthBlock(
  ws: ExcelJS.Worksheet,
  startRow: number,
  block: MonthBlock
): number {
  const allColumns = block.headers;
  const thinBorder = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };

  // Header row: 月份, 名称, ...insurance columns
  const headerRow = ws.getRow(startRow);
  headerRow.getCell(1).value = '月份';
  headerRow.getCell(2).value = '名称';
  for (let c = 0; c < allColumns.length; c++) {
    headerRow.getCell(c + 3).value = allColumns[c];
  }
  // Apply border, bold, centered, and background to header
  for (let c = 1; c <= allColumns.length + 2; c++) {
    const cell = headerRow.getCell(c);
    cell.border = thinBorder as ExcelJS.Borders;
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { theme: 7, tint: 0.6 } as unknown as ExcelJS.Color,
    };
  }
  headerRow.commit();

  let currentRow = startRow + 1;

  // Data rows
  for (const row of block.rows) {
    const r = ws.getRow(currentRow);
    r.getCell(1).value = block.month;
    r.getCell(2).value = row.company;
    for (let c = 0; c < allColumns.length; c++) {
      const val = row.amounts[allColumns[c]];
      if (val !== undefined && val !== 0) {
        r.getCell(c + 3).value = val;
        r.getCell(c + 3).numFmt = '#,##0.00';
      }
    }
    // Apply border
    for (let ci = 1; ci <= allColumns.length + 2; ci++) {
      r.getCell(ci).border = thinBorder as ExcelJS.Borders;
    }
    r.commit();
    currentRow++;
  }

  // 合计 row
  const totalRow = ws.getRow(currentRow);
  totalRow.getCell(1).value = '合计';
  for (let c = 0; c < allColumns.length; c++) {
    const val = block.totals[allColumns[c]];
    if (val !== undefined && val !== 0) {
      totalRow.getCell(c + 3).value = val;
      totalRow.getCell(c + 3).numFmt = '#,##0.00';
    }
  }

  // Grand total in the column after the last insurance column
  const grandTotalCol = allColumns.length + 3;
  totalRow.getCell(grandTotalCol).value = block.grandTotal;
  totalRow.getCell(grandTotalCol).numFmt = '#,##0.00';
  // Yellow background for grand total cell
  totalRow.getCell(grandTotalCol).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFF00' },
  };

  // Apply border + bold to 合计 row (only data columns, not grandTotal)
  const lastDataCol = allColumns.length + 2;
  for (let ci = 1; ci <= lastDataCol; ci++) {
    totalRow.getCell(ci).border = thinBorder as ExcelJS.Borders;
    totalRow.getCell(ci).font = { bold: true };
  }
  // grandTotal cell: bold + yellow only, no border
  totalRow.getCell(grandTotalCol).font = { bold: true };
  totalRow.commit();
  currentRow++;

  return currentRow; // next available row
}

export async function updateOutputWorkbook(
  buffer: ArrayBuffer,
  result: AggregatedResult,
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheetName = getSheetName(result.year);
  let ws = workbook.getWorksheet(sheetName);

  if (!ws) {
    // Create new sheet
    ws = workbook.addWorksheet(sheetName);
  }

  // Parse existing blocks
  const existingBlocks = parseExistingBlocks(ws);

  // Create or replace the target month block
  const newBlock: MonthBlock = {
    month: result.month,
    headers: result.insuranceColumns,
    rows: result.rows.map((r) => ({
      company: r.company,
      amounts: { ...r.amounts },
    })),
    totals: { ...result.totals },
    grandTotal: result.grandTotal,
  };

  existingBlocks.set(result.month, newBlock);

  // Sort months in descending order
  const sortedMonths = [...existingBlocks.keys()].sort((a, b) => b - a);

  // Clear the sheet content: iterate all columns explicitly
  // (eachCell skips cells with formatting but no value)
  const rowCount = ws.rowCount;
  for (let r = rowCount; r >= 1; r--) {
    const row = ws.getRow(r);
    for (let c = 1; c <= 20; c++) {
      const cell = row.getCell(c);
      cell.value = null;
      cell.style = {};
    }
    row.commit();
  }

  // Rebuild sheet with all blocks
  let currentRow = 1;

  for (let i = 0; i < sortedMonths.length; i++) {
    const month = sortedMonths[i];
    const block = existingBlocks.get(month)!;
    currentRow = writeMonthBlock(ws, currentRow, block);

    // Add 5 blank rows between blocks (not after the last one)
    if (i < sortedMonths.length - 1) {
      currentRow += 5;
    }
  }

  // Turn off gridlines
  ws.views = [{ showGridLines: false, state: 'normal' }];

  // Set reasonable column widths
  ws.getColumn(1).width = 8; // 月份
  ws.getColumn(2).width = 36; // 名称
  for (let c = 3; c <= 10; c++) {
    ws.getColumn(c).width = 14;
  }

  const outBuf = await workbook.xlsx.writeBuffer();
  return new Blob([outBuf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
