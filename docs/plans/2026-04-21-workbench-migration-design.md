# Workbench Migration Design

**Date:** 2026-04-21
**Topic:** Migrate "笑笑的摸鱼工作台" (removed 2026-03-21 in commit `747fb7a`) back into the site under `/console/workbench`, with tech stack simplification.

## Context

On 2026-03-21, the ExcelTool page (`/tools/excel`, titled "笑笑的摸鱼工作台") was removed from the site because the functionality was extracted to a standalone Tauri desktop app. The user has decided to bring it back as a web page, this time nested under the `/console/` area (which is gated by Cloudflare Access, not in-app auth).

The old implementation was a single 1214-line `ExcelTool.svelte` file with three "tasks" (`supernova`, `neutron`, `redgiant`), password-gated via a hardcoded SHA-256 hash, and used both `exceljs` and `xlsx` (SheetJS) libraries. Only the `supernova` task was fully implemented; the other two were UI placeholders.

## Decisions

1. **Scope**: migrate all three tasks, keep `neutron` and `redgiant` as placeholders (user wants room for future tools).
2. **Auth**: no in-app auth. Cloudflare Access already gates `/console/*`, and the user confirmed content behind it is not secret to whoever got through.
3. **URL**: `/console/workbench`. Title stays "笑笑的摸鱼工作台".
4. **Tech stack**: drop `xlsx` from production dependencies. Only `exceljs` in the shipped bundle. `xlsx` is used in the test harness only (briefly, then removed).
5. **Execution strategy**: one PR, restore-and-simplify combined. Functional correctness verified by a dual-reader comparison harness (see Testing).

## Architecture

```
src/
├── pages/
│   └── console/
│       ├── index.astro          [modify] add third card → /console/workbench
│       └── workbench.astro      [new]    thin Astro shell with BaseLayout
├── components/
│   └── console/
│       └── Workbench.svelte     [new]    main Svelte 5 component
└── utils/
    └── workbench/
        ├── parse.ts             [new]    Excel read via exceljs
        ├── aggregate.ts         [new]    pure aggregation functions
        └── write.ts             [new]    formatted Excel write via exceljs
package.json                     [modify] remove xlsx from dependencies
```

Key structural changes from the old version:
- Logic split out of the monolithic Svelte file into `utils/workbench/` pure modules (easier to test with the comparison harness).
- Password gate, `PASSWORD_HASH` constant, and `sessionStorage` auth removed (Cloudflare Access is the new gate).
- Component directory is `components/console/` instead of the old `components/tools/`.

## Components

`Workbench.svelte` internal shape:

**State (Svelte 5 runes)**
- `lang: Lang`
- `selectedTask: TaskId` ∈ `'supernova' | 'neutron' | 'redgiant'`
- `uploadedFiles: UploadedFile[]`
- `processing: boolean`
- `errorMessage: string`

**Template**
- `TaskSelector` — left-side radio group, 3 tasks
- `DropZone` — drag/click file input
- `FileList` — uploaded file display with role tags
- `ActionButton` — "开始处理"
- `ErrorBanner` — top error strip (red bg, white text, reused styling)

**Handlers**
- `handleFileDrop` / `handleFilePicker` — classify file role by filename heuristic
- `handleProcess()` — dispatch to the selected task's runner
- `runSupernova()` — calls `parse` → `aggregate` → `write`
- `runNeutron()` / `runRedgiant()` — placeholder: show "该任务暂未实现" banner

**i18n**
- Tool content stays in Chinese (company names, task names are Chinese domain terms).
- Only BaseLayout `title` / `description` may go through the `data-i18n` system if bilingual metadata is desired; default is to keep them Chinese to match the old page.

## Data Flow (supernova)

```
1. File upload
   Drop or select .xlsx files.
   Filename heuristic classifies role:
     • contains "保险登记" → output
     • contains "人保" → renBao raw
     • contains "优米" or "安淇瑞" → youmi raw

2. Validation (handleProcess)
   Must have exactly 1 output and >= 1 raw.
   Otherwise: set errorMessage, abort.

3. Parse (parse.ts)
   For each raw file: exceljs reads sheet, extracts company/amount/date.
   All records in a file must share the same year-month, else throw WorkbenchError.
   Returns: RawFileData[]

4. Aggregate (aggregate.ts)
   Group by company, then by insurance type (one column per type).
   Compute per-column totals and grandTotal.
   Returns: AggregatedResult

5. Write (write.ts)
   exceljs opens the output workbook.
   Find or insert the month block for {year, month}.
   Write headers, rows, totals.
   Apply formatting: borders, fills, number precision.
   Blocks sorted newest-first.

6. Download
   URL.createObjectURL(blob), trigger click, revoke URL.
```

The ONLY library change is in step 3 (parse). Steps 5 (write) and the output-file read path copy the old exceljs code verbatim. This scopes the risk to exactly one surface.

**exceljs read quirk to handle in `parse.ts`**: depending on how the cell was typed, date values may arrive as `Date`, ISO string, or number (Excel serial). Add a `coerceToMonthYear(value)` utility that handles all three and throws if none match.

## Error Handling

Unified `errorMessage: string` state + top banner, replacing the old mix of `alert()` and `console.error`.

| Situation | Trigger | Message (zh) | Recovery |
|---|---|---|---|
| Unclassifiable filename | drop | "无法识别文件：{name}。请检查文件名是否包含'保险登记'、'人保'、'优米'或'安淇瑞'" | rename |
| Missing output | process | "请至少上传一个输出文件（文件名包含'保险登记'）" | upload |
| Missing raw | process | "请至少上传一个原始数据文件" | upload |
| Multiple outputs | process | "只能上传一个输出文件，当前检测到 {n} 个" | remove extras |
| Cross-month raw | parse | "文件 {name} 包含多个月份的数据，请拆分后重试" | split |
| Parse failure | parse | "无法读取文件 {name}：{detail}" | inspect file |
| Write failure | write | "生成输出文件时出错：{detail}" | bug report |
| Unimplemented task | process | "{task} 暂未实现" | switch task |

Conventions:
- `parse.ts` / `aggregate.ts` / `write.ts` throw a `WorkbenchError` subclass with a Chinese message.
- `handleProcess()` wraps in `try/catch`, sets `errorMessage = err.message`.
- Unknown errors: `console.error(err)` for stack, show raw message to user.
- No `alert()` anywhere.

Scenarios intentionally NOT handled (let exceljs error bubble up through "parse failure"):
- Corrupted cells
- Formula references
- Unusual merged-cell structures

Non-.xlsx uploads: file picker accept attribute filters at the browser level; no secondary validation.

## Testing & Verification

Because there is no existing test framework in the repo, testing is done via a one-off Node script (`scripts/test-workbench.mjs`) that runs pre-PR and is **removed before merge**. No vitest/jest added.

### Two test data sets

**Set A — Functional correctness** (6 scenarios, small, deterministic):

1. Normal path: output + 1 youmi + 1 renBao → new month block added, old blocks preserved.
2. Same-month multi-file: 优米 + 人保 both 2026-02 → merged into one block with two columns.
3. Filename alias: "安淇瑞-..." classified as youmi.
4. Replace existing month: output already has 2026-02, re-process 2026-02 raw → block replaced not duplicated.
5. Month ordering: insert 2025-12 after 2026-* → sorted correctly (newest first).
6. Error paths: raw without output, cross-month raw, multiple outputs → each reports the expected error.

**Set B — Realistic stress** (~4 larger files, mimics real financial Excel shapes):

- 20–30 companies per file
- Company names with punctuation: `·`, `（）`, `，`
- Mixed date formats in one column: Excel serial number, text string, real Excel date format
- Amount precision edges: `0.01`, `99999999.99`, `0.0001`
- Merged cells in header rows (common in Chinese financial templates)
- Scattered empty rows between data
- Leading/trailing whitespace in company names
- Occasional non-numeric cell in a numeric column (e.g. string "0", empty)

### Dual-reader comparison harness

This is the core rigor of the testing plan. `test-workbench.mjs` imports:
- `parseRawFileXlsx(buffer)` — reference implementation using `xlsx` library (kept ONLY in the test script, never in shipped code)
- `parseRawFileExceljs(buffer)` — production implementation from `src/utils/workbench/parse.ts`

For every file in Set A and Set B:
1. Run both parsers
2. Deep-equal compare the resulting `RawFileData` structures
3. Any difference → print field-level diff, fail the test
4. Also: run the full `parse → aggregate → write` pipeline with each reader, then use exceljs to re-read both output files and compare cell-by-cell (values AND styles: borders, fills, font, number format)

`xlsx` is added to `devDependencies` ONLY for the duration of testing, or invoked via `npx xlsx` if possible. It is NOT shipped in the production bundle and is removed from `package.json` before merge.

### Completion criteria

- [ ] All 6 Set A scenarios pass
- [ ] All Set B files parse with 0 deep-equal diffs between xlsx and exceljs readers
- [ ] Output file cell-by-cell comparison shows 0 value/style diffs
- [ ] Browser manual check: visit `/console/workbench`, process Set A files, download output, open in Excel/LibreOffice, visually confirm borders, fills, number formatting match expectations
- [ ] `astro check` and `tsc --noEmit` both pass
- [ ] `/console/index.astro` card renders and links correctly
- [ ] `package.json` final state: no `xlsx`, `exceljs` retained
- [ ] `scripts/test-workbench.mjs` deleted before merge

### Not in scope

- No CI integration of the test script
- No testing of `neutron` / `redgiant` (they remain placeholders)
- No security/permission checks beyond Cloudflare Access

## Rollback

If migration fails verification and cannot be fixed in-session:
- Delete the new files (`workbench.astro`, `Workbench.svelte`, `utils/workbench/*`)
- Revert `console/index.astro` card addition
- Revert `package.json` change
- Keep the design doc in `docs/plans/` as reference for the next attempt

No database migrations, no external service changes — rollback is purely git-level.
