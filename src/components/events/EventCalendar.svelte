<script lang="ts">
  import type { Lang } from '../../i18n/translations';
  import { t } from '../../i18n/langStore';
  import { getEventSlots, formatDayHeader, formatTimeLabel, type LumaEvent } from './eventUtils';

  interface Props {
    filteredEvents: LumaEvent[];
    calendarDays: string[];
    timeSlots: string[];
    maxHeight: number;
    lang: Lang;
  }

  let { filteredEvents, calendarDays, timeSlots, maxHeight, lang }: Props = $props();

  // Slot density map: slot key → { count, firstId }
  let slotDensity = $derived.by(() => {
    const map = new Map<string, { count: number; firstId: string }>();
    for (const e of filteredEvents) {
      for (const s of getEventSlots(e)) {
        const cur = map.get(s);
        if (cur) cur.count++;
        else map.set(s, { count: 1, firstId: e.api_id });
      }
    }
    return map;
  });

  function scrollToEvent(eventId: string) {
    const el = document.getElementById(`event-${eventId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('event-card--highlight');
      setTimeout(() => el.classList.remove('event-card--highlight'), 1500);
    }
  }

  function slotTitle(key: string): string {
    const info = slotDensity.get(key);
    if (!info) return '';
    return lang === 'zh' ? `${info.count} 个活动` : `${info.count} event${info.count > 1 ? 's' : ''}`;
  }
</script>

{#if calendarDays.length > 0 && timeSlots.length > 0}
  <div class="cal-panel" style="max-height: {maxHeight}px;">
    <span class="filter-label">{t('events.calendar')} <span class="cal-pan-hint">(↔ ↕ Pan to view)</span></span>
    <div class="cal-wrapper">
      <div
        class="cal-grid"
        style="grid-template-columns: 48px repeat({calendarDays.length}, 1fr); width: {48 + calendarDays.length * 72}px;"
      >
        <!-- Header row -->
        <div class="cal-corner"></div>
        {#each calendarDays as day}
          <div class="cal-day-header">{formatDayHeader(day, lang)}</div>
        {/each}
        <!-- Time rows -->
        {#each timeSlots as time}
          <div class="cal-time-label" class:cal-time-label--hour={time.endsWith(':00')}>{time.endsWith(':00') ? formatTimeLabel(time) : ''}</div>
          {#each calendarDays as day}
            {@const key = `${day}T${time}`}
            {@const info = slotDensity.get(key)}
            {@const count = info?.count ?? 0}
            <div
              class="cal-cell"
              class:cal-cell--d1={count === 1}
              class:cal-cell--d2={count === 2}
              class:cal-cell--d3={count >= 3}
              class:cal-cell--hour={time.endsWith(':00')}
              class:cal-cell--clickable={count > 0}
              title={slotTitle(key)}
              role={count > 0 ? 'button' : undefined}
              tabindex={count > 0 ? 0 : undefined}
              onclick={() => { if (info) scrollToEvent(info.firstId); }}
              onkeydown={(ev) => { if (info && (ev.key === 'Enter' || ev.key === ' ')) scrollToEvent(info.firstId); }}
            ></div>
          {/each}
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .cal-panel {
    flex: 0 0 48%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .cal-wrapper {
    flex: 1;
    overflow: auto;
    max-width: 100%;
  }

  .filter-label {
    color: var(--text-light);
    font-size: var(--fs-xs);
    min-width: 3rem;
    flex-shrink: 0;
  }

  .cal-pan-hint {
    font-size: var(--fs-xs);
    color: var(--text-light);
    font-style: italic;
  }

  .cal-grid {
    display: grid;
    gap: 0;
    user-select: none;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 4px;
    overflow: clip;
  }

  .cal-corner {
    position: sticky;
    top: 0;
    left: 0;
    background: var(--bg, #fff);
    z-index: 2;
  }

  .cal-day-header {
    font-size: var(--fs-xs);
    color: var(--text-light);
    text-align: center;
    padding: 0.25em 0.15em;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    border-left: 1px solid rgba(0, 0, 0, 0.08);
    white-space: nowrap;
    position: sticky;
    top: 0;
    background: var(--bg, #fff);
    z-index: 1;
  }

  .cal-time-label {
    font-size: var(--fs-xs);
    color: var(--text-light);
    text-align: right;
    padding-right: 0.3em;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    border-top: 1px solid rgba(0, 0, 0, 0.02);
    position: sticky;
    left: 0;
    background: var(--bg, #fff);
    z-index: 1;
  }

  .cal-time-label--hour {
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .cal-cell {
    height: 16px;
    border-right: 1px solid rgba(0, 0, 0, 0.03);
    border-left: 1px solid rgba(0, 0, 0, 0.08);
    border-top: 1px solid rgba(0, 0, 0, 0.02);
    transition: background 0.1s;
  }

  .cal-cell--hour {
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .cal-cell--clickable {
    cursor: pointer;
  }

  .cal-cell--clickable:hover {
    opacity: 0.7;
  }

  .cal-cell--d1 { background: rgba(90, 160, 120, 0.18); }
  .cal-cell--d2 { background: rgba(90, 160, 120, 0.35); }
  .cal-cell--d3 { background: rgba(90, 160, 120, 0.55); }
</style>
