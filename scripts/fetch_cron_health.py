"""Snapshot the status of tracked GitHub Actions workflows.

Queries the recent runs for each workflow in WORKFLOWS via the GitHub REST
API, then writes a JSON summary to stdout. Designed to run inside a GH
Actions job; relies on $GITHUB_TOKEN and $GITHUB_REPOSITORY being set.
"""

import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone


WORKFLOWS = ['fetch-events.yml', 'fetch-jobs.yml']
RUNS_PER_WORKFLOW = 10


def fetch_runs(repo, workflow_file, token):
    url = (
        f'https://api.github.com/repos/{repo}/actions/workflows/'
        f'{workflow_file}/runs?per_page={RUNS_PER_WORKFLOW}'
    )
    req = urllib.request.Request(
        url,
        headers={
            'Authorization': f'Bearer {token}',
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def duration_seconds(run):
    started = run.get('run_started_at')
    updated = run.get('updated_at')
    if not started or not updated:
        return None
    try:
        s = datetime.fromisoformat(started.replace('Z', '+00:00'))
        u = datetime.fromisoformat(updated.replace('Z', '+00:00'))
        return int((u - s).total_seconds())
    except ValueError:
        return None


def summarize_run(run):
    return {
        'status': run.get('status'),
        'conclusion': run.get('conclusion'),
        'startedAt': run.get('run_started_at'),
        'updatedAt': run.get('updated_at'),
        'durationSec': duration_seconds(run),
        'htmlUrl': run.get('html_url'),
        'event': run.get('event'),
        'runNumber': run.get('run_number'),
    }


def main():
    token = os.environ.get('GITHUB_TOKEN')
    repo = os.environ.get('GITHUB_REPOSITORY')
    if not token or not repo:
        print('GITHUB_TOKEN and GITHUB_REPOSITORY required', file=sys.stderr)
        sys.exit(1)

    result = {
        'generatedAt': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        'repo': repo,
        'workflows': [],
    }

    for wf_file in WORKFLOWS:
        try:
            data = fetch_runs(repo, wf_file, token)
            runs = data.get('workflow_runs', [])
            wf_name = runs[0].get('name', wf_file) if runs else wf_file
            result['workflows'].append({
                'name': wf_name,
                'file': wf_file,
                'lastRun': summarize_run(runs[0]) if runs else None,
                'recentRuns': [summarize_run(r) for r in runs],
            })
        except urllib.error.HTTPError as e:
            result['workflows'].append({
                'name': wf_file,
                'file': wf_file,
                'lastRun': None,
                'recentRuns': [],
                'error': f'HTTP {e.code}: {e.reason}',
            })

    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
