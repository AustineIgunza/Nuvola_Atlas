<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Support\Pillars;
use InvalidArgumentException;

/**
 * Maps a pillar-keyed array onto the `pillar_*` columns on `zones` and
 * `zone_score_snapshots`, so no test has to spell a column name out.
 *
 * Seeding a pillar the registry doesn't declare live throws rather than
 * silently writing nothing — a test that still seeds `safety` should fail
 * loudly, not quietly assert against a column full of nulls.
 */
final class PillarSeeding
{
    /**
     * @param  array<string, ?int>  $pillars
     * @return array<string, ?int>
     */
    public static function columns(array $pillars): array
    {
        $out = [];
        foreach ($pillars as $key => $value) {
            if (! Pillars::exists($key)) {
                throw new InvalidArgumentException("'{$key}' is not a live pillar.");
            }
            $out[Pillars::column($key)] = $value;
        }

        return $out;
    }

    /** @return list<string> every live pillar column, in registry order */
    public static function allColumns(): array
    {
        return array_map(Pillars::column(...), Pillars::keys());
    }
}
