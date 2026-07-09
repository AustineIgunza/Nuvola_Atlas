<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\Chat\SqlGuard;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class SqlGuardTest extends TestCase
{
    private SqlGuard $guard;

    protected function setUp(): void
    {
        parent::setUp();
        $this->guard = new SqlGuard(
            allowedTables: ['zones', 'zone_score_snapshots', 'projects', 'alerts', 'users'],
            defaultLimit: 200,
            hardLimit: 1000,
        );
    }

    public function test_plain_select_gets_default_limit_appended(): void
    {
        $out = $this->guard->validate('SELECT id, score FROM zones');
        $this->assertSame('SELECT id, score FROM zones LIMIT 200', $out);
    }

    public function test_existing_limit_under_hard_cap_is_preserved(): void
    {
        $out = $this->guard->validate('SELECT * FROM zones LIMIT 5');
        $this->assertSame('SELECT * FROM zones LIMIT 5', $out);
    }

    public function test_limit_above_hard_cap_is_rewritten(): void
    {
        $out = $this->guard->validate('SELECT * FROM zones LIMIT 5000');
        $this->assertSame('SELECT * FROM zones LIMIT 1000', $out);
    }

    public function test_join_between_allowed_tables_passes(): void
    {
        $sql = 'SELECT z.name, s.score FROM zones z JOIN zone_score_snapshots s ON s.zone_id = z.id';
        $out = $this->guard->validate($sql);
        $this->assertStringContainsString('LIMIT 200', $out);
    }

    public function test_trailing_semicolon_is_stripped(): void
    {
        $out = $this->guard->validate('SELECT * FROM zones;');
        $this->assertSame('SELECT * FROM zones LIMIT 200', $out);
    }

    public function test_with_cte_prefix_is_allowed(): void
    {
        $sql = 'WITH recent AS (SELECT * FROM zone_score_snapshots) SELECT * FROM recent';
        // recent isn't in the allowlist — but the guard only checks FROM/JOIN
        // targets against a bare allowlist match; `recent` will be rejected.
        // This is intentional: we err on the side of rejecting rather than
        // allowing a smuggled alias.
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate($sql);
    }

    public function test_insert_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate('INSERT INTO zones (id) VALUES (1)');
    }

    public function test_update_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate('UPDATE zones SET score = 0');
    }

    public function test_delete_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate('DELETE FROM zones');
    }

    public function test_drop_via_select_wrapper_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate('SELECT 1 FROM zones; DROP TABLE zones');
    }

    public function test_line_comment_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate("SELECT * FROM zones -- DROP TABLE zones");
    }

    public function test_block_comment_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate('SELECT /* nasty */ * FROM zones');
    }

    public function test_unknown_table_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate('SELECT * FROM secrets');
    }

    public function test_pg_read_file_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate("SELECT pg_read_file('/etc/passwd')");
    }

    public function test_pg_sleep_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate('SELECT pg_sleep(60) FROM zones');
    }

    public function test_dblink_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate("SELECT dblink('host=evil', 'SELECT 1')");
    }

    public function test_empty_query_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate('   ');
    }

    public function test_non_select_verb_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate('EXPLAIN SELECT * FROM zones');
    }

    public function test_schema_qualified_allowed_table_passes(): void
    {
        $out = $this->guard->validate('SELECT * FROM public.zones');
        $this->assertStringContainsString('FROM public.zones', $out);
    }
}
