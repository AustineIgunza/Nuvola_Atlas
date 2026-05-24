<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zones', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->integer('score');
            $table->integer('pillar_social');
            $table->integer('pillar_safety');
            $table->integer('pillar_density');
            $table->integer('pillar_infra');
            $table->integer('delta_social');
            $table->integer('delta_safety');
            $table->integer('delta_density');
            $table->integer('delta_infra');
            $table->integer('last_sync_min');
            $table->timestamps();
        });

        DB::statement('ALTER TABLE zones ADD COLUMN centroid geography(Point, 4326)');
    }

    public function down(): void
    {
        Schema::dropIfExists('zones');
    }
};
