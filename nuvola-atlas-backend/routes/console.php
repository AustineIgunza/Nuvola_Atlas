<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Schedule;

Schedule::command('atlas:sync-history')->monthly();
Schedule::command('atlas:recalculate-scores')->hourly();
Schedule::command('atlas:backup-database')->daily()->at('02:00');

// §9.13 — Daily nudge for admins still missing 2FA; escalates to an
// account lock + token revocation 7 days after the first reminder.
Schedule::command('nuvola:remind-admin-2fa')->dailyAt('09:00');

// Automation — nightly scan of data_feed_status; emits a single system
// alert per overdue/missing feed (dedup vs 24h so we don't spam).
Schedule::command('nuvola:alert-stale-feeds')->dailyAt('02:30');

// Weekly pre-generation of LP-style firm briefs so /investor/brief hits
// a warm PDF instead of re-rendering. Runs at Sunday 03:15 UTC (06:15 EAT).
Schedule::command('nuvola:pregen-firm-briefs')->weeklyOn(0, '03:15');

// Phase C — overnight rebuild of the pre-aggregated county rollup, then
// the 30-day raw-payload retention sweep.
Schedule::command('nuvola:refresh-county-rollup')->dailyAt('03:00');
Schedule::command('nuvola:prune-ingestion-payloads')->dailyAt('03:45');
