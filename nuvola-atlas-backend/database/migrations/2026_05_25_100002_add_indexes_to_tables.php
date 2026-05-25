<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->index('zone_id');
            $table->index('status');
        });

        Schema::table('alerts', function (Blueprint $table) {
            $table->index('zone_id');
            $table->index('read');
            $table->index('severity');
        });

        Schema::table('reports', function (Blueprint $table) {
            $table->index('zone_id');
            $table->index('status');
        });

        Schema::table('activities', function (Blueprint $table) {
            $table->index('zone_id');
        });

        Schema::table('zones', function (Blueprint $table) {
            $table->index('score');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropIndex(['zone_id']);
            $table->dropIndex(['status']);
        });

        Schema::table('alerts', function (Blueprint $table) {
            $table->dropIndex(['zone_id']);
            $table->dropIndex(['read']);
            $table->dropIndex(['severity']);
        });

        Schema::table('reports', function (Blueprint $table) {
            $table->dropIndex(['zone_id']);
            $table->dropIndex(['status']);
        });

        Schema::table('activities', function (Blueprint $table) {
            $table->dropIndex(['zone_id']);
        });

        Schema::table('zones', function (Blueprint $table) {
            $table->dropIndex(['score']);
        });
    }
};
