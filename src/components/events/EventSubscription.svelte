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
  <p>One email when the daily list adds events. Confirm once, unsubscribe anytime.</p>
  <form onsubmit={subscribe}>
    <label for="subscription-email">Email</label>
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
    margin: 0 0 var(--space-sm);
    padding: var(--space-sm);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  h3 {
    margin: 0 0 var(--space-xs);
    font-size: var(--fs-md);
  }

  p {
    margin: 0 0 var(--space-xs);
    color: var(--text-light);
    font-size: var(--fs-xs);
    line-height: 1.5;
  }

  label {
    display: block;
    margin-bottom: var(--space-xs);
    color: var(--text);
    font-size: var(--fs-xs);
    font-weight: 600;
  }

  .subscription-controls {
    display: flex;
    gap: var(--space-xs);
  }

  input,
  button {
    min-height: 2.5rem;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    font: inherit;
  }

  input {
    min-width: 0;
    flex: 1;
    padding: 0 var(--space-xs);
    color: var(--text);
    background: var(--bg);
  }

  button {
    padding: 0 var(--space-sm);
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
  }

  .subscription-status--error {
    color: var(--color-pm);
  }

  @media (max-width: 480px) {
    .subscription-controls {
      flex-direction: column;
    }
  }
</style>
