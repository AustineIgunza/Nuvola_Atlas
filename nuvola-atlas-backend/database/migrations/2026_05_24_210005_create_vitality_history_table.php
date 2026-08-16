<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vitality_history', function (Blueprint $table) {
            $table->id();
            $table->string('month');
            $table->decimal('overall_avg', 5, 1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vitality_history');
    }
};
