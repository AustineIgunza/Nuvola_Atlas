<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase E migration 9 of 10 — content CMS backing store.
 *
 * `content_blocks.key` is the natural PK — CMS entries are addressed by
 * a stable string key (e.g. `investor.brief.methodology`) rather than an
 * auto-increment id. Every save writes an immutable snapshot to
 * `content_block_revisions` — ContentBlockService (Khillon Week 4) owns
 * that write path.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_blocks', function (Blueprint $table) {
            $table->string('key', 128)->primary();
            $table->text('body');
            $table->timestamps();
        });

        Schema::create('content_block_revisions', function (Blueprint $table) {
            $table->id();
            $table->string('content_block_key', 128);
            $table->text('body_snapshot');
            $table->foreignId('edited_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('edited_at')->useCurrent();
            $table->timestamps();

            $table->foreign('content_block_key')
                ->references('key')->on('content_blocks')
                ->cascadeOnDelete();

            $table->index(['content_block_key', 'edited_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_block_revisions');
        Schema::dropIfExists('content_blocks');
    }
};
