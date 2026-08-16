<?php

declare(strict_types=1);

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\ConfigurationUrlParser;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    private const LOCAL_DB_HOSTS = ['127.0.0.1', 'localhost', '::1'];

    protected function refreshApplication()
    {
        parent::refreshApplication();

        $this->assertDatabaseIsLocal();

        return $this;
    }

    /**
     * RefreshDatabase runs migrate:fresh, which drops every table on whatever
     * host the app resolves. phpunit.xml forces a local Postgres, but a present
     * bootstrap/cache/config.php silently beats it: LoadEnvironmentVariables
     * returns early when the config is cached, so the forced vars are never
     * read and a developer's Supabase host wins. Refuse to run instead.
     */
    private function assertDatabaseIsLocal(): void
    {
        if ($this->app->configurationIsCached()) {
            throw new RuntimeException(
                'Config is cached, so phpunit.xml database overrides are ignored. '
                .'Run `php artisan config:clear` before testing.'
            );
        }

        $connection = config('database.default');

        // Read the host the way DatabaseManager does: a DB_URL, if set, is
        // parsed into host/port at connect time and beats the `host` key.
        $host = (new ConfigurationUrlParser)
            ->parseConfiguration(config("database.connections.{$connection}"))['host'] ?? null;

        if (! in_array($host, self::LOCAL_DB_HOSTS, true)) {
            throw new RuntimeException(
                "Refusing to run tests against non-local database host [{$host}]. "
                .'Tests drop every table; they may only target the local docker Postgres.'
            );
        }
    }
}
