<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * `road_progress` and `smart_grid` were named for what the platform hoped to
 * track — construction milestones and grid telemetry — not for what it can
 * actually measure. Neither feed exists. What does exist is road density from
 * OSM and electricity access from the census, so the layers are renamed to
 * the thing being drawn.
 *
 * Laravel's `enum()` is a varchar plus a CHECK constraint on Postgres, so the
 * rename is a constraint swap around an UPDATE rather than an ALTER TYPE.
 */
return new class extends Migration
{
    private const RENAMES = [
        'road_progress' => 'road_density',
        'smart_grid' => 'electricity_access',
    ];

    public function up(): void
    {
        $this->rename(self::RENAMES, ['road_density', 'electricity_access', 'density']);
    }

    public function down(): void
    {
        $this->rename(array_flip(self::RENAMES), ['road_progress', 'smart_grid', 'density']);
    }

    /**
     * @param  array<string, string>  $renames
     * @param  array<int, string>  $allowed
     */
    private function rename(array $renames, array $allowed): void
    {
        DB::statement('ALTER TABLE zone_layers DROP CONSTRAINT IF EXISTS zone_layers_layer_type_check');

        foreach ($renames as $from => $to) {
            DB::table('zone_layers')->where('layer_type', $from)->update(['layer_type' => $to]);
        }

        $list = implode(', ', array_map(fn (string $v) => "'{$v}'", $allowed));
        DB::statement("ALTER TABLE zone_layers ADD CONSTRAINT zone_layers_layer_type_check CHECK (layer_type::text = ANY (ARRAY[{$list}]::text[]))");
    }
};
