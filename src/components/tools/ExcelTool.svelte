<script lang="ts">
  import ExcelJS from 'exceljs';

  const PASSWORD_HASH = '5dde896887f6754c9b15bfe3a441ae4806df2fde94001311e08bf110622e0bbe';

  // --- State ---
  let authenticated = $state(false);
  let passwordInput = $state('');
  let passwordError = $state('');

  interface UploadedFile {
    name: string;
    workbook: ExcelJS.Workbook;
    sheetNames: string[];
  }

  let files: UploadedFile[] = $state([]);
  let activeFileIndex = $state(0);
  let activeSheetName = $state('');
  let dragging = $state(false);
  let processing = $state(false);
  let statusMessage = $state('');

  // --- Derived ---
  let activeFile = $derived(files[activeFileIndex]);
  let previewRows = $derived(getPreviewRows());

  // --- Auth ---
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
    } else {
      passwordError = '密码不对哦';
    }
  }

  function handlePasswordKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') checkPassword();
  }

  // --- File handling ---
  async function parseFile(file: File): Promise<UploadedFile | null> {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const sheetNames = workbook.worksheets.map(ws => ws.name);
      return { name: file.name, workbook, sheetNames };
    } catch {
      statusMessage = `无法读取 ${file.name}，请确认是 .xlsx 文件`;
      return null;
    }
  }

  async function addFiles(fileList: FileList) {
    processing = true;
    statusMessage = '';
    for (const file of fileList) {
      if (!file.name.endsWith('.xlsx')) {
        statusMessage = `${file.name} 不是 .xlsx 文件，已跳过`;
        continue;
      }
      const parsed = await parseFile(file);
      if (parsed) {
        files = [...files, parsed];
      }
    }
    if (files.length > 0 && !activeSheetName) {
      activeFileIndex = 0;
      activeSheetName = files[0].sheetNames[0] || '';
    }
    processing = false;
  }

  function removeFile(index: number) {
    files = files.filter((_, i) => i !== index);
    if (activeFileIndex >= files.length) {
      activeFileIndex = Math.max(0, files.length - 1);
    }
    if (files.length > 0) {
      activeSheetName = files[activeFileIndex].sheetNames[0] || '';
    } else {
      activeSheetName = '';
    }
  }

  function selectFile(index: number) {
    activeFileIndex = index;
    activeSheetName = files[index].sheetNames[0] || '';
  }

  // --- Drag & Drop ---
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

  // --- Preview ---
  function getPreviewRows(): string[][] {
    if (!activeFile || !activeSheetName) return [];
    const ws = activeFile.workbook.getWorksheet(activeSheetName);
    if (!ws) return [];

    const rows: string[][] = [];
    let count = 0;
    ws.eachRow({ includeEmpty: true }, (row, _rowNumber) => {
      if (count >= 50) return;
      const cells: string[] = [];
      for (let c = 1; c <= (ws.columnCount || 1); c++) {
        const cell = row.getCell(c);
        if (cell.formula) {
          cells.push(`=${cell.formula}`);
        } else if (cell.value !== null && cell.value !== undefined) {
          cells.push(String(cell.value));
        } else {
          cells.push('');
        }
      }
      rows.push(cells);
      count++;
    });
    return rows;
  }

  // --- Merge ---
  async function mergeAndDownload() {
    if (files.length === 0) return;

    processing = true;
    statusMessage = '合并中…';

    try {
      const merged = new ExcelJS.Workbook();
      const usedNames = new Set<string>();

      for (const f of files) {
        for (const ws of f.workbook.worksheets) {
          let name = ws.name;
          if (usedNames.has(name)) {
            let suffix = 1;
            while (usedNames.has(`${ws.name}_${suffix}`)) suffix++;
            name = `${ws.name}_${suffix}`;
          }
          usedNames.add(name);

          const newWs = merged.addWorksheet(name);

          // Copy column widths
          ws.columns.forEach((col, i) => {
            if (col.width) {
              newWs.getColumn(i + 1).width = col.width;
            }
          });

          // Copy rows with values, formulas, and styles
          ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            const newRow = newWs.getRow(rowNumber);
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              const newCell = newRow.getCell(colNumber);
              if (cell.formula) {
                newCell.value = { formula: cell.formula } as ExcelJS.CellFormulaValue;
              } else {
                newCell.value = cell.value;
              }
              if (cell.numFmt) newCell.numFmt = cell.numFmt;
              if (cell.style) {
                newCell.font = cell.font;
                newCell.alignment = cell.alignment;
                newCell.border = cell.border;
                newCell.fill = cell.fill;
              }
            });
            newRow.height = row.height;
            newRow.commit();
          });

          // Copy merged cells
          ws.model.merges?.forEach((merge: string) => {
            newWs.mergeCells(merge);
          });
        }
      }

      const buffer = await merged.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.xlsx';
      a.click();
      URL.revokeObjectURL(url);

      statusMessage = '合并完成，已下载';
    } catch (err) {
      statusMessage = `合并失败: ${err instanceof Error ? err.message : '未知错误'}`;
    }

    processing = false;
  }

  // --- Single file download ---
  async function downloadFile(index: number) {
    const f = files[index];
    if (!f) return;

    const buffer = await f.workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = f.name;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

{#if !authenticated}
  <!-- Password gate -->
  <div class="password-gate">
    <div class="lock-icon">&#128274;</div>
    <p class="password-label">请输入密码</p>
    <div class="password-row">
      <input
        type="password"
        bind:value={passwordInput}
        onkeydown={handlePasswordKeydown}
        placeholder="密码"
        class="password-input"
      />
      <button onclick={checkPassword} class="btn btn--primary">确认</button>
    </div>
    {#if passwordError}
      <p class="error">{passwordError}</p>
    {/if}
  </div>
{:else}
  <!-- Tool UI -->
  <div class="tool">
    <h1 class="tool-title">摸鱼工作台</h1>
    <p class="tool-subtitle">愿你少花时间在重复上，多留时间给值得的事。</p>

    <!-- Drop zone -->
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
        {dragging ? '松开即可上传' : '拖拽文件到此处'}
      </p>
      <p class="drop-sub">或点击选择文件 · 支持 .xlsx</p>
    </div>
    <input
      id="file-input"
      type="file"
      accept=".xlsx"
      multiple
      onchange={handleFileInput}
      style="display:none"
    />

    {#if statusMessage}
      <p class="status">{statusMessage}</p>
    {/if}

    <!-- File list -->
    {#if files.length > 0}
      <div class="file-list">
        <h2 class="section-label">已上传文件</h2>
        {#each files as file, i}
          <div class="file-item" class:file-item--active={i === activeFileIndex}>
            <button class="file-name" onclick={() => selectFile(i)}>
              {file.name}
              <span class="file-sheets">{file.sheetNames.length} sheet{file.sheetNames.length > 1 ? 's' : ''}</span>
            </button>
            <button class="file-remove" onclick={() => removeFile(i)} title="移除">&times;</button>
          </div>
        {/each}
      </div>

      <!-- Sheet tabs + Preview -->
      {#if activeFile}
        <div class="preview">
          <div class="sheet-tabs">
            {#each activeFile.sheetNames as name}
              <button
                class="sheet-tab"
                class:sheet-tab--active={name === activeSheetName}
                onclick={() => { activeSheetName = name; }}
              >{name}</button>
            {/each}
          </div>

          <div class="table-wrap">
            {#if previewRows.length > 0}
              <table>
                {#each previewRows as row, ri}
                  <tr class:header-row={ri === 0}>
                    {#each row as cell}
                      {#if ri === 0}
                        <th>{cell}</th>
                      {:else}
                        <td>{cell}</td>
                      {/if}
                    {/each}
                  </tr>
                {/each}
              </table>
              {#if previewRows.length >= 50}
                <p class="preview-note">仅显示前 50 行</p>
              {/if}
            {:else}
              <p class="preview-empty">此 Sheet 为空</p>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Actions -->
      <div class="actions">
        {#if files.length >= 2}
          <button class="btn btn--primary" onclick={mergeAndDownload} disabled={processing}>
            {processing ? '处理中…' : '合并所有文件'}
          </button>
        {/if}
        {#if files.length === 1}
          <button class="btn btn--primary" onclick={() => downloadFile(0)} disabled={processing}>
            下载
          </button>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  /* --- Password gate --- */
  .password-gate {
    text-align: center;
    padding: 4rem 0;
  }

  .lock-icon {
    font-size: 2rem;
    margin-bottom: 1rem;
    opacity: 0.4;
  }

  .password-label {
    font-size: var(--fs-base);
    color: var(--text);
    margin-bottom: 1.2rem;
  }

  .password-row {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    max-width: 20rem;
    margin: 0 auto;
  }

  .password-input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    font-size: var(--fs-sm);
    background: transparent;
    color: var(--text);
    font-family: inherit;
  }

  .password-input:focus {
    outline: none;
    border-color: var(--text-light);
  }

  .error {
    color: #b55;
    font-size: var(--fs-sm);
    margin-top: 0.6rem;
  }

  /* --- Buttons --- */
  .btn {
    padding: 0.5rem 1rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: transparent;
    color: var(--text);
    font-size: var(--fs-sm);
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
    font-size: clamp(1.1rem, 1rem + 0.4vw, 1.3rem);
    font-weight: 500;
    color: var(--text);
    margin-bottom: 0.3rem;
  }

  .tool-subtitle {
    font-size: var(--fs-sm);
    color: var(--text-light);
    font-style: italic;
    margin-bottom: 1.5rem;
    opacity: 0.6;
  }

  /* --- Drop zone --- */
  .drop-zone {
    border: 2px dashed var(--border);
    border-radius: 8px;
    padding: 2.5rem 1rem;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
  }

  .drop-zone:hover,
  .drop-zone--active {
    border-color: var(--text-light);
    background: rgba(0, 0, 0, 0.015);
  }

  .drop-text {
    font-size: var(--fs-base);
    color: var(--text);
    margin-bottom: 0.3rem;
  }

  .drop-sub {
    font-size: var(--fs-sm);
    color: var(--text-light);
    opacity: 0.6;
  }

  .status {
    font-size: var(--fs-sm);
    color: var(--text-light);
    margin-top: 0.8rem;
    font-style: italic;
  }

  /* --- File list --- */
  .file-list {
    margin-top: 1.8rem;
  }

  .section-label {
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-light);
    opacity: 0.5;
    margin-bottom: 0.6rem;
  }

  .file-item {
    display: flex;
    align-items: center;
    padding: 0.45rem 0.6rem;
    border-radius: 4px;
    transition: background 0.1s;
  }

  .file-item--active {
    background: rgba(0, 0, 0, 0.03);
  }

  .file-name {
    flex: 1;
    text-align: left;
    background: none;
    border: none;
    font-size: var(--fs-sm);
    color: var(--text);
    cursor: pointer;
    padding: 0;
    font-family: inherit;
  }

  .file-name:hover {
    color: var(--text-light);
  }

  .file-sheets {
    font-size: 0.72rem;
    color: var(--text-light);
    opacity: 0.5;
    margin-left: 0.5em;
  }

  .file-remove {
    background: none;
    border: none;
    font-size: 1.1rem;
    color: var(--text-light);
    cursor: pointer;
    padding: 0 0.3rem;
    opacity: 0.4;
    line-height: 1;
  }

  .file-remove:hover {
    opacity: 1;
    color: #b55;
  }

  /* --- Preview --- */
  .preview {
    margin-top: 1.5rem;
  }

  .sheet-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--border);
    overflow-x: auto;
  }

  .sheet-tab {
    padding: 0.4rem 0.8rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-size: 0.78rem;
    color: var(--text-light);
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
    transition: color 0.15s, border-color 0.15s;
  }

  .sheet-tab:hover {
    color: var(--text);
  }

  .sheet-tab--active {
    color: var(--text);
    border-bottom-color: var(--text);
  }

  .table-wrap {
    overflow-x: auto;
    margin-top: 0.5rem;
    max-height: 400px;
    overflow-y: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.76rem;
    white-space: nowrap;
  }

  th, td {
    padding: 0.3rem 0.6rem;
    border: 1px solid rgba(0, 0, 0, 0.06);
    text-align: left;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  th {
    background: rgba(0, 0, 0, 0.025);
    font-weight: 500;
    position: sticky;
    top: 0;
  }

  .header-row th {
    color: var(--text);
  }

  td {
    color: var(--text-light);
  }

  .preview-note {
    font-size: 0.72rem;
    color: var(--text-light);
    opacity: 0.5;
    margin-top: 0.5rem;
    text-align: center;
    font-style: italic;
  }

  .preview-empty {
    font-size: var(--fs-sm);
    color: var(--text-light);
    opacity: 0.5;
    padding: 2rem 0;
    text-align: center;
  }

  /* --- Actions --- */
  .actions {
    margin-top: 1.5rem;
    display: flex;
    gap: 0.8rem;
  }

  /* --- Mobile --- */
  @media (max-width: 480px) {
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
