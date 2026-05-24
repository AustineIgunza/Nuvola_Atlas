<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('zone_layers', function (Blueprint $table) {
            $table->id();
            $table->string('zone_id');
            $table->enum('layer_type', ['road_progress', 'smart_grid', 'density']);
            $table->jsonb('geojson');
            $table->timestamps();

            $table->foreign('zone_id')->references('id')->on('zones')->onDelete('cascade');
            $table->unique(['zone_id', 'layer_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('zone_layers');
    }
};
