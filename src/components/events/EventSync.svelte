<script lang="ts">
  import Popup from '../Popup.svelte';
  import { formatUpdatedAt } from './eventUtils';
  import { formatCode } from './syncUtils';

  interface Props {
    code: string;
    syncedAt: string;
    status: 'idle' | 'syncing' | 'error';
    error: string;
    onCreate: () => Promise<string>;
    onJoin: (code: string) => Promise<void>;
    onShowCode: () => string;
    onRotate: () => Promise<string>;
    onDisconnect: () => void;
  }

  let {
    code,
    syncedAt,
    status,
    error,
    onCreate,
    onJoin,
    onShowCode,
    onRotate,
    onDisconnect,
  }: Props = $props();

  let open = $state(false);
  /** A full code the viewer asked to see: right after creating, rotating, or "Show code". */
  let revealed = $state('');
  let joinInput = $state('');
  let busy = $state(false);
  let localError = $state('');
  let copied = $state(false);

  const shownError = $derived(localError || error);
  const maskedCode = (c: string) => `${c.slice(0, 4)}-....-....-....`;

  function close() {
    open = false;
    revealed = '';
    localError = '';
    joinInput = '';
  }

  async function run(fn: () => Promise<void>) {
    busy = true;
    localError = '';
    try {
      await fn();
    } catch (e) {
      localError = e instanceof Error ? e.message : 'Something went wrong. Try again.';
    } finally {
      busy = false;
    }
  }

  function create() {
    void run(async () => {
      revealed = await onCreate();
    });
  }

  function rotate() {
    void run(async () => {
      revealed = await onRotate();
    });
  }

  function join() {
    const formatted = formatCode(joinInput);
    if (!formatted) {
      localError = "That doesn't look like a sync code. It has 16 letters and numbers.";
      return;
    }
    void run(async () => {
      await onJoin(formatted);
      joinInput = '';
    });
  }

  function showCode() {
    revealed = onShowCode();
  }

  async function copy() {
    await navigator.clipboard.writeText(revealed);
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }

  function disconnect() {
    revealed = '';
    onDisconnect();
  }
</script>

<span class="sync-wrap">
  <button
    type="button"
    class="sync-btn"
    class:sync-btn--on={Boolean(code)}
    aria-haspopup="dialog"
    aria-expanded={open}
    onclick={() => (open ? close() : (open = true))}
  >
    Sync{code ? ' · on' : ''}
  </button>

  <Popup {open} title="Sync across devices" onClose={close}>
    <div class="sync-body">
      {#if revealed}
        <p class="sync-text">
          Anyone with this code can read and change your filters and handled events. Keep it
          private.
        </p>
        <p class="sync-code-row"><code class="sync-code">{revealed}</code></p>
        <div class="sync-actions">
          <button type="button" class="pill" onclick={copy}>{copied ? 'Copied' : 'Copy'}</button>
          <button type="button" class="pill" onclick={() => (revealed = '')}>Done</button>
        </div>
      {:else if code}
        <p class="sync-text">This device is synced.</p>
        <p class="sync-code-row"><code class="sync-code">{maskedCode(code)}</code></p>
        <p class="sync-meta">
          {#if status === 'syncing'}
            Syncing...
          {:else if syncedAt}
            Last synced {formatUpdatedAt(syncedAt)}
          {/if}
        </p>
        <div class="sync-actions">
          <button type="button" class="pill" onclick={showCode}>Show code</button>
          <button type="button" class="pill" onclick={rotate} disabled={busy}>New code</button>
          <button type="button" class="pill" onclick={disconnect}>Disconnect this device</button>
        </div>
      {:else}
        <p class="sync-text">
          Optional. Keep your keywords, filters, and handled events the same on your devices. No
          account needed. Nothing is synced unless you create or join a code.
        </p>
        <div class="sync-actions">
          <button type="button" class="pill" onclick={create} disabled={busy}>
            Create sync code
          </button>
        </div>
        <form
          class="sync-join"
          onsubmit={(e) => {
            e.preventDefault();
            join();
          }}
        >
          <input
            class="search-input"
            type="text"
            aria-label="Sync code"
            placeholder="I have a code: xxxx-xxxx-xxxx-xxxx"
            autocomplete="off"
            spellcheck="false"
            bind:value={joinInput}
          />
          <button type="submit" class="pill" disabled={busy || !joinInput.trim()}>Join</button>
        </form>
      {/if}

      {#if shownError}
        <p class="sync-error" role="alert">{shownError}</p>
      {/if}
    </div>
  </Popup>
</span>

<style>
  .sync-wrap {
    position: relative;
    display: inline-block;
  }

  .sync-btn {
    font-family: inherit;
    font-size: var(--fs-xs);
    line-height: 1.5;
    color: var(--text-light);
    background: none;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 0.1em 0.4em;
    margin-left: 0.3em;
    cursor: pointer;
    white-space: nowrap;
  }

  .sync-btn:hover {
    border-color: rgba(0, 0, 0, 0.25);
    color: var(--text);
  }

  .sync-btn--on {
    color: var(--color-visual);
    border-color: var(--color-visual);
  }

  .sync-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    font-size: var(--fs-xs);
    line-height: 1.5;
  }

  .sync-text,
  .sync-meta {
    margin: 0;
    color: var(--text-light);
  }

  .sync-code-row {
    margin: 0;
    word-break: break-all;
  }

  .sync-code {
    font-size: var(--fs-xs);
    color: var(--text);
  }

  .sync-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .sync-join {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .sync-error {
    margin: 0;
    color: var(--color-pm);
  }
</style>
