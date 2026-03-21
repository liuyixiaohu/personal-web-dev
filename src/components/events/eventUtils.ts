import type { Lang } from '../../i18n/translations';
import { t } from '../../i18n/langStore';

// --- Types ---
export interface LumaEvent {
  api_id: string;
  name: string;
  url: string;
  start_at: string;
  end_at: string;
  timezone: string;
  location: string;
  location_type: string;
  calendar_name: string;
  host_names: string[];
  guest_count: number;
  is_free: boolean;
  price_cents: number | null;
  price_currency: string | null;
  categories: string[];
  first_seen_at?: string;
  source?: string;
  // Pre-computed (set by enrichEvents)
  _startMs?: number;
  _dayOfWeek?: number;    // 0=Sun..6=Sat, in LA timezone
  _timeMinutes?: number;  // minutes since midnight, in LA timezone
  _dateKey?: string;       // YYYY-MM-DD in LA timezone
  _strippedLocation?: string;
}

export interface EventData {
  updated_at: string;
  previous_updated_at?: string;
  new_event_ids?: string[];
  events: LumaEvent[];
}

// --- Constants ---
export const DATA_URL = '/data/events.json';
export const STALE_THRESHOLD_MS = 48 * 60 * 60 * 1000; // 48 hours
export const TZ = 'America/Los_Angeles';
export const BLOCKED_CALENDARS = new Set(['社交感染聚会']);

// --- Helpers ---
export function locale(lang: Lang): string {
  return lang === 'zh' ? 'zh-CN' : 'en-US';
}

export function loadPref<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v != null ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

export function stripState(loc: string): string {
  return loc.replace(/, California$/, '');
}

// --- Formatting ---
export function formatEventRange(startIso: string, endIso: string, tz: string, lang: Lang): string {
  try {
    const effectiveTz = tz || TZ;
    const loc = locale(lang);
    const s = new Date(startIso);
    const e = new Date(endIso);
    const sDate = s.toLocaleDateString(loc, { weekday: 'short', month: 'short', day: 'numeric', timeZone: effectiveTz });
    const eDate = e.toLocaleDateString(loc, { weekday: 'short', month: 'short', day: 'numeric', timeZone: effectiveTz });
    const sTime = s.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit', timeZone: effectiveTz });
    const eTime = e.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit', timeZone: effectiveTz });
    if (sDate === eDate) return `${sDate}, ${sTime} – ${eTime}`;
    return `${sDate}, ${sTime} – ${eDate}, ${eTime}`;
  } catch { return startIso; }
}

export function formatUpdatedAt(isoStr: string, lang: Lang): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString(locale(lang), { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch { return isoStr; }
}

export function formatPrice(event: LumaEvent): string {
  if (event.is_free) return t('events.free');
  if (event.price_cents != null) {
    const dollars = event.price_cents / 100;
    const currency = (event.price_currency || 'usd').toUpperCase();
    if (currency === 'USD') return `$${dollars.toFixed(0)}`;
    return `${dollars.toFixed(0)} ${currency}`;
  }
  if (event.source === 'eventbrite') return t('events.seeEventbrite');
  return t('events.approval');
}

export function locationDisplay(event: LumaEvent): string {
  if (event.location_type === 'online') return t('events.online');
  return stripState(event.location || '');
}

export function formatDateGroup(dateKey: string, lang: Lang): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(locale(lang), { weekday: 'long', month: 'short', day: 'numeric' });
}

// --- Filtering ---
export function matchesPrice(event: LumaEvent, selectedPrice: string | null): boolean {
  if (selectedPrice === null) return true;
  if (selectedPrice === 'free-approval') return event.is_free || event.price_cents == null;
  if (selectedPrice === 'paid') return !event.is_free && event.price_cents != null;
  return true;
}

export function eventDateKey(event: LumaEvent): string {
  return event._dateKey!;
}

/** Pre-compute derived values once per event to avoid repeated Date parsing. */
export function enrichEvents(events: LumaEvent[]): void {
  for (const e of events) {
    const d = new Date(e.start_at);
    e._startMs = d.getTime();
    const local = new Date(d.toLocaleString('en-US', { timeZone: TZ }));
    e._dayOfWeek = local.getDay();
    e._timeMinutes = local.getHours() * 60 + local.getMinutes();
    e._dateKey = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
    e._strippedLocation = stripState(e.location || '');
  }
}

/** Build location count map and sorted location list in a single pass. */
export function buildLocationIndex(events: LumaEvent[]): { sorted: string[]; counts: Map<string, number> } {
  const counts = new Map<string, number>();
  for (const e of events) {
    const loc = e._strippedLocation!;
    if (loc) counts.set(loc, (counts.get(loc) ?? 0) + 1);
  }
  const sorted = [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)!);
  return { sorted, counts };
}

/** Build price count map in a single pass. */
export function buildPriceCounts(events: LumaEvent[]): Map<string, number> {
  let freeApproval = 0;
  let paid = 0;
  for (const e of events) {
    if (e.is_free || e.price_cents == null) freeApproval++;
    if (!e.is_free && e.price_cents != null) paid++;
  }
  return new Map([['free-approval', freeApproval], ['paid', paid]]);
}
