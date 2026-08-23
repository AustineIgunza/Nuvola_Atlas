<?php

declare(strict_types=1);

namespace App\Services\Chat;

use App\Support\Pillars;
use Illuminate\Support\Facades\Cache;

/**
 * Terse markdown description of the tables the LLM is allowed to see. This
 * is the whole grounding surface — no vector store, no embeddings. Cached
 * forever because the schema only changes when we ship migrations, and
 * migrations clear the cache manually if needed.
 */
class SchemaCatalog
{
    // Bump on every content change — the catalog is remembered forever, so a
    // stale key would keep serving `users` to the model after it was revoked,
    // or keep describing a pillar that has since been switched off.
    private const CACHE_KEY = 'chat.schema-catalog.v4';

    public function forPrompt(): string
    {
        return Cache::rememberForever(
            self::CACHE_KEY.'.'.Pillars::version(),
            fn () => $this->build(),
        );
    }

    private function build(): string
    {
        $pillarLines = '';
        foreach (Pillars::all() as $pillar) {
            $pillarLines .= sprintf(
                "\n  %s — %s (%s, %s, %s)",
                Pillars::column($pillar['key']),
                $pillar['display_name'],
                $pillar['status'],
                $pillar['source_id'] ?? 'no source',
                $pillar['vintage'] ?? 'no vintage',
            );
        }
        $count = count(Pillars::keys());

        return <<<MD
You are Navuuna's data assistant. You answer questions by writing Postgres SELECT queries against these tables ONLY:

## zones
Current Vitality Score per Nairobi sub-county (17 zones).
- id (string PK, e.g. "westlands", "kibra")
- name (string)
- score (int 0-100)                     ← overall Vitality Score
- centroid geography(Point,4326)
- last_sync_min (int, minutes since last data refresh)
- created_at, updated_at

  {$count} pillar columns (each smallint 0-100, nullable when awaiting data —
  NULL is NOT zero, exclude nulls from averages). Each pillar is ONE measured
  figure, not an average of sub-indicators:{$pillarLines}

  Composite score = weighted mean of the pillars that have a value, with the
  weights renormalized across exactly those pillars. A pillar marked "held"
  carries zero weight — report its value with the vintage above, and say the
  vintage out loud.

  The thirteen indicator_* columns are retired. They still physically exist but
  are no longer written or read. Never select them, and never describe a pillar
  as an average of indicators.

## zone_score_snapshots
Time-series of vitality scores, one row per zone per hourly recalc.
- id (bigint PK)
- zone_id (FK zones.id)
- captured_at (timestamp)
- score (smallint 0-100)
- Same pillar_* columns as zones (nullable smallint 0-100).

## zone_layers
GeoJSON infrastructure layers per zone.
- id, zone_id, layer_type (string: road_density | electricity_access | density | water), geojson (jsonb)

## projects
Infrastructure projects (roads/energy/grid/water).
- id (string PK), name, zone_id, agency, type (road|energy|grid|water),
  status (active|stalled|planned), progress (int 0-100), budget, started (date),
  eta (date), milestones (jsonb), marker (geography Point)

## alerts
Active alerts flagged by monitoring feeds.
- id, severity (high|medium|low), kind (infra|vitality|esia|system|partner),
  title, body, zone_id (nullable), created_at, read (bool),
  impact_level (critical|major|moderate|minor)

## reports
Published zone/vitality reports.
- id, title, zone_id (nullable), date, status (published|review|draft),
  author, size_bytes, format, type, priority

## activities
Recent activity feed per zone.
- id, zone_id, kind (road|grid|esia|density|water), text, source, created_at

## vitality_history
Platform-wide monthly average score.
- id, month (string "Jun '25"), overall_avg (numeric 5,1)

## chat_user_stats
Non-identifying view over accounts. There is no route to a name, an email or a
credential from here, by design.
- id (bigint), role (viewer|partner|investor|editor|admin), created_at

## Rules
1. Every query MUST be a single SELECT. No INSERT/UPDATE/DELETE/DDL — those will be rejected.
2. Include a LIMIT clause. Default cap is 200; hard cap is 1000.
3. Never reference tables outside this catalog. `users` is NOT in it and never
   will be — if asked for emails, names, passwords or any personal detail of an
   account, refuse and say the assistant has no access to personal data.
4. For time-series questions, prefer `zone_score_snapshots` over `zones` (which only has the latest).
5. For "compare" questions, return rows keyed on zone_id / name so the client can chart them.
6. Return concise columns — the frontend renders charts, it doesn't need a hundred columns.
MD;
    }
}
