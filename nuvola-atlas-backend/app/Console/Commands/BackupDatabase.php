<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class BackupDatabase extends Command
{
    protected $signature = 'atlas:backup-database';

    protected $description = 'Create a PostgreSQL backup using pg_dump';

    public function handle(): int
    {
        $host = config('database.connections.pgsql.host');
        $port = config('database.connections.pgsql.port');
        $database = config('database.connections.pgsql.database');
        $username = config('database.connections.pgsql.username');

        $backupDir = storage_path('backups');
        if (! is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        $filename = sprintf('%s/%s_%s.sql', $backupDir, $database, Carbon::now()->format('Y-m-d_His'));

        $command = sprintf(
            'PGPASSWORD=%s pg_dump -h %s -p %s -U %s %s > %s',
            escapeshellarg(config('database.connections.pgsql.password')),
            escapeshellarg($host),
            escapeshellarg((string) $port),
            escapeshellarg($username),
            escapeshellarg($database),
            escapeshellarg($filename)
        );

        $result = null;
        $output = null;
        exec($command, $output, $result);

        if ($result !== 0) {
            $this->error('Backup failed. Ensure pg_dump is installed and accessible.');

            return self::FAILURE;
        }

        $this->info("Backup created: {$filename}");

        return self::SUCCESS;
    }
}
