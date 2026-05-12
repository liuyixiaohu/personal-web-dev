export type InsuranceType = 'youmi' | 'renBao';
export type FileRole = 'output' | InsuranceType;
export type TaskId = 'supernova' | 'neutron' | 'redgiant';
export type FileFormat = 'xlsx' | 'xls' | 'html' | 'unknown';

export interface UploadedFile {
  name: string;
  role: FileRole;
  roleLabel: string;
  buffer: ArrayBuffer;
  format: FileFormat;
}

export interface RawRecord {
  company: string;
  amount: number;
  month: number;
  year: number;
}

export interface RawFileData {
  name: string;
  insuranceType: InsuranceType;
  records: RawRecord[];
}

export interface AggregatedRow {
  company: string;
  amounts: Record<string, number>;
}

export interface AggregatedResult {
  year: number;
  month: number;
  insuranceColumns: string[];
  rows: AggregatedRow[];
  totals: Record<string, number>;
  grandTotal: number;
}

export interface MonthBlock {
  month: number;
  headers: string[];
  rows: { company: string; amounts: Record<string, number> }[];
  totals: Record<string, number>;
  grandTotal: number;
}

export interface Task {
  id: TaskId;
  label: string;
}

export class WorkbenchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkbenchError';
  }
}

export const TASKS: Task[] = [
  { id: 'supernova', label: '超新星小吕' },
  { id: 'neutron', label: '中子星小吕' },
  { id: 'redgiant', label: '红巨星小吕' },
];

export const INSURANCE_LABELS: Record<InsuranceType, string> = {
  youmi: '优米',
  renBao: '人保',
};
