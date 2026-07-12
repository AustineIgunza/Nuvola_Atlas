# Admin & Investor — Product Workflows

Companion to `docs/backend-build-plan.md`. This file documents **what admins and investors can do inside the platform**, not how it's engineered. Some workflows are already shipped, others are on the roadmap. Each entry marks its current state so the team can see the gap between what exists and what will exist.

Last updated: 2026-07-12 · HEAD after this commit.

**Legend**
- `[✓ shipped]` — live in mock now, visible in the deployed demo
- `[◐ mock-only]` — UI shipped against fixtures; backend endpoint pending Phase E/F
- `[○ planned]` — described here so the team can plan it; no code yet
- Every workflow lists **who** owns it and **what data touches** it, so the migration + route mapping is unambiguous when Phase E/F ships

---

## PART 1 — Admin

Admins are internal Navuuna staff. Everything in this section requires `role:admin` + `admin.two_factor`, and every state-changing action is audit-logged via `audit.write` middleware (see backend build plan §6).

Landing surface: `/admin`. Sectioned into Overview, Audit log, Users, Firms, Data feeds, Methodology, API keys — plus the workflows below as they land.

### 1.1 User management  `[◐ mock-only]`
- **Search + filter** by role, firm, last active, deactivated state
- **Role edit** — promote / demote across viewer < partner < investor < editor < admin
- **Impersonate** — click "View as" to sign in as any user for support; typed `reason` required, both start + end audit-logged
- **Deactivate / reactivate** without deleting; keeps the audit trail intact
- **Resend verification email** for users stuck in unverified state
- **Bulk invite** — paste a list of emails, pick a role, generate one-time invite links
- **Force sign-out all sessions** — revokes every Sanctum token for the target user
- **Reset 2FA** — clears the target user's 2FA enrolment (used when someone loses their phone)

Data touched: `users`, `personal_access_tokens`, `impersonation_sessions`, `audit_logs`.

### 1.2 Firm management  `[✓ shipped in mock UI]`
- **Create firm** — name, slug, tier (basic / deal / sovereign), contact details
- **Add / remove firm members** — attach existing users to firms with `role_within_firm` (lead / analyst / viewer)
- **Watchlist bulk edit** — PUT the entire watchlist for a firm in one call
- **Move investor between firms** — updates `users.primary_firm_id`
- **Tier upgrade / downgrade** — writes an audit row; investors see the new tier immediately on next request (no re-login)
- **Firm-scoped announcements** — push a banner only visible to that firm's investors (see §1.7)
- **Suspend firm** — sets `firms.active = false`; investor sessions get a "contact your firm admin" prompt

Data touched: `firms`, `firm_users`, `firm_watchlists`, `users.primary_firm_id`, `announcements`.

### 1.3 Methodology tuning  `[◐ mock-only]`
- **Weights editor** with sliders — mock ships now, live-diff shows what every zone would move to under proposed weights
- **Bands editor** — cutoffs between Strong / Moderate / At Risk
- **Preview diff** — client-side projection using `ScoreCalculator::pillarScoresFromValues`; shows sorted top movers
- **Publish with typed confirmation** — writes a new `methodology_versions` row, marks it `is_current = true`, dispatches `RecalculateAllZones` (async job from Slice 1 of the backend plan)
- **Version history** — every published version is retained; can preview old versions but not un-publish
- **Rollback** — publishes a "revert to vN.M.K" version rather than mutating history

Data touched: `methodology_versions`, `zone_snapshots` (existing snapshots stay under the version they were computed with), `audit_logs`.

### 1.4 Data ingestion monitor  `[✓ shipped in mock UI]`
- **Feed health tiles** — every source (KURA, KeNHA, KPLC, KETRACO, NPS, KNBS, NEMA, NCWSC, Athi Water, ICTA, Daystar) shown with fresh / amber / stale state
- **Zone × indicator matrix** — 17 zones × 13 indicators with delivered / in-pipeline / awaiting-data badges per cell
- **Cell click** → raw last-delivered payload (JSON viewer)
- **Manual re-ingest** for a failed feed × zone × indicator combination
- **Field verification override** — mark an indicator value as field-verified after a ground officer checks it
- **Stale-feed alert configuration** — per-feed `expected_frequency_min` and a threshold multiplier before the tile flips amber → red
- **Ingestion job history** — a table of every ingest attempt with timing, size, and success/error

Data touched: `data_feed_status`, `data_ingestion_logs`, `indicator_scores`, `zone_snapshots`.

### 1.5 Content management (CMS)  `[○ planned]`
- **Edit methodology copy** — the explainer text on `/vitality`, `/public`, and inside the scorecard drill-in
- **Draft → review → publish** flow with auto-snapshot revisions
- **Firm-scoped reports** — publish a report visible only to a specific firm (`reports.firm_scope_id`)
- **Public portal banner** — copy shown at the top of `/public` (used for pilot announcements, community outreach)
- **Locale-aware content** — English source + Swahili partial; falls back to English when a key isn't translated
- **Preview URL** — a signed URL admins can share for review before publishing

Data touched: `content_blocks`, `content_block_revisions`, `reports`.

### 1.6 Audit trail  `[✓ shipped]`
- **Filter** by user, action type (create / update / delete / login / impersonate / publish), date range, entity type
- **Row expand** shows before / after JSON diff
- **CSV export** for compliance requests
- **Search** by target-entity id (find every action taken against `zones/kibra`, for example)
- **Immutable** — no update / delete path; enforced by role-level grants

Data touched: `audit_logs`, `impersonation_sessions`.

### 1.7 Announcements  `[◐ mock-only]`
- **Global banner** — admin composes a message visible to all authed users
- **Firm-scoped banner** — shown only to that firm's users
- **Severity** — info / warning / critical (drives banner colour)
- **Scheduled** — set a start + end timestamp; banner appears and disappears automatically
- **Dismissible per-user** — banner state stored in `localStorage`; admins can force undismissable for critical
- **Announcement history** — every announcement retained for audit

Data touched: `announcements`, `audit_logs`.

### 1.8 System health  `[○ planned]`
- **Dashboard** with backend uptime, DB latency, Reverb channel health, ingestion pipeline lag, Sentry error rate, queue depth
- **On-call rotation** display and one-click paging via BetterStack
- **Feature flag status** — every flag with current value + audit of last change
- **Deployment log** — every push to `main`, every deploy to Fly staging or Forge production, with links to the commit
- **Background job queue** — table of dispatched / running / failed jobs with retry action

Data touched: read-only (from Sentry, BetterStack, queue tables, `audit_logs`).

### 1.9 API key management  `[✓ shipped]`
- **Mint wizard** — name, role, rate limit per minute, expiry
- **Rotate** without downtime — issue new, deprecate old with a grace window
- **Revoke** immediately
- **Rate limit override** per key (already stored on `personal_access_tokens.rate_limit_per_minute`)
- **Usage stats** — requests per key over 7 / 30 days

Data touched: `personal_access_tokens`.

### 1.10 Data exports & reporting  `[○ planned]`
- **Bulk export** — full snapshot of any zone / firm / methodology-version in JSON / CSV / GeoJSON
- **Scheduled exports** — cron-based delivery to R2 / S3 / partner SFTP
- **Report templates** — reusable formats for common outputs (LP brief, county board summary, ward update)
- **Watermarking** — every generated PDF carries the generating user + timestamp + firm scope (if applicable)

Data touched: `zones`, `zone_snapshots`, `indicator_scores`, `reports`, `firms`.

### 1.11 Feature flags  `[○ planned]`
- **Enable a feature for specific firms** (e.g., roll out "ESG-lens" to one firm at a time)
- **Enable for specific users** (e.g., beta test with a lead investor before wider rollout)
- **Percentage rollout** — enable for N% of users
- **Kill-switch** — instantly disable a feature that's misbehaving in production
- **Audit trail** — every flag change logged

Data touched: `feature_flags`, `audit_logs`.

---

## PART 2 — Investor

Investors are external users representing capital-allocation firms. Every route runs under `role:investor` + `firm.scope` middleware (backend plan §5, §7.3), so an investor from Firm A cannot read Firm B's data. Sign-in lands on `/investor` instead of `/atlas`.

### 2.1 Portfolio dashboard  `[✓ shipped in mock UI]`
- **Firm KPI tiles** — portfolio-average Vitality vs county average; watchlisted zones count; active projects; open alerts
- **Portfolio ranking** — watchlisted zones ranked by the capital-allocation lens (Safety × 0.35 + Infra × 0.35 + Social × 0.15 + Density × 0.15 for `deal` tier; overall Vitality for `basic`; QoQ delta for `sovereign`)
- **Top Opportunities** — non-watchlisted zones ranked by tier-specific heuristic; one-click to add to watchlist
- **Watchlist alerts** — high/medium alerts filtered to watchlisted zones only
- **Firm thesis card** — free-text thesis stored per firm, editable by leads

Data touched: `firm_watchlists`, `zones`, `alerts`, `projects`, `firms`.

### 2.2 Watchlist management  `[◐ mock UI, backend Phase F]`
- **Add / remove** any zone with one click via the ★ chip (this ships in this commit)
- **Priority** — drag-to-reorder within the portfolio; persists per firm
- **Per-zone thesis note** — free-text why this zone is on the watchlist
- **Bulk import** — paste a list of zone slugs to add many at once
- **Bulk export** — download the watchlist as CSV for LP-style memos
- **Shared team notes** — every user in the firm sees each other's thesis notes

Data touched: `firm_watchlists`, `firm_users`.

### 2.3 Deal flow & annotations  `[○ planned]`
- **Deal pipeline board** — kanban with columns: Prospect / Meeting / Diligence / Term Sheet / Closed / Passed
- **Deal card** — one per opportunity, links to a zone (or multiple), carries LP notes, meeting log, next-step timestamp
- **Diligence checklist** — customisable per firm; syncs to the LP brief PDF
- **Reminder / follow-up** — set a next-touch date; investor gets a notification
- **Deal history** — every state change logged, exportable

Data touched: `investor_deals`, `investor_deal_notes`, `investor_deal_states`.

### 2.4 Alert subscriptions  `[○ planned]`
- **Zone drop alerts** — email me when a watchlisted zone drops N points on any pillar
- **Feed staleness alerts** — email me when Daystar hasn't delivered for a watchlisted zone in > 24 h
- **Project milestone alerts** — email me when a project I'm tracking hits 50 % / 75 % / 100 %
- **Digest cadence** — daily / weekly / monthly summary email
- **Slack integration** — post alerts to a firm's Slack channel via webhook

Data touched: `investor_alert_subscriptions`, `investor_alert_deliveries`.

### 2.5 ESG-lens toggle  `[○ planned]`
- **Global toggle** — flips the entire browsing experience into ESG-first framing (per user, per session)
- Atlas layers re-tint with Safety + Infrastructure emphasised
- Scorecard sub-metrics re-order to lead with sovereign-risk / ESIA-transparency / resource-sovereignty
- Portfolio ranking column set switches to ESG-weighted scores
- Persistent per-user preference

Data touched: none (client-side view mode). Optional: log the toggle event to `audit_logs` for research on adoption.

### 2.6 Investor brief PDF  `[◐ mock UI, backend Phase F Slice 16]`
- **One-click "Download brief"** — LP-style PDF over the whole watchlist
- Cover with firm name, thesis, generation timestamp, county summary
- One page per watchlisted zone: overall score, four pillars, active alerts, active projects, thesis note
- Appendix: methodology version + link, feed freshness summary
- Watermarked with the generating user email
- **Locale-aware** — English or Swahili
- **Cadence** — set up scheduled delivery (weekly / monthly) to a distribution list

Data touched: extends `ZoneReportExporter` with `firm-portfolio` format.

### 2.7 Zone comparison workflows  `[✓ shipped in mock UI, backend Phase E]`
- **Compare page** already supports up to 3 zones; investors get a **capital allocation lens row** ranking picked zones on the investor composite
- **Save comparison** — bookmark a specific comparison for later; sharable with other users in the firm
- **Watchlist comparison template** — one-click compare "my whole watchlist" side-by-side (limited to 5 for readability)
- **Benchmark comparison** — compare a picked zone against county average, against watchlist average, against another firm's public snapshot (opt-in)

Data touched: `investor_saved_comparisons` (planned), `firm_watchlists`, `zones`.

### 2.8 Team members panel  `[○ planned]`
- **Who else is at my firm** — see other analysts / leads at the same firm
- **Who's watching what** — see which team member added each watchlist entry
- **Delegate** — a lead can promote / demote analyst permissions within the firm
- **Activity feed** — recent notes, watchlist changes, published briefs from any team member

Data touched: `firm_users`, `firm_watchlists.added_by`, `investor_deal_notes.author`.

### 2.9 Personal notes & bookmarks  `[○ planned]`
- **Per-zone private notes** — visible only to the investor who wrote them
- **Bookmark projects / alerts** — flag a specific project across the platform for follow-up
- **Search notes** across the firm's history
- **Notes RAG** — the assistant can search the firm's notes when answering a question ("what did our team say about Kibra's water situation?")

Data touched: `investor_zone_notes`, `investor_bookmarks`.

### 2.10 Custom composite metrics  `[○ planned]`
- **Weight editor** — investor picks their own pillar weights for personal ranking (not admin's global weights)
- **Save as** — name and share the custom composite with the firm
- **Compare** — see how a zone ranks under your custom composite vs the global methodology
- **Portfolio applied** — the portfolio ranking screen can switch to any saved composite

Data touched: `investor_composites`, `firm_users`.

### 2.11 Analytics dashboard  `[○ planned]`
- **My activity** — how much time in each section, most-viewed zones, most-referenced reports
- **Firm-wide activity** — aggregated for the whole firm (leads only)
- **Signal correlation** — which pillars best predicted zones I invested in vs those I passed on
- **LP-facing metrics** — high-level firm activity KPI (public read for stakeholder updates)

Data touched: `analytics_events`, `investor_deals`.

### 2.12 API access for the firm  `[○ planned]`
- **Firm-scoped API key** — mints an API key that respects the firm's watchlist scoping
- **Rate limits** per firm tier — sovereign > deal > basic
- **Webhook endpoints** — the firm's own backend receives events when a watchlisted zone crosses a threshold
- **Consumption dashboard** — see the firm's API usage, remaining budget

Data touched: `personal_access_tokens` (with firm scope), `firm_webhooks`.

---

## PART 3 — Cross-cutting concerns

### 3.1 Localisation
Everything above is routed through the `useT()` hook. Investor sees English or Swahili based on their `prefs.locale`. Admin surfaces stay English-only until a bilingual admin lead requests otherwise (i18n cost isn't zero and admin turnover is low).

### 3.2 Audit + accountability
Every write above lands an `audit_logs` row via `audit.write` middleware. Impersonation writes to both `impersonation_sessions` and `audit_logs`. Investor writes carry `firm_id` for firm-level accountability. Every published PDF is watermarked with generator + timestamp so leaked outputs can be traced.

### 3.3 Rate limiting
Investor routes inherit `throttle:api` (60/min per user + IP). Tier-specific limits become a Phase C task if a sovereign firm starts hammering the API. Admin routes inherit `throttle:api` too — no separate admin limiter.

### 3.4 Realtime
When the backend flips over (Phase B complete): admin data-feed changes broadcast on `admin.feeds`; investor watchlist changes broadcast on `firm.{id}.watchlist` so multiple team members stay in sync; methodology publishes broadcast on `admin.methodology` so open admin UIs auto-refresh.

### 3.5 Mock parity contract
The frontend `src/api/mock.ts` must stay in sync with backend behaviour when it lands. Every route above that lists a `[◐]` state has a mock counterpart today; a `[○]` route lands on both sides in the same slice.

---

End of workflows document.
