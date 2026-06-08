# Postmortem — {{incident-title}}

_Status: pre-pilot template. Lives under `tasks/todo.md` §9.12._
_Copy this file to `docs/ops/postmortems/{{YYYY-MM-DD}}-{{slug}}.md` and fill it in._

> **Blameless.** This document is about systems, not people. If you find
> yourself writing "X should have known", rephrase: "The system did not
> make it easy for X to know." If a person made a mistake, the question
> is why the system allowed that mistake to land in production.

---

## Summary

_Two to three sentences. What broke, who saw it, and how it ended._

---

## Impact

| Field | Value |
|-------|-------|
| Severity | SEV-{1\|2\|3} |
| Started | {{YYYY-MM-DD HH:MM EAT}} |
| Detected | {{YYYY-MM-DD HH:MM EAT}} |
| Mitigated | {{YYYY-MM-DD HH:MM EAT}} |
| Resolved | {{YYYY-MM-DD HH:MM EAT}} |
| Total duration | {{HH:MM}} |
| User-visible duration | {{HH:MM}} |
| Affected surface | {{frontend / backend API / ingestion / admin / specific endpoint}} |
| Estimated users impacted | {{number or "all signed-in users" or "0 (caught in staging)"}} |
| Data loss? | {{Yes/No — if yes, link the data-loss section below}} |

---

## Detection

_How did we find out? Sentry alert, partner email, a team member
clicking around? If there was a gap between "things started failing"
and "we noticed", explain why._

- {{}}

---

## Timeline

_Times in EAT. Pull these out of the channel transcript + scribe notes
during the incident. Be specific about *who* did *what*; this isn't
about blame, it's about understanding what was actually happening on
the keyboard._

| Time | Event |
|------|-------|
| {{HH:MM}} | {{e.g. Bad release deployed via Forge auto-deploy}} |
| {{HH:MM}} | {{First Sentry alert — link the issue}} |
| {{HH:MM}} | {{IC acknowledged in channel}} |
| {{HH:MM}} | {{Hypothesis: …}} |
| {{HH:MM}} | {{Action: …}} |
| {{HH:MM}} | {{Mitigated — symptom cleared}} |
| {{HH:MM}} | {{Resolved — root cause verified}} |

---

## Root cause

_The actual technical reason this happened. Not the symptom. Not the
trigger. The *cause*. If the answer involves "and", you're probably
naming two separate root causes — separate them._

- {{}}

### Contributing factors

_Things that didn't cause it but made it worse: missing test coverage,
silent failures, alerts that didn't fire, runbooks that didn't exist,
documentation that lied about behaviour._

- {{}}

---

## What went well

_Specific, real things. "We had a runbook" is fine. "The team responded
fast" is too vague — what *specifically* did fast response let us do?_

- {{}}

## What went badly

_Same rule. Specific, real things._

- {{}}

## What was lucky

_Things that worked but only by accident. These usually point at the
biggest hidden risks — a system that survived an incident by luck is
one bad day from a worse one._

- {{}}

---

## Action items

_Every action item has an owner and a date. Action items without
owners are how the same incident happens again next quarter._

| # | Action | Owner | Due | Tracking |
|---|--------|-------|-----|----------|
| 1 | {{e.g. Add `php artisan migrate:status` check to the deploy script's preflight}} | @{{handle}} | {{YYYY-MM-DD}} | {{issue link or TODO}} |
| 2 | {{}} | @{{handle}} | {{YYYY-MM-DD}} | {{}} |
| 3 | {{}} | @{{handle}} | {{YYYY-MM-DD}} | {{}} |

Action-item rules:
- **Don't bundle.** One concrete change per item.
- **Don't write "investigate".** Investigation is a step toward an
  action — write the action it leads to.
- **Don't write "improve communication".** That's a feeling, not a
  task. The task is the specific channel/template/alert change.

---

## Data loss section (only if applicable)

_Delete this section if there was no data loss._

- **What was lost**: {{e.g. 47 minutes of `reports` writes between {{HH:MM}} and {{HH:MM}}}}
- **Why**: {{e.g. Restored Supabase to a snapshot taken before the bad migration ran}}
- **Affected partners**: {{list, or "internal-only"}}
- **Communicated to partners**: {{Yes/No, when, by whom}}
- **Recoverable?**: {{No — snapshots don't include the lost window / Yes — see {{link}}}}

---

## Verification

_How we confirmed the fix actually worked, beyond "the error stopped"._

- [ ] {{e.g. Re-ran the failing user flow in incognito}}
- [ ] {{e.g. Sentry error rate decayed to baseline within 5 min}}
- [ ] {{e.g. `/api/health` returned 200 for 10 consecutive minutes}}
- [ ] {{e.g. Verified no orphaned audit-log rows from the rollback}}

---

## Related artefacts

- Sentry issue: {{link}}
- BetterStack incident: {{link}}
- Channel thread: {{link or paste}}
- Bad commit SHA: {{}}
- Rollback target SHA: {{}}
- Follow-up PR: {{link}}

---

## Sign-off

| Name | Reviewed | Date |
|------|----------|------|
| {{Author}} | ✅ | {{YYYY-MM-DD}} |
| {{Reviewer 1}} | | |
| {{Reviewer 2}} | | |

A postmortem is "done" when at least two team members other than the
author have read it and signed off, and every action item has a tracked
ticket.
