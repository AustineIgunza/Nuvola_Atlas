<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Provenance of a zone's score — where the contributing pillar values
 * originally came from. The fixture gate (P7.3 in
 * NAVUUNA_PROMPTS_ROUND2.md) makes this a first-class attribute of every
 * score so a demo number can never masquerade as measurement.
 *
 * The values live on the ``zones`` and ``zone_score_snapshots`` tables.
 * They also travel on every zone API response so the frontend can render
 * a "Demo data" treatment without having to trace the number back to
 * its source.
 *
 * The failure mode this exists to prevent: publishing a low score for
 * Kibra or Mathare computed from seeded fixtures. That is defamation-
 * adjacent and burns the communities the platform depends on.
 */
final class DataProvenance
{
    /**
     * Every contributing pillar value traces to a real ingested feed. Only
     * these zones may be exported or listed publicly without a role gate.
     */
    public const MEASURED = 'measured';

    /**
     * Every contributing pillar value traces to a seeder or fixture. Never
     * exported, never publicly listed.
     */
    public const FIXTURE = 'fixture';

    /**
     * At least one measured pillar and at least one fixture pillar. Treated
     * the same as ``fixture`` for gating purposes — mixing invented and
     * measured numbers under a single composite is the exact case R2 §P7.3
     * forbids from any public output.
     */
    public const MIXED = 'mixed';

    public const ALL = [self::MEASURED, self::FIXTURE, self::MIXED];

    /**
     * Composite provenance from a set of per-pillar sources.
     *
     * @param  array<string, string|null>  $pillarSources  pillar_key => 'measured'|'fixture'|null
     */
    public static function fromPillarSources(array $pillarSources): string
    {
        $seen = [];
        foreach ($pillarSources as $source) {
            if ($source === self::MEASURED || $source === self::FIXTURE) {
                $seen[$source] = true;
            }
        }

        if ($seen === []) {
            // No contributing pillars at all → nothing to demo, nothing to
            // measure. Reported as fixture so a zone with all-null pillars
            // still fails the export gate rather than sneaking through.
            return self::FIXTURE;
        }

        if (count($seen) === 1) {
            return array_key_first($seen);
        }

        return self::MIXED;
    }

    /**
     * True when a value with this provenance may leave the system through
     * exports, public API listings, or the public GeoJSON.
     */
    public static function isPublishable(?string $provenance): bool
    {
        return $provenance === self::MEASURED;
    }

    /**
     * True when the value is demo/fixture and must be visually flagged.
     * Inverse of ``isPublishable`` today; kept as its own method so callers
     * declare intent (flagging demo data is different from filtering it out).
     */
    public static function isDemo(?string $provenance): bool
    {
        return $provenance !== null && $provenance !== self::MEASURED;
    }
}
