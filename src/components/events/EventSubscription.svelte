<script lang="ts">
  let email = $state('');
  let website = $state('');
  let status = $state<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function subscribe(event: SubmitEvent) {
    event.preventDefault();
    status = 'sending';
    try {
      const response = await fetch('/api/subscriptions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      status = 'sent';
      email = '';
    } catch (error) {
      console.error('Event subscription failed:', error);
      status = 'error';
    }
  }
</script>

<section class="subscription" aria-labelledby="event-subscription-heading">
  <h3 id="event-subscription-heading">Get new event updates</h3>
  <form onsubmit={subscribe}>
    <label class="sr-only" for="subscription-email">Email</label>
    <div class="subscription-controls">
      <input
        id="subscription-email"
        name="email"
        type="email"
        autocomplete="email"
        required
        maxlength="254"
        placeholder="you@example.com"
        bind:value={email}
        disabled={status === 'sending'}
      />
      <button type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Subscribe'}
      </button>
    </div>
    <div class="website-field" aria-hidden="true">
      <label for="subscription-website">Website</label>
      <input
        id="subscription-website"
        name="website"
        type="text"
        tabindex="-1"
        autocomplete="off"
        bind:value={website}
      />
    </div>
  </form>
  {#if status === 'sent'}
    <p class="subscription-status" role="status">
      If that address can be subscribed, a confirmation email will arrive shortly.
    </p>
  {:else if status === 'error'}
    <p class="subscription-status subscription-status--error" role="alert">
      Unable to subscribe right now. Please try again later.
    </p>
  {/if}
</section>

<style>
  .subscription {
    width: 100%;
    padding-top: var(--space-xs);
    border-top: 1px solid var(--border);
  }

  h3 {
    margin: 0 0 var(--space-xs);
    color: var(--text-light);
    font-size: var(--fs-xs);
    font-weight: 400;
    line-height: 1.5;
  }

  .subscription-controls {
    display: flex;
    gap: 0.3rem;
  }

  input,
  button {
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font: inherit;
    font-size: var(--fs-xs);
    line-height: 1.5;
  }

  input {
    min-width: 0;
    flex: 1;
    padding: 0.35em 0.6em;
    color: var(--text);
    background: transparent;
  }

  button {
    padding: 0.35em 0.6em;
    color: var(--bg);
    background: var(--text);
    cursor: pointer;
  }

  button:disabled {
    cursor: wait;
    opacity: 0.6;
  }

  .website-field {
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }

  .subscription-status {
    margin-top: var(--space-xs);
    margin-bottom: 0;
    color: var(--text-light);
    font-size: var(--fs-xs);
    line-height: 1.5;
  }

  .subscription-status--error {
    color: var(--color-pm);
  }
</style>
