<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Firm-scoped alert rules — automation trigger for watchlist zones.
 *
 * `direction`:
 *   'below'  → fires when zone.score drops below threshold
 *   'above'  → fires when zone.score rises above threshold
 *   'change' → fires when |delta| >= threshold since last fire
 *
 * A rule with no explicit `firm_id` is a platform-level rule (fires for
 * every subscriber). Rule ownership is scoped so investors only ever
 * see + edit their own rules.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alert_rules', function (Blueprint $table) {
            $table->id();
            $table->uuid('firm_id')->nullable();
            $table->string('zone_id');
            $table->string('direction', 8);
            $table->smallInteger('threshold_score');
            $table->smallInteger('last_score_seen')->nullable();
            $table->timestamp('last_fired_at')->nullable();
            $table->boolean('active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->foreign('firm_id')
                ->references('id')->on('firms')
                ->cascadeOnDelete();
            $table->foreign('zone_id')
                ->references('id')->on('zones')
                ->cascadeOnDelete();

            $table->index(['zone_id', 'active']);
            $table->index('firm_id');
        });

        DB::statement(<<<'SQL'
            ALTER TABLE alert_rules
            ADD CONSTRAINT alert_rules_direction_check
            CHECK (direction IN ('below', 'above', 'change'))
        SQL);
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE alert_rules DROP CONSTRAINT IF EXISTS alert_rules_direction_check');
        Schema::dropIfExists('alert_rules');
    }
};
