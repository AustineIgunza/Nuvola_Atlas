<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('zone_id');
            $table->string('agency');
            $table->enum('type', ['road', 'energy', 'grid']);
            $table->enum('status', ['active', 'stalled', 'planned']);
            $table->integer('progress');
            $table->string('budget');
            $table->date('started');
            $table->date('eta');
            $table->jsonb('milestones');
            $table->decimal('marker_lon', 10, 6);
            $table->decimal('marker_lat', 10, 6);
            $table->timestamps();

            $table->foreign('zone_id')->references('id')->on('zones')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
