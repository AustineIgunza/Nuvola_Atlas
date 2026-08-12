<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('data_ingestion_logs', function (Blueprint $table) {
            $table->id();
            $table->string('source', 96);
            $table->string('zone_id')->nullable();
            $table->string('payload_hash', 64)->nullable()->unique();
            $table->jsonb('payload')->nullable();
            $table->boolean('accepted')->default(false);
            $table->smallInteger('indicators_updated')->default(0);
            $table->text('error')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamp('received_at')->useCurrent();
            $table->timestamp('arrived_at')->useCurrent();
            $table->boolean('verified_by_field')->default(false);
            $table->string('status', 32)->default('applied');
            $table->jsonb('error_reasons')->nullable();
            $table->integer('zone_count')->nullable();
            $table->integer('indicator_count')->nullable();
            $table->timestamps();

            $table->foreign('zone_id')
                ->references('id')->on('zones')
                ->nullOnDelete();

            $table->index(['source', 'received_at']);
            $table->index('status');
            $table->index('accepted');
        });

        // Raw SQL for database-level append-only enforcement via trigger
        if (DB::getDriverName() === 'pgsql') {
            DB::unprepared("
                CREATE OR REPLACE FUNCTION enforce_logs_append_only()
                RETURNS TRIGGER AS \$\$
                BEGIN
                    RAISE EXCEPTION 'data_ingestion_logs table is append-only.';
                END;
                \$\$ LANGUAGE plpgsql;

                DROP TRIGGER IF EXISTS trigger_logs_append_only ON data_ingestion_logs;
                CREATE TRIGGER trigger_logs_append_only
                BEFORE UPDATE OR DELETE ON data_ingestion_logs
                FOR EACH ROW EXECUTE FUNCTION enforce_logs_append_only();
            ");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::unprepared("
                DROP TRIGGER IF EXISTS trigger_logs_append_only ON data_ingestion_logs;
                DROP FUNCTION IF EXISTS enforce_logs_append_only();
            ");
        }

        Schema::dropIfExists('data_ingestion_logs');
    }
};
