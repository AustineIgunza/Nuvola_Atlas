<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * RLS scaffold for todo §9.7.
 *
 * Adds the first partner-scoped table (`partner_dataset_overlays`) protected
 * by PostgreSQL Row-Level Security. The pattern here generalises: any future
 * partner-scoped table gets the same ENABLE + FORCE + per-action policy.
 *
 * The `app.current_partner_id` session var is set by SetPartnerContext
 * middleware on every authenticated request. `current_setting(..., true)`
 * returns NULL when unset (rather than raising), which makes the policy's
 * `partner_id = NULL` comparison NULL → no rows visible. That's the safe
 * default: unscoped queries see nothing.
 *
 * Important: RLS only bites when the app connects as a non-superuser AND
 * non-BYPASSRLS role. The Supabase default `postgres` role IS the owner and
 * bypasses RLS unless we FORCE it — that's what the FORCE statement below
 * does. For full defence-in-depth, create a dedicated `nuvola_app` role and
 * point DB_USERNAME at it (see docs/ops/deploy.md).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partners', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug', 64)->unique();
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('partner_id')
                ->nullable()
                ->after('role')
                ->constrained('partners')
                ->nullOnDelete();
        });

        Schema::create('partner_dataset_overlays', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained('partners')->cascadeOnDelete();
            $table->string('name');
            $table->jsonb('payload')->default(DB::raw("'{}'::jsonb"));
            $table->timestamps();

            $table->index(['partner_id', 'name']);
        });

        // ── Enable + FORCE row-level security, then declare the policy. ──
        // The FORCE clause makes the policy apply even to the table owner —
        // without it, the Supabase `postgres` role would silently bypass RLS.
        DB::statement('ALTER TABLE partner_dataset_overlays ENABLE ROW LEVEL SECURITY');
        DB::statement('ALTER TABLE partner_dataset_overlays FORCE ROW LEVEL SECURITY');

        // One policy for all commands — the partner_id comparison gates both
        // reads (USING) and writes (WITH CHECK). NULLIF strips empty strings
        // so an unset session var collapses to NULL rather than failing the
        // cast.
        DB::statement(<<<'SQL'
            CREATE POLICY partner_isolation
                ON partner_dataset_overlays
                FOR ALL
                USING      (partner_id = NULLIF(current_setting('app.current_partner_id', true), '')::bigint)
                WITH CHECK (partner_id = NULLIF(current_setting('app.current_partner_id', true), '')::bigint)
        SQL);
    }

    public function down(): void
    {
        DB::statement('DROP POLICY IF EXISTS partner_isolation ON partner_dataset_overlays');
        Schema::dropIfExists('partner_dataset_overlays');

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['partner_id']);
            $table->dropColumn('partner_id');
        });

        Schema::dropIfExists('partners');
    }
};
