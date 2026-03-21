// ============================================
// Language State Store
// Manages current language, localStorage,
// subscriber notifications, and translation lookup
// ============================================

import { translations, type Lang } from './translations';
import { track } from '../utils/analytics';

let currentLang: Lang = 'en';
const listeners = new Set<(lang: Lang) => void>();

/** Get current language */
export function getLang(): Lang {
  return currentLang;
}

/** Set language, persist to localStorage, and notify all subscribers */
export function setLang(lang: Lang): void {
  currentLang = lang;
  if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
    localStorage.setItem('lang', lang);
  }
  // Notify Svelte subscribers
  listeners.forEach((fn) => fn(lang));
  // Notify Astro pages via custom DOM event
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('lang-change', { detail: lang }));
  }
}

/** Toggle between 'en' and 'zh' */
export function toggleLang(): void {
  const newLang = currentLang === 'en' ? 'zh' : 'en';
  setLang(newLang);
  track('language_toggle', { language: newLang });
}

/** Initialize language from localStorage (call once on mount) */
export function initLang(): void {
  if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
    const saved = localStorage.getItem('lang');
    if (saved === 'en' || saved === 'zh') {
      currentLang = saved;
    }
  }
}

/** Subscribe to language changes. Returns an unsubscribe function. */
export function subscribe(fn: (lang: Lang) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Convenience helper: initialise language from localStorage
 * and subscribe to future changes in one call.
 * Returns the unsubscribe function (pass it to $effect cleanup).
 */
export function onLangChange(callback: () => void): () => void {
  initLang();
  return subscribe(callback);
}

/** Translate a key using the current language */
export function t(key: string): string {
  return translations[key]?.[currentLang] ?? key;
}
