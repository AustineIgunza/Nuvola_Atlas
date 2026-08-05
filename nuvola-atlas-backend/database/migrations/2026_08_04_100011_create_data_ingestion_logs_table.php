<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase B intake — append-only log of every /ingest hit.
 *
 * `source` is the caller's identity (e.g. `fastapi.daystar`), `payload`
 * jsonb stores the raw incoming envelope, `accepted` records whether
 * ScoreCalculator was dispatched. `error` captures parse/validation
 * failures so an ops runbook can grep on it without pulling logs.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_ingestion_logs', function (Blueprint $table) {
            $table->id();
            $table->string('source', 96);
            $table->string('zone_id')->nullable();
            $table->jsonb('payload');
            $table->boolean('accepted')->default(false);
            $table->smallInteger('indicators_updated')->default(0);
            $table->text('error')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamp('received_at')->useCurrent();
            $table->timestamps();

            $table->foreign('zone_id')
                ->references('id')->on('zones')
                ->nullOnDelete();

            $table->index(['source', 'received_at']);
            $table->index('accepted');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('data_ingestion_logs');
    }
};
