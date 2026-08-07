# n8n — automation glue

**Owner:** Devyan (CTIPSO)
**Last updated:** 2026-08-07

n8n is the Phase J automation layer. It sits *beside* the data path, not
inside it: it turns a Daystar file drop into an HTTP call against the
ingestion service and reports the outcome to Slack. Nothing in Laravel or
FastAPI depends on n8n being up — if it dies, ingestion still accepts a
direct POST, and the only thing lost is the automatic pickup.

```
Daystar drop ──▶ n8n ──▶ FastAPI /api/ingest/indicators ──▶ Laravel /api/v1/ingest ──▶ PostGIS
                  │
                  └──▶ Slack #data-feeds
```

## Running it

n8n is behind a compose profile so a plain `docker compose up` stays lean:

```bash
docker compose --profile automation up -d n8n
# http://localhost:5678
```

State lives in the `n8n` Postgres schema on the same database as the app.
The schema is created by `nuvola-atlas-backend/docker/postgres/init.sql`;
n8n runs its own migrations inside it. Keeping it out of `public` is what
makes `php artisan migrate:fresh` safe — it cannot wipe automation state.

### Environment

| Variable | Set on | Purpose |
|----------|--------|---------|
| `N8N_ENCRYPTION_KEY` | compose / host env | Encrypts stored credentials. **Rotating it orphans every saved credential.** |
| `INGESTION_BASE_URL` | compose | Where workflow #1 POSTs. `http://fastapi:8100` locally. |
| `INGESTION_INTERNAL_SECRET` | host env | Hop-1 bearer. Must equal the ingestion service's value. |
| `SLACK_DATA_FEEDS_WEBHOOK` | host env | Slack incoming-webhook URL for `#data-feeds`. |

Workflow #1 reads its secrets from `$env` rather than from n8n's credential
store. That is deliberate: it keeps the workflow JSON free of credential
references, so the file in this repo is the whole workflow and is safe to
commit and diff.

## Exposure — Cloudflare Access

**n8n is never published directly.** The editor is a full remote-code-execution
surface (Code nodes run arbitrary JS) with a single shared login, so the
public-internet posture is: no port, no DNS record, no exception.

Production shape:

1. n8n binds to `127.0.0.1:5678` on the DigitalOcean droplet — no published
   port, no entry in the droplet firewall.
2. A `cloudflared` tunnel on the same box maps
   `automation.navuuna.dev` → `http://127.0.0.1:5678`. The tunnel is the only
   ingress; there is no origin IP to find.
3. A Cloudflare Access application on `automation.navuuna.dev` with an
   allow-policy scoped to the team's email addresses. Session duration 24h.
4. A bypass policy on `/webhook/*` **only** — Daystar's drop mechanism cannot
   complete an Access login. That path is protected by
   `INGESTION_INTERNAL_SECRET` at the next hop, not by Access.

Step 4 is the sharp edge. `/webhook/*` is unauthenticated at the edge by
design, so any workflow reachable on that prefix must validate its own
caller. Workflow #1 does not trust the webhook body — the filename gate and
the ingestion service's own `X-Internal-Secret` check are what stand between
a stray POST and the database.

The tunnel token and the Access policy are dashboard state, not repo state.
They are listed in `docs/ops/CREDENTIALS-NEEDED.md`.

## Workflows

| File | What it does |
|------|--------------|
| `workflows/01-daystar-drop-intake.json` | Daystar drop → filename gate → ingestion POST → Slack summary |

### Workflow #1 — Daystar drop intake

Two triggers feed one pipeline:

- **Drop Webhook** (`POST /webhook/daystar-drop`) — the real path. Body is
  `{ "filename": "...", "batch": { ... } }`, or a bare batch envelope with a
  sibling `filename` key.
- **Manual Dry Run** — fires the same pipeline against a built-in synthetic
  drop (4 readings across 3 indicators, 3 zones). Needs no input.

Then: **Normalize Drop** collapses both shapes → **Validate Filename** gates
on the naming convention → **Filename Valid?** branches → either
**Forward To Ingestion** + **Summarize Receipt**, or **Quarantine Notice**.
Both branches land in **Notify #data-feeds**.

The filename convention it enforces is the one in
`docs/data/daystar-indicator-spec.md`:

```
daystar-<YYYY-MM-DD>-<scope>[-<seq>].json
```

`<scope>` is a pillar group (`social`, `safety`, `density`, `infra`) or a
single one of the 13 indicator keys. The gate also rejects a batch over the
5,000-row cap up front, so an oversized drop gets a "chunk it" message
instead of a bare 413 from the next hop.

**Idempotency is delegated, not reimplemented.** The ingestion service
deduplicates on the SHA-256 of the raw request body and replays the original
receipt with `"duplicate": true`; the workflow reports that as a `:repeat:`
message. A file-based dedupe here would be weaker (it would key on filename,
which Daystar can reuse with different contents) and would not survive a
container replacement.

**Failures are messages, not red executions.** Both HTTP nodes set
`neverError`, so a 413/429/503 from ingestion arrives in Slack with its
status and RFC 7807 detail rather than dying silently in the execution log.

### Dry run

In the editor: open workflow #1, click **Execute Workflow**. With
`SLACK_DATA_FEEDS_WEBHOOK` set you get a message in `#data-feeds`; without
it, the last node shows the payload it would have sent.

The Code nodes are plain JS with no n8n-specific globals beyond `$input` and
`$()`, so the gate can also be exercised straight from the JSON without a
running n8n — useful in CI or when reviewing a change to the convention.

## Git round-trip

The JSON in this directory is the source of truth. The editor is a scratchpad.

**Repo → n8n:** editor → *Workflows* → *Import from File* → pick the JSON.
Importing replaces the canvas; it does not merge.

**n8n → repo:** open the workflow → **⋯** → *Download*. Then, before
committing, strip the volatile fields the export adds — `id`, `versionId`,
`createdAt`, `updatedAt`, `active`, and any `pinData` — otherwise every
export produces a diff that says nothing. Node `id`s and the `webhookId` are
stable and should be kept as they are, so an import does not orphan the
webhook URL.

Never commit an export containing a `credentials` block. If a workflow grows
one, move the value to an env var first — that is the reason workflow #1
reads `$env` throughout.
