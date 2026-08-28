# Documentation

Start with [`00-start-here.md`](00-start-here.md). It is written for someone who
has never seen this repo and gets you from clone to running app.

| | |
|---|---|
| [`00-start-here.md`](00-start-here.md) | Day one. Setup, the rules that trip people up, and what is not real yet. |
| [`architecture.md`](architecture.md) | How a byte travels from a source document to a number on the screen. |
| [`decisions/`](decisions/) | ADRs — one file per decision a future developer might reasonably question. |
| [`ops/`](ops/) | [Deploy](ops/deploy.md) · [Rollback](ops/rollback.md) · [Secrets](ops/secrets.md) |
| [`api/openapi.yaml`](api/openapi.yaml) | The API contract. |
| [`brand/`](brand/) | Brand board and exploration. |
| [`archive/`](archive/) | Superseded planning documents. Historical — do not act on them. |

## Elsewhere in the repo

| | |
|---|---|
| [`../README.md`](../README.md) | What the product is, repository layout, how to run each service. |
| [`../CONTRIBUTING.md`](../CONTRIBUTING.md) | Setup, the checks, and how to run them. |
| [`../CLAUDE.md`](../CLAUDE.md) | Current scope and the non-negotiable rules. |
| [`../HISTORY.md`](../HISTORY.md) | Commit-by-commit record of what changed and why. |
| [`../COPYRIGHT.md`](../COPYRIGHT.md) | Ownership and the IP filing. |
| [`../NAVUUNA_REFOCUS_WORKFLOW.md`](../NAVUUNA_REFOCUS_WORKFLOW.md) | The refocus plan of record. |

## Writing an ADR

One file per decision, numbered, named for the decision rather than the area:
`0004-features-are-surfaces-not-pillars.md`, not `0004-frontend.md`.

Four headings and nothing else: **Context** (what forced a choice),
**Decision** (what was chosen, in the present tense), **Alternatives rejected**
(and specifically why — this is the part future-you needs), **Consequences**
(including the costs you accepted).

Write one when a choice would look arbitrary or wrong to someone who was not in
the room. Record the cost honestly — an ADR that only lists upsides is
marketing, and the next person will not trust the rest of the file.
