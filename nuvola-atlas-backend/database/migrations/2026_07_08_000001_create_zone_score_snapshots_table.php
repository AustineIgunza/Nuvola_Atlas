<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zone_score_snapshots', function (Blueprint $table) {
            $table->id();
            $table->string('zone_id');
            $table->timestamp('captured_at')->useCurrent();
            $table->smallInteger('score');
            $table->smallInteger('pillar_social');
            $table->smallInteger('pillar_safety');
            $table->smallInteger('pillar_density');
            $table->smallInteger('pillar_infra');
            $table->timestamps();

            $table->foreign('zone_id')
                ->references('id')->on('zones')
                ->cascadeOnDelete();

            $table->index(['zone_id', 'captured_at'], 'zone_score_snapshots_zone_time_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('zone_score_snapshots');
    }
};
