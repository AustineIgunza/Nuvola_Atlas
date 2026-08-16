<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('title');
            $table->string('zone_id')->nullable();
            $table->date('date');
            $table->enum('status', ['published', 'review', 'draft']);
            $table->string('author');
            $table->integer('size_bytes');
            $table->string('format')->default('PDF');
            $table->timestamps();

            $table->foreign('zone_id')->references('id')->on('zones')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
