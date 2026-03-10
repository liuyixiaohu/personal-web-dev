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
    const t = tz || TZ;
    const loc = locale(lang);
    const s = new Date(startIso);
    const e = new Date(endIso);
    const sDate = s.toLocaleDateString(loc, { weekday: 'short', month: 'short', day: 'numeric', timeZone: t });
    const eDate = e.toLocaleDateString(loc, { weekday: 'short', month: 'short', day: 'numeric', timeZone: t });
    const sTime = s.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit', timeZone: t });
    const eTime = e.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit', timeZone: t });
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
  const d = new Date(event.start_at);
  const local = new Date(d.toLocaleString('en-US', { timeZone: TZ }));
  return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
}

export function priceCount(events: LumaEvent[], opt: string): number {
  return events.filter(e => {
    if (opt === 'free-approval') return e.is_free || e.price_cents == null;
    if (opt === 'paid') return !e.is_free && e.price_cents != null;
    return true;
  }).length;
}

export function locationCount(events: LumaEvent[], loc: string): number {
  return events.filter(e => stripState(e.location) === loc).length;
}
