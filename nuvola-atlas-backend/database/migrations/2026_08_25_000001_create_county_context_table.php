<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * P9 §Task 1 — county-level indicator readings that must never render on a
 * sub-county bubble. This is the backend counterpart to
 * `pipeline.emit.build_geojson`'s `county_context` payload; a WASREB
 * utility figure like NCWSC's 48% non-revenue water lives here, not on a
 * zone.
 *
 * Two DB-level guards mirror the pipeline invariants:
 *   R1  method='gap' => value IS NULL           (never a zero for a hole)
 *   P9  granularity  IN ('county','utility','national')  — 'subcounty'
 *       rejected here even if a bad UPDATE reaches the table.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('county_context', function (Blueprint $table) {
            $table->id();
            $table->string('county', 64);
            $table->string('pillar_key', 64);
            $table->string('indicator_key', 64);
            $table->double('value')->nullable();
            $table->string('unit', 16);
            $table->string('granularity', 16);
            $table->string('method', 16);
            $table->string('source_id', 64)->nullable();
            $table->string('vintage', 32)->nullable();
            $table->date('retrieved');
            $table->string('extraction_confidence', 8)->nullable();
            $table->string('page_ref', 32)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(
                ['county', 'indicator_key', 'vintage'],
                'county_context_county_indicator_vintage_unique'
            );
            $table->index(['county', 'pillar_key']);
        });

        // Sub-county values belong on the zone, not here. This is the same
        // rule enforced in pipeline.emit._validate_county_context; the DB
        // check is a belt on top of the app-layer braces.
        DB::statement(<<<'SQL'
            ALTER TABLE county_context
            ADD CONSTRAINT county_context_granularity_not_subcounty
            CHECK (granularity IN ('county', 'utility', 'national'))
        SQL);

        // R1: a gap is a null, never a zero. Enforced in ProvenanceValue,
        // enforced in emit, enforced here. Three layers because a single
        // bad UPDATE can otherwise publish a fabricated number.
        DB::statement(<<<'SQL'
            ALTER TABLE county_context
            ADD CONSTRAINT county_context_gap_value_is_null
            CHECK (method <> 'gap' OR value IS NULL)
        SQL);

        // Symmetric: a measured / imputed / proxy reading needs receipts.
        DB::statement(<<<'SQL'
            ALTER TABLE county_context
            ADD CONSTRAINT county_context_non_gap_needs_source_and_vintage
            CHECK (method = 'gap' OR (source_id IS NOT NULL AND vintage IS NOT NULL))
        SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('county_context');
    }
};
