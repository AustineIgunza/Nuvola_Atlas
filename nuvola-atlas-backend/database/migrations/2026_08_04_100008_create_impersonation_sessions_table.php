<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase E migration 8 of 10 — auditable admin impersonation.
 *
 * `reason` is required so an admin cannot silently switch identity; the
 * /admin/impersonate route rejects empty strings with 422. `ended_at`
 * nullable so an open session is discoverable — the /admin/impersonate
 * DELETE ends it. No composite unique so an admin can legitimately
 * impersonate the same user twice.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('impersonation_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('target_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('reason');
            $table->string('ip', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->index(['admin_user_id', 'started_at']);
            $table->index(['target_user_id', 'started_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('impersonation_sessions');
    }
};
