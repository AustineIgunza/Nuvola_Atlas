<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title', 120)->nullable();
            $table->string('zone_id')->nullable();
            $table->timestamps();

            $table->foreign('zone_id')
                ->references('id')->on('zones')
                ->nullOnDelete();

            $table->index(['user_id', 'updated_at'], 'chat_conversations_user_time_idx');
        });

        Schema::create('chat_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('conversation_id');
            $table->string('role', 16); // user | assistant | system
            $table->text('content');
            $table->string('intent', 32)->nullable();
            $table->text('generated_sql')->nullable();
            $table->jsonb('result_rows')->nullable();
            $table->smallInteger('tokens_in')->nullable();
            $table->smallInteger('tokens_out')->nullable();
            $table->integer('latency_ms')->nullable();
            $table->timestamps();

            $table->foreign('conversation_id')
                ->references('id')->on('chat_conversations')
                ->cascadeOnDelete();

            $table->index(['conversation_id', 'created_at'], 'chat_messages_conv_time_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_conversations');
    }
};
