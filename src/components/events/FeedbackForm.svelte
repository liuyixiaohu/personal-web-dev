<script lang="ts">
  let feedbackSending = $state(false);
  let feedbackSent = $state(false);
  let feedbackError = $state(false);

  export function reset() {
    feedbackSent = false;
    feedbackError = false;
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    feedbackSending = true;
    feedbackError = false;
    const form = e.target as HTMLFormElement;
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error();
      feedbackSent = true;
    } catch {
      feedbackError = true;
    } finally {
      feedbackSending = false;
    }
  }
</script>

{#if feedbackSent}
  <p class="feedback-success">{'Thanks! Feedback sent.'}</p>
{:else}
  <form onsubmit={handleSubmit}>
    <textarea name="message" required placeholder={'Bugs, ideas, anything...'} rows="4" class="feedback-textarea"></textarea>
    <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off" />
    <button type="submit" class="feedback-submit" disabled={feedbackSending}>
      {feedbackSending ? '...' : 'Send'}
    </button>
  </form>
  {#if feedbackError}
    <p class="feedback-error-msg">{'Failed to send. Try again?'}</p>
  {/if}
{/if}

<style>
  .feedback-textarea {
    width: 100%;
    font-family: inherit;
    font-size: var(--fs-xs);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 0.5rem;
    resize: vertical;
    background: var(--bg);
    color: var(--text);
    box-sizing: border-box;
  }

  .feedback-textarea:focus {
    border-color: var(--text-light);
  }

  .feedback-submit {
    margin-top: 0.5rem;
    font-family: inherit;
    font-size: var(--fs-xs);
    color: var(--text);
    background: none;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 0.3em 0.8em;
    cursor: pointer;
    transition: border-color 0.15s;
  }

  .feedback-submit:hover {
    border-color: rgba(0, 0, 0, 0.25);
  }

  .feedback-submit:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .feedback-success {
    color: var(--color-ds-mid);
    font-size: var(--fs-xs);
    margin: 0.5rem 0 0;
  }

  .feedback-error-msg {
    color: var(--color-pm);
    font-size: var(--fs-xs);
    margin: 0.4rem 0 0;
  }
</style>
