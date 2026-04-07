// --- Types ---
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  department: string;
  url: string;
  posted_date: string;
  first_seen_at?: string;
  // Pre-computed (set by enrichJobs)
  _companyLower?: string;
  _titleLower?: string;
  _locationLower?: string;
}

export interface JobData {
  updated_at: string;
  previous_updated_at?: string;
  new_job_ids?: string[];
  jobs: Job[];
}

// --- Constants ---
export const JOBS_DATA_URL = '/data/jobs.json';

// --- Helpers ---
export function loadPref<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v != null ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

/** Pre-compute lowercase fields for fast filtering. */
export function enrichJobs(jobs: Job[]): void {
  for (const j of jobs) {
    j._companyLower = j.company.toLowerCase();
    j._titleLower = j.title.toLowerCase();
    j._locationLower = j.location.toLowerCase();
  }
}

/** Build company count map and sorted list. */
export function buildCompanyIndex(jobs: Job[]): { sorted: string[]; counts: Map<string, number> } {
  const counts = new Map<string, number>();
  for (const j of jobs) {
    const c = j.company;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const sorted = [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)!);
  return { sorted, counts };
}

/** Build location count map and sorted list. */
export function buildLocationIndex(jobs: Job[]): { sorted: string[]; counts: Map<string, number> } {
  const counts = new Map<string, number>();
  for (const j of jobs) {
    const loc = j.location;
    if (loc) counts.set(loc, (counts.get(loc) ?? 0) + 1);
  }
  const sorted = [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)!);
  return { sorted, counts };
}

/** Format ISO date to readable string. */
export function formatDate(isoStr: string): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return isoStr; }
}

export function formatUpdatedAt(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch { return isoStr; }
}
