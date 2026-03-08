<script lang="ts">
  import { subscribe, initLang, getLang } from '../../i18n/langStore';
  import type { Lang } from '../../i18n/translations';

  // ExcelJS and XLSX are dynamically imported when needed (saves ~1.2 MB on initial load)
  type ExcelJSModule = typeof import('exceljs');
  type XLSXModule = typeof import('xlsx');

  const PASSWORD_HASH = '5dde896887f6754c9b15bfe3a441ae4806df2fde94001311e08bf110622e0bbe';

  // ============================================
  // Types
  // ============================================

  type InsuranceType = 'youmi' | 'renBao';
  type FileRole = 'output' | InsuranceType;

  interface UploadedFile {
    name: string;
    role: FileRole;
    roleLabel: string;
    buffer: ArrayBuffer;
  }

  interface RawRecord {
    company: string;
    amount: number;
    month: number;
    year: number;
  }

  interface RawFileData {
    name: string;
    insuranceType: InsuranceType;
    records: RawRecord[];
  }

  interface AggregatedRow {
    company: string;
    amounts: Record<string, number>; // { '优米': 123.45, '人保': 67.89 }
  }

  interface AggregatedResult {
    year: number;
    month: number;
    insuranceColumns: string[];
    rows: AggregatedRow[];
    totals: Record<string, number>;
    grandTotal: number;
  }

  interface MonthBlock {
    month: number;
    headers: string[]; // insurance column names (e.g. ['优米', '人保'])
    rows: { company: string; amounts: Record<string, number> }[];
    totals: Record<string, number>;
    grandTotal: number;
  }

  interface Task {
    id: string;
    label: string;
  }

  // ============================================
  // State
  // ============================================

  let lang: Lang = $state('en');

  $effect(() => {
    initLang();
    lang = getLang();
    return subscribe((l) => { lang = l; });
  });

  let authenticated = $state(false);
  let passwordInput = $state('');
  let passwordError = $state('');

  const tasks: Task[] = [
    { id: 'supernova', label: '超新星小吕' },
    { id: 'neutron', label: '中子星小吕' },
    { id: 'redgiant', label: '红巨星小吕' },
  ];

  let selectedTask = $state('supernova');
  let files: UploadedFile[] = $state([]);
  let dragging = $state(false);
  let processing = $state(false);
  let statusMessage = $state('');
  let fileTypeError = $state('');

  // ============================================
  // Auth
  // ============================================

  $effect(() => {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('excel-tool-auth') === 'true') {
      authenticated = true;
    }
  });


  async function sha256(text: string): Promise<string> {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function checkPassword() {
    passwordError = '';
    const hash = await sha256(passwordInput);
    if (hash === PASSWORD_HASH) {
      authenticated = true;
      sessionStorage.setItem('excel-tool-auth', 'true');
      (window as any).dataLayer?.push({ event: 'excel_tool_auth', success: true });
    } else {
      passwordError = '密码不对哦';
      (window as any).dataLayer?.push({ event: 'excel_tool_auth', success: false });
    }
  }

  function handlePasswordKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') checkPassword();
  }

  async function handlePasswordInput() {
    if (passwordInput.length >= 2) {
      const hash = await sha256(passwordInput);
      if (hash === PASSWORD_HASH) {
        authenticated = true;
        sessionStorage.setItem('excel-tool-auth', 'true');
      }
    }
  }

  // ============================================
  // File classification
  // ============================================

  const INSURANCE_TYPE_LABELS: Record<InsuranceType, string> = {
    youmi: '优米',
    renBao: '人保',
  };

  function classifyFile(name: string): { role: FileRole; label: string } | null {
    const lower = name.toLowerCase();
    if (name.includes('保险登记')) return { role: 'output', label: '输出表' };
    if (name.includes('人保')) return { role: 'renBao', label: '人保' };
    if (name.includes('优米')) return { role: 'youmi', label: '优米' };
    if (name.includes('安淇瑞')) return { role: 'youmi', label: '优米' };
    return null;
  }

  // ============================================
  // File handling
  // ============================================

  async function addFiles(fileList: FileList) {
    processing = true;
    statusMessage = '';
    fileTypeError = '';

    for (const file of fileList) {
      const ext = file.name.toLowerCase();
      if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
        fileTypeError = '只能是 Excel 文件，你忘啦？';
        continue;
      }

      if (selectedTask === 'supernova') {
        const classification = classifyFile(file.name);
        if (!classification) {
          fileTypeError = `文件放错了：${file.name}`;
          continue;
        }

        // Prevent duplicate output files
        if (classification.role === 'output' && files.some(f => f.role === 'output')) {
          // Replace existing output file
          files = files.filter(f => f.role !== 'output');
        }

        const buffer = await file.arrayBuffer();
        files = [...files, {
          name: file.name,
          role: classification.role,
          roleLabel: classification.label,
          buffer,
        }];
      } else {
        // Generic handling for other tasks
        const buffer = await file.arrayBuffer();
        files = [...files, {
          name: file.name,
          role: 'output',
          roleLabel: '',
          buffer,
        }];
      }
    }

    processing = false;
  }

  function removeFile(index: number) {
    files = files.filter((_, i) => i !== index);
  }

  // ============================================
  // Drag & Drop
  // ============================================

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    dragging = true;
  }

  function handleDragLeave() {
    dragging = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    if (e.dataTransfer?.files) {
      addFiles(e.dataTransfer.files);
    }
  }

  function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) {
      addFiles(input.files);
      input.value = '';
    }
  }

  // ============================================
  // Raw data parsing (SheetJS)
  // ============================================

  function parseDate(value: any): { month: number; year: number } | null {
    if (!value) return null;

    // SheetJS may return a Date object or a string
    if (value instanceof Date) {
      return { month: value.getMonth() + 1, year: value.getFullYear() };
    }

    // Try parsing string like "2026-01-21 11:48:56"
    const str = String(value);
    const match = str.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return { month: parseInt(match[2], 10), year: parseInt(match[1], 10) };
    }

    // Try Excel serial number
    if (typeof value === 'number' && value > 25000) {
      const d = new Date((value - 25569) * 86400 * 1000);
      if (!isNaN(d.getTime())) {
        return { month: d.getMonth() + 1, year: d.getFullYear() };
      }
    }

    return null;
  }

  /** Normalize Chinese header: strip whitespace, full-width → half-width parens */
  function normalizeHeader(s: string): string {
    return s.trim()
      .replace(/\s+/g, '')
      .replace(/（/g, '(')
      .replace(/）/g, ')');
  }

  function findColumnIndex(headers: any[], ...names: string[]): number {
    const normalized = headers.map(h => h ? normalizeHeader(String(h)) : '');
    for (const name of names) {
      const target = normalizeHeader(name);
      const idx = normalized.findIndex(h => h === target);
      if (idx >= 0) return idx;
    }
    return -1;
  }

  function parseRawFile(buffer: ArrayBuffer, fileName: string, insuranceType: InsuranceType, XLSX: XLSXModule): RawFileData {
    const wb = XLSX.read(buffer, { type: 'array' });
    const records: RawRecord[] = [];

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
      if (data.length < 2) continue;

      const headers = data[0];

      if (insuranceType === 'youmi') {
        const companyCol = findColumnIndex(headers, '被派遣单位');
        const amountCol = findColumnIndex(headers, '费用（元）');
        const dateCol = findColumnIndex(headers, '保险起期');
        if (companyCol < 0 || amountCol < 0) {
          console.warn(`[${fileName}] Sheet "${sheetName}": 优米列缺失: 被派遣单位=${companyCol >= 0 ? '✓' : '✗'}, 费用（元）=${amountCol >= 0 ? '✓' : '✗'}`);
          continue;
        }

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
        if (amountCol < 0) {
          console.warn(`[${fileName}] Sheet "${sheetName}": 人保列缺失: 保费（分）未找到`);
          continue;
        }

        // Detect short-term vs long-term
        const siteCol = findColumnIndex(headers, '场地名称');
        const isShortTerm = siteCol >= 0;

        const companyCol = isShortTerm
          ? siteCol
          : findColumnIndex(headers, '分组');
        if (companyCol < 0) continue;

        // Date column
        const dateCol = isShortTerm
          ? findColumnIndex(headers, '打卡时间', '参保时间')
          : findColumnIndex(headers, '投保时间', '生效时间');

        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row || !row[companyCol]) continue;
          const amountFen = parseFloat(String(row[amountCol])) || 0;
          const amountYuan = amountFen / 100; // 分 → 元
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

    return { name: fileName, insuranceType, records };
  }

  // ============================================
  // Data aggregation
  // ============================================

  function aggregateData(rawFiles: RawFileData[]): AggregatedResult | string {
    // Collect all (year, month) pairs
    const periods = new Set<string>();
    let detectedYear = 0;
    let detectedMonth = 0;

    for (const rf of rawFiles) {
      for (const r of rf.records) {
        if (r.year && r.month) {
          periods.add(`${r.year}-${r.month}`);
          detectedYear = r.year;
          detectedMonth = r.month;
        }
      }
    }

    if (periods.size === 0) {
      return '无法从数据中检测到日期信息';
    }

    if (periods.size > 1) {
      const monthList = [...periods].map(p => {
        const [y, m] = p.split('-');
        return `${y}年${m}月`;
      }).join('、');
      return `检测到 ${monthList}，一次只能处理一个月份的`;
    }

    // Map insuranceType to output column name
    const typeToColumn: Record<InsuranceType, string> = {
      youmi: '优米',
      renBao: '人保',
    };

    // Aggregate by (column, company)
    const companyMap = new Map<string, Record<string, number>>();
    const insuranceColumnsSet = new Set<string>();

    for (const rf of rawFiles) {
      const colName = typeToColumn[rf.insuranceType];
      insuranceColumnsSet.add(colName);

      for (const r of rf.records) {
        const existing = companyMap.get(r.company) || {};
        existing[colName] = (existing[colName] || 0) + r.amount;
        companyMap.set(r.company, existing);
      }
    }

    const insuranceColumns = [...insuranceColumnsSet].sort((a, b) => {
      // Fixed order: 优米 first, then 人保
      const order = ['优米', '人保'];
      return order.indexOf(a) - order.indexOf(b);
    });

    const rows: AggregatedRow[] = [];
    const totals: Record<string, number> = {};

    for (const col of insuranceColumns) {
      totals[col] = 0;
    }

    for (const [company, amounts] of companyMap) {
      rows.push({ company, amounts });
      for (const col of insuranceColumns) {
        if (amounts[col]) {
          totals[col] += amounts[col];
        }
      }
    }

    const grandTotal = Object.values(totals).reduce((sum, v) => sum + v, 0);

    return {
      year: detectedYear,
      month: detectedMonth,
      insuranceColumns,
      rows,
      totals,
      grandTotal,
    };
  }

  // ============================================
  // Output file update (ExcelJS)
  // ============================================

  function getSheetName(year: number): string {
    const shortYear = year % 100;
    return `${shortYear}年`;
  }

  function parseExistingBlocks(ws: any): Map<number, MonthBlock> {
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
    ws: any,
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
      cell.border = thinBorder;
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { theme: 7, tint: 0.6 },
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
        r.getCell(ci).border = thinBorder;
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
      totalRow.getCell(ci).border = thinBorder;
      totalRow.getCell(ci).font = { bold: true };
    }
    // grandTotal cell: bold + yellow only, no border
    totalRow.getCell(grandTotalCol).font = { bold: true };
    totalRow.commit();
    currentRow++;

    return currentRow; // next available row
  }

  async function updateOutputFile(
    outputBuffer: ArrayBuffer,
    aggregated: AggregatedResult,
    ExcelJS: ExcelJSModule
  ): Promise<ArrayBuffer> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(outputBuffer);

    const sheetName = getSheetName(aggregated.year);
    let ws = workbook.getWorksheet(sheetName);

    if (!ws) {
      // Create new sheet
      ws = workbook.addWorksheet(sheetName);
    }

    // Parse existing blocks
    const existingBlocks = parseExistingBlocks(ws);

    // Create or replace the target month block
    const newBlock: MonthBlock = {
      month: aggregated.month,
      headers: aggregated.insuranceColumns,
      rows: aggregated.rows.map(r => ({
        company: r.company,
        amounts: { ...r.amounts },
      })),
      totals: { ...aggregated.totals },
      grandTotal: aggregated.grandTotal,
    };

    existingBlocks.set(aggregated.month, newBlock);

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
    ws.getColumn(1).width = 8;  // 月份
    ws.getColumn(2).width = 36; // 名称
    for (let c = 3; c <= 10; c++) {
      ws.getColumn(c).width = 14;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as ArrayBuffer;
  }

  // ============================================
  // Supernova task processor
  // ============================================

  async function processSupernova() {
    processing = true;
    statusMessage = '处理中…';
    fileTypeError = '';

    try {
      // 1. Validate files
      const outputFile = files.find(f => f.role === 'output');
      const rawFiles = files.filter(f => f.role !== 'output');

      if (!outputFile) {
        statusMessage = '保险登记表.xlsx 你给忘了，哥们儿';
        processing = false;
        return;
      }

      if (rawFiles.length === 0) {
        statusMessage = '保险登记表也放进来！';
        processing = false;
        return;
      }

      // Dynamically import heavy libraries (saves ~1.2 MB on initial page load)
      statusMessage = '加载处理引擎…';
      const [ExcelJS, XLSX] = await Promise.all([
        import('exceljs'),
        import('xlsx'),
      ]);

      // 2. Parse raw data files
      const parsedRawFiles: RawFileData[] = [];
      for (const f of rawFiles) {
        const parsed = parseRawFile(f.buffer, f.name, f.role as InsuranceType, XLSX);
        if (parsed.records.length === 0) {
          statusMessage = `${f.name} 中没有找到有效数据: 请确认表头列名正确`;
          processing = false;
          return;
        }
        parsedRawFiles.push(parsed);
      }

      statusMessage = '处理中…';

      // 3. Aggregate data (includes month validation)
      const result = aggregateData(parsedRawFiles);
      if (typeof result === 'string') {
        statusMessage = result;
        processing = false;
        return;
      }

      // 4. Update output file
      const updatedBuffer = await updateOutputFile(outputFile.buffer, result, ExcelJS);

      // 5. Download
      const blob = new Blob([updatedBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '保险登记表.xlsx';
      a.click();
      URL.revokeObjectURL(url);

      statusMessage = `✓ 已更新 ${result.month}月数据，下载中…`;
      (window as any).dataLayer?.push({ event: 'excel_tool_process', task: selectedTask, month: result.month, year: result.year });
    } catch (err) {
      statusMessage = `处理失败: ${err instanceof Error ? err.message : '未知错误'}`;
    }

    processing = false;
  }

  // ============================================
  // Action handler
  // ============================================

  function handleAction() {
    if (selectedTask === 'supernova') {
      processSupernova();
    }
    // neutron and redgiant: to be implemented
  }
</script>

{#if !authenticated}
  <!-- Password gate -->
  <div class="password-gate">
    <div class="password-intro">
      <p>{lang === 'zh'
        ? 'Hey，你发现了这个彩蛋（尽管我已经努力在隐藏它了）！'
        : 'Hey, you found this easter egg (despite my best efforts to hide it)!'}</p>
      <p>{lang === 'zh'
        ? '这个页面的后面是为我女友和伙伴们制做的一些便利他们生活或工作的小工具。'
        : 'Behind this page are some little tools I made for my girlfriend and buddies to make their lives or work a bit easier.'}</p>
    </div>
    <div class="password-row">
      <input
        type="password"
        bind:value={passwordInput}
        onkeydown={handlePasswordKeydown}
        oninput={handlePasswordInput}
        placeholder="···"
        class="password-input"
      />
    </div>
    {#if passwordError}
      <p class="error">{passwordError}</p>
    {/if}
  </div>
{:else}
  <!-- Tool UI -->
  <div class="tool">
    <h1 class="tool-title">笑笑的摸鱼工作台</h1>
    <p class="tool-subtitle">
      我要让你的聪慧走出家宅内院<br>
      投向山川湖海，那儿才是你真正绽放光彩的地方
    </p>

    <!-- Task selector + Drop zone side by side -->
    <div class="workspace">
      <div class="task-selector">
        {#each tasks as task}
          <label class="task-option" class:task-option--active={selectedTask === task.id}>
            <input
              type="radio"
              name="task"
              value={task.id}
              bind:group={selectedTask}
              class="task-radio"
            />
            <span class="task-label">{task.label}</span>
          </label>
        {/each}
      </div>

      <div
        class="drop-zone"
        class:drop-zone--active={dragging}
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
        role="button"
        tabindex="0"
        onclick={() => document.getElementById('file-input')?.click()}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('file-input')?.click(); }}
      >
        <p class="drop-text">
          {dragging ? '松开即可上传' : '文件搁这儿！'}
        </p>
        {#if fileTypeError}
          <p class="drop-error">{fileTypeError}</p>
        {/if}
      </div>
    </div>
    <input
      id="file-input"
      type="file"
      accept=".xlsx,.xls"
      multiple
      onchange={handleFileInput}
      style="display:none"
    />

    {#if statusMessage}
      <p class="status" class:status--error={statusMessage.includes('忘了') || statusMessage.includes('放错') || statusMessage.includes('失败') || statusMessage.includes('检测到') || statusMessage.includes('放进来') || statusMessage.includes('没有找到')}>
        {statusMessage}
      </p>
    {/if}

    <!-- File list -->
    {#if files.length > 0}
      <div class="file-list">
        <div class="file-list-header">
          <h2 class="section-label">已上传文件</h2>
          <button class="clear-all" onclick={() => { files = []; statusMessage = ''; fileTypeError = ''; }}>清空</button>
        </div>
        {#each files as file, i}
          <div class="file-item">
            <span class="file-name">
              {file.name}
              {#if file.roleLabel}
                <span class="file-role">{file.roleLabel}</span>
              {/if}
            </span>
            <button class="file-remove" onclick={() => removeFile(i)} title="移除">&times;</button>
          </div>
        {/each}
      </div>

      <!-- Action button -->
      <div class="actions">
        <button class="btn btn--primary" onclick={handleAction} disabled={processing}>
          {#if processing}
            处理中…
          {:else if selectedTask === 'supernova'}
            开始汇总
          {:else}
            开始处理
          {/if}
        </button>
      </div>
    {/if}
  </div>
{/if}

<style>
  /* --- Password gate --- */
  .password-gate {
    text-align: center;
    padding: 4rem 1.5rem;
  }

  .password-intro {
    max-width: 24rem;
    margin: 0 auto 2rem;
    font-size: var(--fs-xs);
    color: var(--text-light);
    line-height: 1.7;
  }

  .password-intro p + p {
    margin-top: 0.6rem;
  }

  .password-row {
    display: flex;
    justify-content: center;
    max-width: 12rem;
    margin: 0 auto;
  }

  .password-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: none;
    border-bottom: 1px solid var(--border);
    border-radius: 0;
    font-size: var(--fs-base);
    background: transparent;
    color: var(--text);
    font-family: inherit;
    text-align: center;
    letter-spacing: 0.3em;
  }

  .password-input:focus {
    outline: none;
    border-color: var(--text-light);
  }

  .error {
    color: var(--color-pm);
    font-size: var(--fs-xs);
    margin-top: 0.6rem;
  }

  /* --- Buttons --- */
  .btn {
    padding: 0.5rem 1rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: transparent;
    color: var(--text);
    font-size: var(--fs-xs);
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }

  .btn:hover {
    background: rgba(0, 0, 0, 0.03);
    border-color: var(--text-light);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .btn--primary {
    background: var(--text);
    color: var(--bg);
    border-color: var(--text);
  }

  .btn--primary:hover {
    opacity: 0.85;
    background: var(--text);
  }

  /* --- Tool --- */
  .tool-title {
    font-size: var(--fs-md);
    font-weight: 500;
    color: var(--text);
    margin-bottom: 0.3rem;
  }

  .tool-subtitle {
    font-size: var(--fs-xs);
    color: var(--text-light);
    margin-bottom: 1.8rem;
    line-height: 1.8;
  }

  /* --- Workspace (task selector + drop zone) --- */
  .workspace {
    display: flex;
    gap: 1.2rem;
    align-items: stretch;
  }

  .task-selector {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 10rem;
  }

  .task-option {
    display: flex;
    align-items: center;
    gap: 0.5em;
    padding: 0.45rem 0.7rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.15s;
    font-size: var(--fs-xs);
    color: var(--text-light);
  }

  .task-option:hover {
    background: rgba(0, 0, 0, 0.025);
  }

  .task-option--active {
    color: var(--text);
    background: rgba(0, 0, 0, 0.04);
  }

  .task-radio {
    appearance: none;
    width: 0.55rem;
    height: 0.55rem;
    border: 1.5px solid var(--border);
    border-radius: 50%;
    flex-shrink: 0;
    transition: border-color 0.15s, background 0.15s;
  }

  .task-option--active .task-radio {
    border-color: var(--text);
    background: var(--text);
  }

  .task-label {
    line-height: 1.3;
  }

  /* --- Drop zone --- */
  .drop-zone {
    flex: 1;
    border: 2px dashed var(--border);
    border-radius: 8px;
    padding: 2.5rem 1rem;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .drop-zone:hover,
  .drop-zone--active {
    border-color: var(--text-light);
    background: rgba(0, 0, 0, 0.015);
  }

  .drop-text {
    font-size: var(--fs-base);
    color: var(--text);
  }

  .drop-error {
    font-size: var(--fs-xs);
    color: var(--color-pm);
    margin-top: 0.5rem;
  }

  .status {
    font-size: var(--fs-xs);
    color: var(--text-light);
    margin-top: 0.8rem;
  }

  .status--error {
    color: var(--color-pm);
  }

  /* --- File list --- */
  .file-list {
    margin-top: 1.8rem;
  }

  .file-list-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 0.6rem;
  }

  .section-label {
    font-size: var(--fs-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-light);
    margin-bottom: 0;
  }

  .clear-all {
    background: none;
    border: none;
    font-size: var(--fs-xs);
    font-family: inherit;
    color: var(--text-light);
    cursor: pointer;
    transition: color 0.15s;
    padding: 0;
  }

  .clear-all:hover {
    color: var(--color-pm);
  }

  .file-item {
    display: flex;
    align-items: center;
    padding: 0.45rem 0.6rem;
    border-radius: 4px;
    transition: background 0.1s;
  }

  .file-name {
    flex: 1;
    text-align: left;
    font-size: var(--fs-xs);
    color: var(--text);
  }

  .file-role {
    display: inline-block;
    font-size: var(--fs-xs);
    color: var(--text-light);
    background: rgba(0, 0, 0, 0.04);
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    margin-left: 0.5em;
    vertical-align: middle;
  }

  .file-remove {
    background: none;
    border: none;
    font-size: var(--fs-base);
    color: var(--text-light);
    cursor: pointer;
    padding: 0 0.3rem;
    line-height: 1;
  }

  .file-remove:hover {
    color: var(--color-pm);
  }

  /* --- Actions --- */
  .actions {
    margin-top: 1.5rem;
    display: flex;
    gap: 0.8rem;
  }

  /* --- Mobile --- */
  @media (max-width: 480px) {
    .workspace {
      flex-direction: column;
    }

    .task-selector {
      flex-direction: row;
      flex-wrap: wrap;
      min-width: 0;
    }

    .drop-zone {
      padding: 1.8rem 0.8rem;
    }

    .actions {
      flex-direction: column;
    }

    .password-row {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
