<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Schedule;

Schedule::command('atlas:sync-history')->monthly();
Schedule::command('atlas:recalculate-scores')->hourly();
