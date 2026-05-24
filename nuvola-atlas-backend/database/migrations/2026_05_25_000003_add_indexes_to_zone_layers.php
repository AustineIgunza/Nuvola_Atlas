<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE INDEX zone_layers_geojson_gin ON zone_layers USING GIN (geojson)');
        DB::statement('CREATE INDEX zones_boundary_gist ON zones USING GIST (boundary)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS zone_layers_geojson_gin');
        DB::statement('DROP INDEX IF EXISTS zones_boundary_gist');
    }
};
