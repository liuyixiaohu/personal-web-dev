<script lang="ts">
  import { onMount } from 'svelte';

  interface Connector {
    id: string;
    name: string;
    url: string;
    description: string;
    first_seen: string;  // YYYY-MM-DD
    last_seen: string;
  }

  interface ConnectorData {
    updated_at: string | null;
    previous_updated_at: string | null;
    new_connector_ids: string[];
    connectors: Connector[];
  }

  let loading = $state(true);
  let error = $state(false);
  let data = $state<ConnectorData | null>(null);

  onMount(async () => {
    try {
      const resp = await fetch('/data/connectors.json');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      data = await resp.json();
    } catch (e) {
      error = true;
      console.error('Failed to fetch connectors:', e);
    } finally {
      loading = false;
    }
  });

  // Group by first_seen, newest date first; within a group sort A-Z by name.
  let groupedConnectors = $derived.by(() => {
    if (!data) return [] as { date: string; connectors: Connector[] }[];
    const byDate = new Map<string, Connector[]>();
    for (const c of data.connectors) {
      const date = c.first_seen || 'unknown';
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(c);
    }
    return [...byDate.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, connectors]) => ({
        date,
        connectors: connectors.slice().sort((a, b) => a.name.localeCompare(b.name)),
      }));
  });

  let todayKey = $derived(data?.updated_at?.slice(0, 10) ?? '');

  function formatDateGroup(dateKey: string): string {
    if (dateKey === 'unknown') return 'Undated';
    const [y, m, d] = dateKey.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatUpdated(iso: string): string {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
</script>

<div class="connector-list">
  <header class="connector-header">
    <h2 class="connector-title">Claude Code Connectors</h2>
    <p class="connector-subtitle">
      Connectors in the public directory, grouped by the date this page first saw them. Refreshed every 3 days.
    </p>
  </header>

  {#if loading}
    <p class="status">Loading…</p>
  {:else if error}
    <p class="status status--error">Failed to load connectors data.</p>
  {:else if !data || data.connectors.length === 0}
    <p class="status">No connectors recorded yet. Wait for the first cron run.</p>
  {:else}
    {#if data.updated_at}
      <div class="meta-bar">
        <span class="meta">Last refreshed: {formatUpdated(data.updated_at)}</span>
        <span class="meta">{data.connectors.length} total · {data.new_connector_ids.length} new this run</span>
      </div>
    {/if}

    {#each groupedConnectors as group (group.date)}
      <h3 class="date-group-header">
        <span>{formatDateGroup(group.date)}</span>
        {#if group.date === todayKey && data.new_connector_ids.length > 0}
          <span class="new-pill">新增</span>
        {/if}
      </h3>
      <ul class="connector-cards">
        {#each group.connectors as connector (connector.id)}
          <li class="connector-card">
            <a href={connector.url} target="_blank" rel="noopener noreferrer" class="connector-name">
              {connector.name}
            </a>
            {#if connector.description}
              <p class="connector-desc">{connector.description}</p>
            {/if}
          </li>
        {/each}
      </ul>
    {/each}
  {/if}
</div>

<style>
  .connector-header {
    margin-bottom: var(--space-sm);
  }

  .connector-title {
    font-size: var(--fs-lg);
    font-weight: 500;
    color: var(--text);
    margin-bottom: var(--space-xs);
  }

  .connector-subtitle {
    font-size: var(--fs-xs);
    color: var(--text-light);
    line-height: 1.5;
    margin: 0 0 var(--space-xs);
  }

  .meta-bar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    font-size: var(--fs-xs);
    color: var(--text-light);
    margin-bottom: var(--space-sm);
  }

  .date-group-header {
    font-size: var(--fs-xs);
    font-weight: 500;
    color: var(--text-light);
    margin: var(--space-sm) 0 0.2rem;
    padding-bottom: 0.2rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .new-pill {
    font-size: 0.65rem;
    font-weight: 500;
    color: var(--color-pm);
    background: rgba(240, 215, 215, 0.4);
    padding: 0.05em 0.4em;
    border-radius: var(--radius-sm);
  }

  .connector-cards {
    list-style: none;
    padding: 0;
    margin: 0 0 var(--space-sm);
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    gap: var(--space-xs);
  }

  .connector-card {
    padding: 0.4rem var(--space-sm);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    transition: border-color 0.15s, background 0.15s;
  }

  .connector-card:hover {
    border-color: rgba(0, 0, 0, 0.2);
    background: rgba(0, 0, 0, 0.015);
  }

  .connector-name {
    color: var(--text);
    text-decoration: none;
    font-size: var(--fs-base);
    font-weight: 500;
    line-height: 1.4;
  }

  .connector-name:hover {
    text-decoration: underline;
  }

  .connector-desc {
    font-size: var(--fs-xs);
    color: var(--text-light);
    margin: 0.15rem 0 0;
    line-height: 1.45;
  }

  .status {
    font-size: var(--fs-xs);
    color: var(--text-light);
    font-style: italic;
    text-align: center;
    padding: var(--space-xl) 0;
  }

  .status--error {
    color: var(--color-pm);
  }
</style>
