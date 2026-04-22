<script lang="ts">
  import { subscribeLang, getLang } from '../../i18n/langStore';
  import type { Lang } from '../../i18n/translations';
  import { TASKS, type TaskId, type UploadedFile, WorkbenchError } from '../../utils/workbench/types.ts';
  import { parseRawFile } from '../../utils/workbench/parse.ts';
  import { aggregate } from '../../utils/workbench/aggregate.ts';
  import { updateOutputWorkbook } from '../../utils/workbench/write.ts';
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
    const rejected: string[] = [];
    for (const f of arr) {
      const cls = classifyFile(f.name);
      if (!cls) {
        rejected.push(f.name);
        continue;
      }
      const buf = await f.arrayBuffer();
      added.push({ name: f.name, role: cls.role, roleLabel: cls.label, buffer: buf });
    }
    uploadedFiles = [...uploadedFiles, ...added];
    if (rejected.length > 0) {
      errorMessage = `无法识别文件：${rejected.join('、')}。请检查文件名是否包含'保险登记'、'人保'、'优米'或'安淇瑞'`;
    }
  }

  function removeFile(idx: number) {
    uploadedFiles = uploadedFiles.filter((_, i) => i !== idx);
    errorMessage = '';
  }

  async function handleProcess() {
    errorMessage = '';
    const outputs = uploadedFiles.filter((f) => f.role === 'output');
    const raws = uploadedFiles.filter((f) => f.role !== 'output');

    if (selectedTask !== 'supernova') {
      const task = TASKS.find((t) => t.id === selectedTask);
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
      track('workbench_run', { task: selectedTask, raw_count: raws.length });
      const rawDatas = [];
      for (const r of raws) {
        rawDatas.push(await parseRawFile(r.buffer, r.name));
      }
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
  /* CSS copied in Task 12 */
  .workbench { display: flex; gap: 2rem; }
  .task-selector { min-width: 12rem; }
  .workspace { flex: 1; }
  .drop-zone { border: 2px dashed #ccc; padding: 2rem; text-align: center; }
  .drop-zone.active { border-color: #333; background: #f5f5f5; }
  .file-list { list-style: none; padding: 0; }
  .error-banner { background: #c33; color: white; padding: 0.5rem 1rem; margin: 1rem 0; }
  .process-btn { padding: 0.5rem 1.5rem; }
</style>
