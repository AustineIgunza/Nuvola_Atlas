<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Schedule;

Schedule::command('atlas:sync-history')->monthly();
Schedule::command('atlas:recalculate-scores')->hourly();
Schedule::command('atlas:backup-database')->daily()->at('02:00');

// §9.13 — Daily nudge for admins still missing 2FA; escalates to an
// account lock + token revocation 7 days after the first reminder.
Schedule::command('nuvola:remind-admin-2fa')->dailyAt('09:00');
