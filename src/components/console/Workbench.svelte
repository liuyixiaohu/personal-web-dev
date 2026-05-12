<script lang="ts">
  import { subscribeLang, getLang } from '../../i18n/langStore';
  import type { Lang } from '../../i18n/translations';
  import { TASKS, type TaskId, type UploadedFile, WorkbenchError } from '../../utils/workbench/types.ts';
  import { parseRawFile } from '../../utils/workbench/parse.ts';
  import { aggregate } from '../../utils/workbench/aggregate.ts';
  import { updateOutputWorkbook } from '../../utils/workbench/write.ts';
  import { sniffFileFormat, formatHint, isFormatSupported } from '../../utils/workbench/sniff.ts';
  import { track } from '../../utils/analytics';

  let lang: Lang = $state('en');
  $effect(() => subscribeLang(() => { lang = getLang(); }));

  let selectedTask: TaskId = $state('supernova');
  let uploadedFiles: UploadedFile[] = $state([]);
  let processing = $state(false);
  let errorMessage = $state('');

  let badFiles = $derived(uploadedFiles.filter((f) => !isFormatSupported(f.format)));
  let parseErrors = $derived(uploadedFiles.filter((f) => f.parseError));
  let stillParsing = $derived(uploadedFiles.some((f) => f.parsing));
  let detectedPeriods = $derived.by(() => {
    const set = new Set<string>();
    for (const f of uploadedFiles) {
      if (!f.parseResult) continue;
      for (const r of f.parseResult.records) {
        if (r.year && r.month) set.add(`${r.year}-${r.month}`);
      }
    }
    return [...set].sort();
  });
  let canProcess = $derived(
    uploadedFiles.length > 0 &&
      badFiles.length === 0 &&
      parseErrors.length === 0 &&
      !stillParsing &&
      detectedPeriods.length === 1 &&
      TASKS.find((t) => t.id === selectedTask)?.implemented === true,
  );

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
    const rejected: string[] = [];
    for (const f of arr) {
      const cls = classifyFile(f.name);
      if (!cls) {
        rejected.push(f.name);
        continue;
      }
      const buf = await f.arrayBuffer();
      const format = sniffFileFormat(buf);
      const willParse = cls.role !== 'output' && isFormatSupported(format);
      added.push({
        name: f.name,
        role: cls.role,
        roleLabel: cls.label,
        buffer: buf,
        format,
        parsing: willParse,
      });
    }
    uploadedFiles = [...uploadedFiles, ...added];
    if (rejected.length > 0) {
      errorMessage = `无法识别文件：${rejected.join('、')}。请检查文件名是否包含'保险登记'、'人保'、'优米'或'安淇瑞'`;
    }
    for (const file of added) {
      if (file.parsing) void parseFile(file);
    }
  }

  async function parseFile(target: UploadedFile) {
    try {
      const result = await parseRawFile(target.buffer, target.name);
      uploadedFiles = uploadedFiles.map((f) =>
        f.buffer === target.buffer ? { ...f, parsing: false, parseResult: result } : f,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      uploadedFiles = uploadedFiles.map((f) =>
        f.buffer === target.buffer ? { ...f, parsing: false, parseError: msg } : f,
      );
    }
  }

  function removeFile(idx: number) {
    uploadedFiles = uploadedFiles.filter((_, i) => i !== idx);
    errorMessage = '';
  }

  function fileSummary(file: UploadedFile): string {
    if (!file.parseResult) return '';
    const recs = file.parseResult.records;
    const total = recs.reduce((s, r) => s + r.amount, 0);
    const months = [...new Set(recs.map((r) => r.month).filter(Boolean))].sort((a, b) => a - b);
    const monthLabel = months.length > 0 ? `${months.join('、')} 月 · ` : '';
    return `${monthLabel}${recs.length} 条 · ¥${total.toFixed(2)}`;
  }

  async function handleProcess() {
    errorMessage = '';
    const outputs = uploadedFiles.filter((f) => f.role === 'output');
    const raws = uploadedFiles.filter((f) => f.role !== 'output');

    const task = TASKS.find((t) => t.id === selectedTask);
    if (!task?.implemented) {
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
    if (badFiles.length > 0) {
      errorMessage = `有 ${badFiles.length} 个文件不是有效的 Excel 文件，请先移除或替换`;
      return;
    }
    if (parseErrors.length > 0) {
      errorMessage = `有 ${parseErrors.length} 个文件解析失败，请检查后重新上传`;
      return;
    }
    if (stillParsing) {
      errorMessage = '还有文件正在解析，请稍候';
      return;
    }
    if (detectedPeriods.length > 1) {
      errorMessage = '检测到多个月份，一次只能处理一个月份的数据';
      return;
    }

    processing = true;
    try {
      track('workbench_run', { task: selectedTask, raw_count: raws.length });
      const rawDatas = raws.map((r) => r.parseResult!);
      const result = aggregate(rawDatas);
      const blob = await updateOutputWorkbook(outputs[0].buffer, result);

      // Trigger download. Timestamp uses local YYYY-MM-DD-HHmm so successive
      // runs produce distinct, sortable filenames without the 13-digit epoch.
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = outputs[0].name.replace(/\.xlsx$/, `-${stamp}.xlsx`);
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
      <label class="task-option" class:disabled={!task.implemented}>
        <input
          type="radio"
          bind:group={selectedTask}
          value={task.id}
          disabled={!task.implemented}
        />
        <span>{task.label}</span>
        {#if !task.implemented}
          <span class="task-tag">敬请期待</span>
        {/if}
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
      <p class="drop-hint">文件名需包含：保险登记、人保、优米 或 安淇瑞</p>
    </div>

    {#if uploadedFiles.length > 0}
      <ul class="file-list">
        {#each uploadedFiles as file, i}
          <li class:bad={!isFormatSupported(file.format) || !!file.parseError}>
            <span class="role-tag">{file.roleLabel}</span>
            <span class="file-name">{file.name}</span>
            {#if !isFormatSupported(file.format)}
              <span class="file-status status-error">{formatHint(file.format)}</span>
            {:else if file.parseError}
              <span class="file-status status-error">解析失败：{file.parseError}</span>
            {:else if file.parsing}
              <span class="file-status status-muted">解析中…</span>
            {:else if file.parseResult}
              <span class="file-status status-info">{fileSummary(file)}</span>
            {/if}
            <button type="button" onclick={() => removeFile(i)}>移除</button>
          </li>
        {/each}
      </ul>
    {/if}

    {#if detectedPeriods.length === 1}
      {@const [y, m] = detectedPeriods[0].split('-').map(Number)}
      <div class="month-banner info">本次处理：{y} 年 {m} 月</div>
    {:else if detectedPeriods.length > 1}
      <div class="month-banner warn">
        检测到多个月份：{detectedPeriods
          .map((p) => {
            const [yy, mm] = p.split('-');
            return `${yy} 年 ${mm} 月`;
          })
          .join('、')}，一次只能处理一个月
      </div>
    {/if}

    {#if errorMessage}
      <div class="error-banner">{errorMessage}</div>
    {/if}

    <button
      type="button"
      class="process-btn"
      disabled={processing || !canProcess}
      onclick={handleProcess}
    >
      {processing ? '处理中…' : '开始处理'}
    </button>
  </section>
</div>

<style>
  /* --- Workbench (task selector + workspace side-by-side) --- */
  .workbench {
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

  .task-selector h2 {
    font-size: var(--fs-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-light);
    margin: 0 0 0.2rem;
    font-weight: 500;
  }

  .task-option {
    display: flex;
    align-items: center;
    gap: 0.5em;
    padding: 0.45rem 0.7rem;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background 0.15s;
    font-size: var(--fs-xs);
    color: var(--text-light);
  }

  .task-option:hover {
    background: rgba(0, 0, 0, 0.025);
  }

  .task-option input[type="radio"] {
    appearance: none;
    width: 0.55rem;
    height: 0.55rem;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-full);
    flex-shrink: 0;
    transition: border-color 0.15s, background 0.15s;
    margin: 0;
  }

  .task-option input[type="radio"]:checked {
    border-color: var(--text);
    background: var(--text);
  }

  .task-option:has(input[type="radio"]:checked) {
    color: var(--text);
    background: rgba(0, 0, 0, 0.04);
  }

  .task-option.disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .task-option.disabled:hover {
    background: transparent;
  }

  .task-tag {
    font-size: 0.65rem;
    color: var(--text-light);
    background: rgba(0, 0, 0, 0.04);
    padding: 0.05rem 0.35rem;
    border-radius: var(--radius-sm);
    margin-left: auto;
  }

  /* --- Workspace (drop zone + file list + actions stacked) --- */
  .workspace {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  /* --- Drop zone --- */
  .drop-zone {
    flex: 0 0 auto;
    border: 2px dashed var(--border);
    border-radius: var(--radius-lg);
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
  .drop-zone.active {
    border-color: var(--text-light);
    background: rgba(0, 0, 0, 0.015);
  }

  .drop-zone p {
    font-size: var(--fs-base);
    color: var(--text);
    margin: 0;
  }

  .drop-zone .drop-hint {
    font-size: var(--fs-xs);
    color: var(--text-light);
    margin-top: 0.6rem;
  }

  /* --- File list --- */
  .file-list {
    list-style: none;
    padding: 0;
    margin-top: 1.8rem;
  }

  .file-list li {
    display: flex;
    align-items: center;
    padding: 0.45rem 0.6rem;
    border-radius: var(--radius-sm);
    transition: background 0.15s;
  }

  .file-list li.bad .file-name {
    color: var(--text-light);
    text-decoration: line-through;
  }

  .file-status {
    font-size: var(--fs-xs);
    margin-right: 0.6em;
    white-space: nowrap;
  }

  .file-status.status-info {
    color: var(--text-light);
  }

  .file-status.status-muted {
    color: var(--text-light);
    font-style: italic;
  }

  .file-status.status-error {
    color: var(--color-pm);
  }

  .month-banner {
    font-size: var(--fs-xs);
    margin-top: 1rem;
    padding: 0.4rem 0.6rem;
    border-radius: var(--radius-sm);
  }

  .month-banner.info {
    color: var(--text);
    background: rgba(0, 0, 0, 0.035);
  }

  .month-banner.warn {
    color: var(--color-pm);
    background: rgba(0, 0, 0, 0.025);
  }

  .file-name {
    flex: 1;
    text-align: left;
    font-size: var(--fs-xs);
    color: var(--text);
  }

  .role-tag {
    display: inline-block;
    font-size: var(--fs-xs);
    color: var(--text-light);
    background: rgba(0, 0, 0, 0.04);
    padding: 0.1rem 0.4rem;
    border-radius: var(--radius-sm);
    margin-right: 0.5em;
    vertical-align: middle;
  }

  .file-list button {
    background: none;
    border: none;
    font-size: var(--fs-xs);
    font-family: inherit;
    color: var(--text-light);
    cursor: pointer;
    padding: 0 0.3rem;
    line-height: 1;
    transition: color 0.15s;
  }

  .file-list button:hover {
    color: var(--color-pm);
  }

  /* --- Error banner --- */
  .error-banner {
    font-size: var(--fs-xs);
    color: var(--color-pm);
    margin-top: 0.8rem;
  }

  /* --- Process button --- */
  .process-btn {
    margin-top: 1.5rem;
    align-self: flex-start;
    padding: 0.5rem 1rem;
    border: 1px solid var(--text);
    border-radius: var(--radius-sm);
    background: var(--text);
    color: var(--bg);
    font-size: var(--fs-xs);
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .process-btn:hover {
    opacity: 0.85;
  }

  .process-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  /* --- Mobile --- */
  @media (max-width: 480px) {
    .workbench {
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
  }
</style>
