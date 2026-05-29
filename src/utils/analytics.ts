/**
 * Centralized analytics tracking.
 * All event tracking goes through this module so the GTM implementation
 * lives in one place and can be swapped without touching components.
 */

const isLocal =
  typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

export function track(event: string, data?: Record<string, unknown>): void {
  if (isLocal) return;
  (window as any).dataLayer?.push({ event, ...data });
}
