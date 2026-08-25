<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * P9 §Task 2 — the staleness ledger needs to record what vintage a feed
 * carries and at what granularity. Without them the /admin/feeds view
 * would render WASREB's annual FY2023/24 delivery as an overdue hourly
 * feed. Both columns are nullable — legacy pilot-zone rows do not have a
 * vintage, and adding one to those synthetic rows would be fiction.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('data_feed_status', function (Blueprint $table) {
            $table->string('vintage', 32)->nullable()->after('source_system');
            $table->string('granularity', 16)->nullable()->after('vintage');
        });
    }

    public function down(): void
    {
        Schema::table('data_feed_status', function (Blueprint $table) {
            $table->dropColumn(['vintage', 'granularity']);
        });
    }
};
