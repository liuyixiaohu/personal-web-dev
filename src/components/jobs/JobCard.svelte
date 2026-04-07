<script lang="ts">
  import { formatDate, type Job } from './jobUtils';

  interface Props {
    job: Job;
  }

  let { job }: Props = $props();
</script>

<li class="job-card">
  <div class="job-card-header">
    <a href={job.url || '#'} target="_blank" rel="noopener noreferrer" class="job-title">
      {job.title}
    </a>
    <span class="job-company">{job.company}</span>
  </div>

  <div class="job-card-details">
    {#if job.location}
      <span class="job-detail"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>{job.location}</span>
    {/if}

    {#if job.department}
      <span class="job-detail"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>{job.department}</span>
    {/if}

    {#if job.posted_date}
      <span class="job-detail"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>{formatDate(job.posted_date)}</span>
    {/if}
  </div>
</li>

<style>
  .job-card {
    padding: var(--space-sm) 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  }

  .job-card:last-child {
    border-bottom: none;
  }

  .job-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-sm);
    margin-bottom: 0.3rem;
  }

  .job-title {
    font-size: var(--fs-base);
    font-weight: 500;
    color: var(--text);
    text-decoration: none;
    line-height: 1.4;
  }

  .job-title:hover {
    opacity: 0.6;
  }

  .job-company {
    font-size: var(--fs-xs);
    color: var(--text-light);
    white-space: nowrap;
    flex-shrink: 0;
    padding: 0.15em 0.5em;
    border-radius: var(--radius-sm);
    background: rgba(0, 0, 0, 0.03);
  }

  .job-card-details {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 1rem;
    font-size: var(--fs-xs);
    color: var(--text-light);
    line-height: 1.5;
  }

  .job-detail {
    display: inline-flex;
    align-items: center;
  }

  .icon {
    width: 0.9em;
    height: 0.9em;
    margin-right: 0.25em;
    flex-shrink: 0;
  }

  @media (max-width: 480px) {
    .job-card-header {
      flex-direction: column;
      gap: 0.3rem;
    }

    .job-company {
      align-self: flex-start;
    }
  }
</style>
