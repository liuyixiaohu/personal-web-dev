// Sniff uploaded file formats before handing off to ExcelJS. XLSX is ZIP,
// XLS is OLE binary, and many Chinese enterprise "exports" are HTML served
// with an .xlsx extension. Detecting at upload time lets us show a per-file
// warning instead of a JSZip error from deep in the parse step.

import type { FileFormat } from './types.ts';

export function sniffFileFormat(buffer: ArrayBuffer): FileFormat {
  if (buffer.byteLength < 4) return 'unknown';
  const bytes = new Uint8Array(buffer, 0, Math.min(8, buffer.byteLength));
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  // 50 4B 03 04 = ZIP local file header (xlsx); D0 CF 11 E0 A1 B1 1A E1 = OLE (xls)
  if (hex.startsWith('504b0304')) return 'xlsx';
  if (hex.startsWith('d0cf11e0a1b11ae1')) return 'xls';
  const offset = hex.startsWith('efbbbf') ? 3 : 0;
  const text = new TextDecoder().decode(bytes.subarray(offset));
  if (text.trimStart().startsWith('<')) return 'html';
  return 'unknown';
}

export function isFormatSupported(format: FileFormat): boolean {
  return format === 'xlsx' || format === 'xls';
}

export function formatHint(format: FileFormat): string {
  switch (format) {
    case 'xlsx':
    case 'xls':
      return '';
    case 'html':
      return 'HTML 伪装的 .xlsx，请用 Excel 或 WPS 打开后另存为真正的 .xlsx';
    case 'unknown':
      return '无法识别为 Excel 文件，可能已损坏';
  }
}
