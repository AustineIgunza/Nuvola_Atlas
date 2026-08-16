# Branch protection for `main`

Settings to apply once the CI fix in `2d72333` is confirmed working. This is a
Track B task — it is clicks in the GitHub UI, not code — but the settings need
to be written down so they can be reapplied and reviewed.

Apply at **Settings → Branches → Add branch protection rule**, or
**Settings → Rules → Rulesets** on newer repos. Pattern: `main`.

## Why this could not be applied earlier

Until `2d72333` every job was gated on
`contains(toJson(github.event.pull_request.changed_files), '<dir>')`.
`changed_files` is an integer count, not a file list, so `toJson` produced
something like `"7"` and every `contains()` returned false. No job ran on any
pull request. Requiring status checks against that workflow would have blocked
every PR on checks that never reported.

## Required status checks

Enable **Require status checks to pass before merging** and
**Require branches to be up to date before merging**, then select:

| Check name | Job |
|---|---|
| `Detect changed paths` | `changes` |
| `Backend — phpunit + smoke checks` | `backend` |
| `Frontend — tsc + vitest + build` | `frontend` |
| `Ingestion — ruff + mypy + pytest` | `ingestion` |

Names must match the `name:` values in `.github/workflows/ci.yml` exactly,
em dash included. If a job is renamed, the required check silently stops
matching and stops gating anything.

### The skipped-job trap

The three service jobs carry `if: github.event_name == 'push' || needs.changes.outputs.<svc> == 'true'`,
so a frontend-only PR skips the backend job. A required check that never
reports leaves a PR blocked forever, so this matters.

GitHub treats a job skipped by a **job-level `if:`** as satisfying a required
check, because the workflow still runs and still reports a conclusion for that
job. It does **not** do this for a workflow-level `paths:` filter, where the
workflow never starts and the check is simply absent. That is the reason
`ci.yml` uses a `changes` job plus job-level conditions rather than the
shorter `on.pull_request.paths` form.

Confirm this on the first throwaway PR rather than trusting it: open a PR that
touches only `nuvola-atlas-frontend/`, and check that the backend and
ingestion entries show as skipped-but-satisfied rather than pending. If they
sit pending, drop the three service jobs from the required list and require
only `Detect changed paths`, then add a final aggregating job that depends on
all three and reports a single conclusion.

## Pull request rules

- **Require a pull request before merging** — on.
- **Required approvals** — 1. The team is five people and two of them have
  commit history here; two approvals would stall everything.
- **Dismiss stale approvals when new commits are pushed** — on.
- **Require review from Code Owners** — on. Backed by `.github/CODEOWNERS`.
  Note that `/nuvola-atlas-ingestion/` and `/infra/n8n/` are commented out
  there pending Devyan's GitHub handle, so those paths currently require no
  owner review. Uncomment both lines when the handle is confirmed.
- **Require conversation resolution before merging** — on.

## History rules

- **Require linear history** — on. Squash or rebase only; no merge commits.
  Keeps `git log --oneline` readable, which the sprint document relies on.
- **Allow force pushes** — off.
- **Allow deletions** — off.
- **Do not allow bypassing the above settings** — on, including for admins.
  A protection an admin can click past is a suggestion.

## What is deliberately not required yet

`PHPStan (informational — 158 known violations at level 5)` runs with
`continue-on-error: true` and must not be added to the required list. It has
158 pre-existing violations; requiring it would block every PR. See A5 in
`tasks/todo.md` for the paydown plan — 100 of the 158 are Larastan failing to
resolve Eloquent's dynamic attributes and clear together.

The frontend `ESLint` step **is** blocking and currently fails with 44 errors
and 11 warnings. Either fix those or narrow the `eslint-plugin-react-hooks` v7
preset before turning branch protection on, or every frontend PR is blocked on
a pre-existing backlog.
