# Start here

Written for someone who has never seen this repo. If anything below is wrong or
a step is missing, fix it in the same pull request that tripped you up — a
day-one document that lies is worse than none.

## What this is

Navuuna publishes what is actually measured about service delivery in Nairobi's
17 sub-counties, and shows the shape of what is not.

The whole product follows from one rule: **a number is shown with its
provenance, or it is not shown at all.** Every value carries a source, a
vintage, a granularity and a method. A pillar with no data source renders grey
with no number — never a proxy, never an interpolation, never a zero.

That rule is why the codebase looks the way it does. Most of what seems like
over-engineering here — the registry, the drift guards, the tripwire scripts —
exists to make that rule mechanical instead of a matter of somebody remembering.

## Get it running

You need Docker, PHP 8.3+, Composer, Node 20 and Python 3.13.

**Use Node 20.** `.nvmrc` pins it and CI matches. On newer Node, vitest's jsdom
environment does not populate `localStorage` and 14 frontend tests fail with
`Cannot read properties of undefined (reading 'getItem')` pointing at
application code that is perfectly fine. If you see that error, check
`node --version` before you debug anything else.

```bash
nvm use
make db          # Postgres + PostGIS on :5434 — phpunit hangs without it
```

```bash
cd nuvola-atlas-backend && composer install && cp .env.example .env && php artisan key:generate && php artisan migrate:fresh --seed && php artisan serve
```

```bash
cd nuvola-atlas-frontend && npm ci && npm run dev
```

Open http://localhost:5173. The seeded data is fixtures — see *What is not real
yet* below.

The two Python services install the same way:

```bash
cd nuvola-atlas-data && python3 -m venv .venv && .venv/bin/pip install -e ".[dev]"
```

## Prove it works

```bash
bash scripts/check.sh
```

Runs every check CI runs, keeps going after a failure, and prints a summary so
one run tells you everything that is broken. Only PHPStan is non-blocking — it
carries pre-existing level-5 debt and is reported rather than enforced, because
a check that is always red teaches everyone to stop reading it.

`make db` first, or phpunit will **hang** rather than fail: `phpunit.xml` pins
`127.0.0.1:5434` and a missing server is a TCP timeout, not an error. The script
probes the port and tells you.

## Where things live

Ask "where does water & sanitation live?" The answer is one file:
[`nuvola-atlas-frontend/src/domain/water.ts`](../nuvola-atlas-frontend/src/domain/water.ts).

```
pillars.json          what we measure — the pillar registry, generated into all four services
zones.json            where we measure it — the 17 sub-counties

nuvola-atlas-frontend/src/
  app/                the shell: routing, providers
  domain/             pillar and zone logic. No JSX. Start here to understand the product.
  features/           one folder per product surface — atlas, scorecard, vitality, compare…
  shared/             ui, chrome, hooks, lib, stores — anything two features both need
  api/                client, contract, and the live/demo implementations

nuvola-atlas-backend/app/
  Domain/             Scoring, CountyContext, Feeds, Methodology, Forecast
  Http/ Models/ Jobs/  standard Laravel, exactly where you expect it
  Services/           surfaces outside the current MVP — see decisions/0006

nuvola-atlas-ingestion/app/
  routers/            HTTP entry points
  quality/            the reading-quality pipeline: clean.py, outliers.py
  forward.py          the HMAC-signed hop to Laravel

nuvola-atlas-data/    offline pipeline. Not in the serving path.
  pipeline/wasreb/    one module per concern of the WASREB source
  manifests/          provenance for every input file
```

Features are **product surfaces, not pillars**. Pillars are data, rendered
generically from `pillars.json`; a folder per pillar would be three empty
directories and one that everything imports. See
[`decisions/0004-features-are-surfaces-not-pillars.md`](decisions/0004-features-are-surfaces-not-pillars.md).

## Five rules that will trip you up

1. **Never render an invented number as measured.** `method: "gap"` renders
   grey, with no number, ever.
2. **Utility and county figures never land on sub-county bubbles.** WASREB
   reports per utility; NCWSC serves all of Nairobi. Spreading one figure
   across 17 sub-counties is inventing data. County-level values go in the
   banner above the map. This is the product, not a limitation.
3. **Off means deleted, not flagged.** A retired pillar has no code path that
   could render it, and a test sweeps the public read surface to prove it.
4. **No pillar key as a string literal.** Go through `App\Support\Pillars` on
   the backend, `domain/pillars.generated.ts` on the frontend. Both are
   generated from `pillars.json`; hand-editing them fails the build.
5. **Secrets come from the environment.** Never from code, never committed.

## What is not real yet

Being straight with you, because the code does not say this loudly enough:

- **The seeded pillar values are fixtures.** `ZoneSeeder.php` says so in its
  docblock. They exist so a fresh clone renders something and so the
  partial-data paths get exercised. They are not sourced and must never be
  shown to a partner.
- **The sub-county boundaries are placeholders.** All 17 polygons in
  `nairobi-subcounties.geojson` are hand-drawn rectangles, and nothing loads
  the file anyway — the atlas builds its shapes at runtime from Voronoi cells
  around the approximate centroids in `zones.json`. The file's `_provenance`
  block spells this out.
- **WASREB data is real.** `wasreb_impact17_long.csv` at the repo root is a
  reconciled dataset of 641 values across 68 utilities, with a manifest
  recording its source and checksum. It is county/utility granularity, so
  per rule 2 it renders in the banner, not on bubbles.

## Where to go next

| You want to… | Read |
|---|---|
| understand how data reaches the screen | [`architecture.md`](architecture.md) |
| know why something is built the way it is | [`decisions/`](decisions/) |
| deploy, or undo a deploy | [`ops/`](ops/) |
| know the current scope and its rules | [`../CLAUDE.md`](../CLAUDE.md) |
| see what changed and why | [`../HISTORY.md`](../HISTORY.md) |
| call the API | [`api/openapi.yaml`](api/openapi.yaml) |
