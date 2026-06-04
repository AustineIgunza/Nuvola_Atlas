<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            // e.g. "report.created", "alert.bulk_read", "auth.sign_in"
            $table->string('action', 64);
            $table->string('resource_type', 64)->nullable();
            $table->string('resource_id', 64)->nullable();
            $table->jsonb('before')->nullable();
            $table->jsonb('after')->nullable();
            $table->ipAddress('ip')->nullable();
            $table->string('user_agent', 512)->nullable();
            // created_at only — audit rows are append-only; we never update them.
            $table->timestamp('created_at')->useCurrent();

            $table->index(['actor_id', 'created_at']);
            $table->index(['resource_type', 'resource_id']);
            $table->index('action');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
