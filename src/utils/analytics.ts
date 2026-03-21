/**
 * Centralized analytics tracking.
 * All event tracking goes through this module so the GTM implementation
 * lives in one place and can be swapped without touching components.
 */
export function track(event: string, data?: Record<string, unknown>): void {
  (window as any).dataLayer?.push({ event, ...data });
}
