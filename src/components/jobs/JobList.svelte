<script lang="ts">
  import { onMount } from 'svelte';
  import JobCard from './JobCard.svelte';
  import JobFilters from './JobFilters.svelte';
  import {
    type Job, type JobData,
    JOBS_DATA_URL,
    loadPref, enrichJobs,
    buildCompanyIndex, buildLocationIndex,
    formatUpdatedAt,
  } from './jobUtils';

  const PFX = 'console.jobs';

  // --- State ---
  let loading = $state(true);
  let error = $state('');
  let updatedAt = $state('');
  let allJobs: Job[] = $state([]);
  let newIdSet = $state(new Set<string>());
  let showFilters = $state(false);

  // Filter state
  let selectedCompanies = $state<Set<string>>(new Set(loadPref(`${PFX}.companies`, [] as string[])));
  let selectedLocations = $state<Set<string>>(new Set(loadPref(`${PFX}.locations`, [] as string[])));
  let sortBy = $state(loadPref(`${PFX}.sort`, 'company-asc'));
  let searchQuery = $state(loadPref(`${PFX}.search`, ''));
  let excludeKeywords = $state<string[]>(loadPref<string[]>(`${PFX}.exclude`, []));

  // Indexes (built once after fetch)
  let companyIndex = $state<{ sorted: string[]; counts: Map<string, number> }>({ sorted: [], counts: new Map() });
  let locationIndex = $state<{ sorted: string[]; counts: Map<string, number> }>({ sorted: [], counts: new Map() });

  // --- Persistence ---
  function savePref(key: string, val: unknown) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }

  function toggleCompany(c: string) {
    const next = new Set(selectedCompanies);
    next.has(c) ? next.delete(c) : next.add(c);
    selectedCompanies = next;
    savePref(`${PFX}.companies`, [...next]);
  }

  function toggleLocation(loc: string) {
    const next = new Set(selectedLocations);
    next.has(loc) ? next.delete(loc) : next.add(loc);
    selectedLocations = next;
    savePref(`${PFX}.locations`, [...next]);
  }

  function changeSort(s: string) {
    sortBy = s;
    savePref(`${PFX}.sort`, s);
  }

  function changeSearch(q: string) {
    searchQuery = q;
    savePref(`${PFX}.search`, q);
  }

  function addExclude(kw: string) {
    excludeKeywords = [...excludeKeywords, kw];
    savePref(`${PFX}.exclude`, excludeKeywords);
  }

  function removeExclude(kw: string) {
    excludeKeywords = excludeKeywords.filter(k => k !== kw);
    savePref(`${PFX}.exclude`, excludeKeywords);
  }

  function clearFilters() {
    selectedCompanies = new Set();
    selectedLocations = new Set();
    searchQuery = '';
    excludeKeywords = [];
    savePref(`${PFX}.companies`, []);
    savePref(`${PFX}.locations`, []);
    savePref(`${PFX}.search`, '');
    savePref(`${PFX}.exclude`, []);
  }

  // --- Derived: filtered + sorted ---
  let filteredJobs = $derived.by(() => {
    let result = allJobs;

    // Only show new jobs
    if (newIdSet.size > 0) {
      result = result.filter(j => newIdSet.has(j.id));
    }

    // Company filter
    if (selectedCompanies.size > 0) {
      result = result.filter(j => selectedCompanies.has(j.company));
    }

    // Location filter
    if (selectedLocations.size > 0) {
      result = result.filter(j => selectedLocations.has(j.location));
    }

    // Search
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(j =>
        (j._titleLower?.includes(q)) ||
        (j._companyLower?.includes(q)) ||
        (j._locationLower?.includes(q))
      );
    }

    // Exclude keywords (case-insensitive, matches against title, company, location, department)
    if (excludeKeywords.length > 0) {
      result = result.filter(j =>
        !excludeKeywords.some(kw =>
          j._titleLower?.includes(kw) ||
          j._companyLower?.includes(kw) ||
          j._locationLower?.includes(kw) ||
          j.department.toLowerCase().includes(kw)
        )
      );
    }

    // Sort
    result = [...result];
    switch (sortBy) {
      case 'company-asc':
        result.sort((a, b) => (a._companyLower ?? '').localeCompare(b._companyLower ?? '') || (a._titleLower ?? '').localeCompare(b._titleLower ?? ''));
        break;
      case 'title-asc':
        result.sort((a, b) => (a._titleLower ?? '').localeCompare(b._titleLower ?? ''));
        break;
      case 'date-desc':
        result.sort((a, b) => (b.first_seen_at ?? '').localeCompare(a.first_seen_at ?? ''));
        break;
      case 'date-asc':
        result.sort((a, b) => (a.first_seen_at ?? '').localeCompare(b.first_seen_at ?? ''));
        break;
    }

    return result;
  });

  // Group by company for display
  let groupedJobs = $derived.by(() => {
    const groups = new Map<string, Job[]>();
    for (const j of filteredJobs) {
      const key = j.company;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(j);
    }
    return groups;
  });

  // --- Fetch ---
  onMount(async () => {
    try {
      const resp = await fetch(JOBS_DATA_URL);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: JobData = await resp.json();

      updatedAt = data.updated_at || '';
      newIdSet = new Set(data.new_job_ids ?? []);

      const jobs = data.jobs ?? [];
      enrichJobs(jobs);
      allJobs = jobs;

      // Build indexes from new jobs only
      const newJobs = newIdSet.size > 0 ? jobs.filter(j => newIdSet.has(j.id)) : jobs;
      companyIndex = buildCompanyIndex(newJobs);
      locationIndex = buildLocationIndex(newJobs);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load jobs';
    } finally {
      loading = false;
    }
  });
</script>

<div class="job-list">
  <!-- Header -->
  <header class="job-header">
    <h2 class="job-heading">New Jobs</h2>
    {#if updatedAt}
      <span class="job-updated">Updated {formatUpdatedAt(updatedAt)}</span>
    {/if}
  </header>

  {#if loading}
    <p class="job-status">Loading...</p>
  {:else if error}
    <p class="job-status job-status--error">{error}</p>
  {:else}
    <!-- Filter toggle + count -->
    <div class="job-toolbar">
      <span class="job-count">{filteredJobs.length} new {filteredJobs.length === 1 ? 'job' : 'jobs'}</span>
      <button class="filter-toggle" onclick={() => showFilters = !showFilters}>
        {showFilters ? 'Hide filters' : 'Filters'}
      </button>
    </div>

    {#if showFilters}
      <JobFilters
        allCompanies={companyIndex.sorted}
        companyCounts={companyIndex.counts}
        allLocations={locationIndex.sorted}
        locationCounts={locationIndex.counts}
        {selectedCompanies}
        {selectedLocations}
        {sortBy}
        {searchQuery}
        {excludeKeywords}
        onCompanyToggle={toggleCompany}
        onLocationToggle={toggleLocation}
        onSortChange={changeSort}
        onSearchChange={changeSearch}
        onAddExclude={addExclude}
        onRemoveExclude={removeExclude}
        onClear={clearFilters}
      />
    {/if}

    {#if filteredJobs.length === 0}
      <p class="job-status">No new jobs found.</p>
    {:else}
      {#each [...groupedJobs] as [company, jobs]}
        <section class="job-group">
          <h3 class="job-group-heading">{company} <span class="job-group-count">({jobs.length})</span></h3>
          <ul class="job-group-list">
            {#each jobs as job (job.id)}
              <JobCard {job} />
            {/each}
          </ul>
        </section>
      {/each}
    {/if}
  {/if}
</div>

<style>
  .job-list {
    /* container managed by parent page */
  }

  .job-header {
    margin-bottom: var(--space-md);
  }

  .job-heading {
    font-size: var(--fs-lg);
    font-weight: 500;
    margin-bottom: 0.2rem;
  }

  .job-updated {
    font-size: var(--fs-xs);
    color: var(--text-light);
  }

  .job-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-sm);
  }

  .job-count {
    font-size: var(--fs-sm);
    color: var(--text-light);
  }

  .filter-toggle {
    font-family: inherit;
    font-size: var(--fs-xs);
    color: var(--text-light);
    background: none;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: var(--radius-sm);
    padding: 0.25em 0.6em;
    cursor: pointer;
    transition: border-color 0.15s;
  }

  .filter-toggle:hover {
    border-color: rgba(0, 0, 0, 0.2);
  }

  .job-status {
    font-size: var(--fs-sm);
    color: var(--text-light);
    padding: var(--space-md) 0;
  }

  .job-status--error {
    color: var(--color-pm, #9a6868);
  }

  .job-group {
    margin-bottom: var(--space-md);
  }

  .job-group-heading {
    font-size: var(--fs-sm);
    font-weight: 500;
    color: var(--text);
    padding-bottom: 0.3rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    margin-bottom: 0;
  }

  .job-group-count {
    font-weight: 400;
    color: var(--text-light);
  }

  .job-group-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
</style>
