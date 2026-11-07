import { type EventDecision, pruneDecisions } from './eventUtils';

// Sync is optional. Nothing here runs until the viewer creates or joins a code.
export const SYNC_CODE_KEY = 'events.syncCode';
export const SYNC_TIME_KEY = 'events.syncedAt';

export interface SyncSettings {
  excludeKeywords: string[];
  selectedLocations: string[];
  selectedDays: number[];
  newOnly: boolean;
  decisions: Record<string, EventDecision>;
}

/** Returns the canonical xxxx-xxxx-xxxx-xxxx form, or null if the input is not a code. */
export function formatCode(input: string): string | null {
  const raw = input.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (raw.length !== 16 || /[01ilo]/.test(raw)) return null;
  return raw.match(/.{4}/g)!.join('-');
}

export class SyncError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function call<T>(action: string, body: Record<string, unknown>): Promise<T> {
  const resp = await fetch(`/api/sync/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new SyncError(resp.status, (data as { error?: string }).error ?? `HTTP ${resp.status}`);
  }
  return data as T;
}

export function createSync(settings: SyncSettings) {
  return call<{ code: string; updated_at: string }>('create', { settings });
}

export function pullSync(code: string) {
  return call<{ settings: SyncSettings; updated_at: string }>('pull', { code });
}

export function pushSync(code: string, settings: SyncSettings) {
  return call<{ updated_at: string }>('push', { code, settings });
}

export function rotateSync(code: string) {
  return call<{ code: string; updated_at: string }>('rotate', { code });
}

/**
 * A stable JSON form. Decision keys are sorted, so two equal settings always
 * produce the same string. The sync logic relies on that to avoid push loops.
 */
export function canonicalJSON(settings: SyncSettings): string {
  const decisions: Record<string, EventDecision> = {};
  for (const id of Object.keys(settings.decisions).sort()) {
    decisions[id] = settings.decisions[id];
  }
  return JSON.stringify({
    excludeKeywords: settings.excludeKeywords,
    selectedLocations: settings.selectedLocations,
    selectedDays: settings.selectedDays,
    newOnly: settings.newOnly,
    decisions,
  });
}

/**
 * Joining a code on a device that already has its own choices. Keywords and
 * handled events from both sides are kept. For each event the later decision
 * wins. Filter values come from the code, since they are the shared state.
 */
export function mergeOnJoin(local: SyncSettings, remote: SyncSettings): SyncSettings {
  const excludeKeywords = [...new Set([...remote.excludeKeywords, ...local.excludeKeywords])];

  const decisions: Record<string, EventDecision> = { ...local.decisions };
  for (const [id, incoming] of Object.entries(remote.decisions)) {
    const current = decisions[id];
    if (!current || Date.parse(incoming.at) > Date.parse(current.at)) {
      decisions[id] = incoming;
    }
  }

  return {
    excludeKeywords,
    selectedLocations: remote.selectedLocations,
    selectedDays: remote.selectedDays,
    newOnly: remote.newOnly,
    decisions: pruneDecisions(decisions),
  };
}
