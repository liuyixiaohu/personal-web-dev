import type { SyncSettings } from './syncUtils';

/** Send only fields used to display a handled event after it leaves the daily feed. */
export function compactSettings(settings: SyncSettings) {
  const decisions: Record<string, unknown> = {};
  for (const [id, decision] of Object.entries(settings.decisions)) {
    const event = decision.event;
    decisions[id] = {
      status: decision.status,
      at: decision.at,
      event: {
        api_id: event.api_id,
        name: event.name,
        url: event.url,
        start_at: event.start_at,
        end_at: event.end_at,
        timezone: event.timezone,
        location: event.location,
        location_type: event.location_type,
        calendar_name: event.calendar_name,
        host_names: event.host_names,
        guest_count: event.guest_count,
        is_free: event.is_free,
        price_cents: event.price_cents,
        price_currency: event.price_currency,
        first_seen_at: event.first_seen_at,
      },
    };
  }
  return { ...settings, decisions };
}
