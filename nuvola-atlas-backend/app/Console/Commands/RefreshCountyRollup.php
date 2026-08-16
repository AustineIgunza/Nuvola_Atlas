<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Overnight refresh of the pre-aggregated county rollup (Phase C).
 *
 * CONCURRENTLY keeps /vitality/county readable throughout the rebuild;
 * it needs the unique index created alongside the view and cannot run
 * inside a transaction, which is why this is a command rather than
 * something bolted onto RecalculateScores.
 */
class RefreshCountyRollup extends Command
{
    protected $signature = 'nuvola:refresh-county-rollup';

    protected $description = 'Rebuild the county_vitality_rollup materialized view.';

    public function handle(): int
    {
        DB::statement('REFRESH MATERIALIZED VIEW CONCURRENTLY county_vitality_rollup');

        $this->info('Refreshed county_vitality_rollup.');

        return self::SUCCESS;
    }
}
