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
