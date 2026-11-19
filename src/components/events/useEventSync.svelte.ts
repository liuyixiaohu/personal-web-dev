// Optional cross-device sync for the events list. Must be called during
// component initialisation. Off until a sync code is created or joined.
//
// Last write wins. A device pulls on load and when it becomes visible, and
// pushes its own changes after a short pause.
import { onMount } from 'svelte';
import {
  SYNC_CODE_KEY,
  SYNC_TIME_KEY,
  SyncError,
  type SyncSettings,
  canonicalJSON,
  createSync,
  mergeOnJoin,
  pullSync,
  pushSync,
  rotateSync,
} from './syncUtils';

export type SyncStatus = 'idle' | 'syncing' | 'error';

export interface EventSyncOptions {
  /** The settings this device would push right now. */
  currentSettings: () => SyncSettings;
  /**
   * Replace local settings with remote ones. Returns the canonical JSON of
   * what was actually applied, after local pruning.
   */
  applySettings: (settings: SyncSettings) => string;
}

export function createEventSync(options: EventSyncOptions) {
  let code = $state(localStorage.getItem(SYNC_CODE_KEY) ?? '');
  let syncedAt = $state(localStorage.getItem(SYNC_TIME_KEY) ?? '');
  let status = $state<SyncStatus>('idle');
  let error = $state('');
  // The JSON this device last sent or received. Compared with the current
  // settings so that applying remote data does not echo back as a push.
  let lastSyncedJSON = '';

  function saveSyncCode(newCode: string, updated_at: string, json: string) {
    code = newCode;
    syncedAt = updated_at;
    lastSyncedJSON = json;
    localStorage.setItem(SYNC_CODE_KEY, newCode);
    localStorage.setItem(SYNC_TIME_KEY, updated_at);
  }

  function syncFailed(e: unknown) {
    status = 'error';
    error =
      e instanceof SyncError && e.status === 404
        ? 'This sync code no longer exists. Disconnect this device and join again.'
        : 'Sync failed. Your choices are still saved on this device.';
    console.error('Sync failed:', e);
  }

  async function pull() {
    if (!code) return;
    status = 'syncing';
    error = '';
    try {
      const remote = await pullSync(code);
      const lastSeen = localStorage.getItem(SYNC_TIME_KEY) ?? '';
      if (!lastSeen || remote.updated_at > lastSeen) {
        lastSyncedJSON = options.applySettings(remote.settings);
        syncedAt = remote.updated_at;
        localStorage.setItem(SYNC_TIME_KEY, remote.updated_at);
      }
      status = 'idle';
    } catch (e) {
      syncFailed(e);
    }
  }

  async function push(json: string) {
    const current = code;
    if (!current) return;
    status = 'syncing';
    try {
      const { updated_at } = await pushSync(current, JSON.parse(json) as SyncSettings);
      lastSyncedJSON = json;
      syncedAt = updated_at;
      localStorage.setItem(SYNC_TIME_KEY, updated_at);
      status = 'idle';
    } catch (e) {
      syncFailed(e);
    }
  }

  $effect(() => {
    const json = canonicalJSON(options.currentSettings());
    if (!code || json === lastSyncedJSON) return;
    const timer = setTimeout(() => void push(json), 1500);
    return () => clearTimeout(timer);
  });

  onMount(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void pull();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  });

  return {
    get code() {
      return code;
    },
    get syncedAt() {
      return syncedAt;
    },
    get status() {
      return status;
    },
    get error() {
      return error;
    },
    /** Pull once if this device already has a sync code. */
    pullIfConnected() {
      if (code) void pull();
    },
    async create(): Promise<string> {
      const settings = options.currentSettings();
      const { code: newCode, updated_at } = await createSync(settings);
      saveSyncCode(newCode, updated_at, canonicalJSON(settings));
      return newCode;
    },
    async join(joinCode: string): Promise<void> {
      const remote = await pullSync(joinCode);
      const merged = mergeOnJoin(options.currentSettings(), remote.settings);
      const { updated_at } = await pushSync(joinCode, merged);
      const applied = options.applySettings(merged);
      saveSyncCode(joinCode, updated_at, applied);
    },
    async rotate(): Promise<string> {
      const { code: newCode, updated_at } = await rotateSync(code);
      saveSyncCode(newCode, updated_at, lastSyncedJSON);
      return newCode;
    },
    disconnect() {
      code = '';
      syncedAt = '';
      status = 'idle';
      error = '';
      lastSyncedJSON = '';
      localStorage.removeItem(SYNC_CODE_KEY);
      localStorage.removeItem(SYNC_TIME_KEY);
    },
  };
}
