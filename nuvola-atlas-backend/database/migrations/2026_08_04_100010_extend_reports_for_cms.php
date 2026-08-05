<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase E migration 10 of 10 — reports gain authorship + firm scope.
 *
 * `firm_scope_id` powers the /investor/brief LP-style PDF: a report can
 * be scoped to a specific firm, so an Acumen brief is invisible to a GCF
 * investor even if both accounts hit /reports.
 *
 * `published_at` gates draft vs. published; a null value means the report
 * is a draft and only visible to its author + admins.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->after('id')->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->after('created_by')->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable()->after('updated_by');
            $table->uuid('firm_scope_id')->nullable()->after('published_at');

            $table->foreign('firm_scope_id')
                ->references('id')->on('firms')
                ->nullOnDelete();

            $table->index('firm_scope_id');
            $table->index('published_at');
        });
    }

    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropForeign(['firm_scope_id']);
            $table->dropForeign(['created_by']);
            $table->dropForeign(['updated_by']);
            $table->dropIndex(['firm_scope_id']);
            $table->dropIndex(['published_at']);
            $table->dropColumn(['created_by', 'updated_by', 'published_at', 'firm_scope_id']);
        });
    }
};
