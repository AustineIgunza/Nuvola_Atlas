<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE zones ADD COLUMN boundary geography(Polygon, 4326)');
    }

    public function down(): void
    {
        Schema::table('zones', function ($table) {
            $table->dropColumn('boundary');
        });
    }
};
