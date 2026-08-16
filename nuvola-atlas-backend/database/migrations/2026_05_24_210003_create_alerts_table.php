<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alerts', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->enum('severity', ['high', 'medium', 'low']);
            $table->enum('kind', ['infra', 'vitality', 'esia', 'system', 'partner']);
            $table->string('title');
            $table->text('body');
            $table->string('zone_id')->nullable();
            $table->boolean('read')->default(false);
            $table->timestamps();

            $table->foreign('zone_id')->references('id')->on('zones')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};
