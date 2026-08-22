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
        // Mirrors config/ai.php. `users` is deliberately absent: the chat
        // pipeline has no route to personal data by design.
        $this->guard = new SqlGuard(
            allowedTables: ['zones', 'zone_score_snapshots', 'projects', 'alerts', 'chat_user_stats'],
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

    public function test_limit_inside_a_subquery_does_not_bound_the_outer_query(): void
    {
        $out = $this->guard->validate('SELECT * FROM (SELECT * FROM zones LIMIT 5) t');
        $this->assertSame('SELECT * FROM (SELECT * FROM zones LIMIT 5) t LIMIT 200', $out);
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
        $this->guard->validate('SELECT * FROM zones -- DROP TABLE zones');
    }

    public function test_block_comment_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate('SELECT /* nasty */ * FROM zones');
    }

    public function test_nested_block_comment_is_rejected(): void
    {
        // A lexer that stops at the first close marker would read
        // `zones */` as live SQL and miss the comment wrapping it.
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate('SELECT * FROM /* a /* b */ zones */ alerts');
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

    // --- Reaching a table the allowlist does not name -------------------
    //
    // The FROM/JOIN regex this guard replaced saw only the first token
    // after each FROM. Every case below walked straight past it.

    public function test_comma_join_to_a_disallowed_table_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate('SELECT * FROM zones, users');
    }

    public function test_comma_join_between_allowed_tables_passes(): void
    {
        $out = $this->guard->validate('SELECT z.id, p.id FROM zones z, projects p');
        $this->assertStringContainsString('LIMIT 200', $out);
    }

    public function test_subquery_to_a_disallowed_table_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate('SELECT * FROM zones WHERE id IN (SELECT id FROM users)');
    }

    public function test_derived_table_on_a_disallowed_table_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate('SELECT * FROM (SELECT email FROM users) AS leak');
    }

    public function test_scalar_subquery_in_the_select_list_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate('SELECT (SELECT password FROM users LIMIT 1) AS p FROM zones');
    }

    public function test_union_to_a_disallowed_table_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate('SELECT name FROM zones UNION SELECT email FROM users');
    }

    public function test_cte_reading_a_disallowed_table_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate('WITH leak AS (SELECT email FROM users) SELECT * FROM leak');
    }

    public function test_quoted_identifier_for_a_disallowed_table_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate('SELECT * FROM "users"');
    }

    public function test_set_returning_function_as_a_table_source_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->guard->validate('SELECT * FROM generate_series(1, 10)');
    }

    // --- Queries that are fine and used to be rejected -------------------
    //
    // Regexes over raw SQL cannot see that these bytes are inside a string
    // literal, a CTE binding, or a function's argument list.

    public function test_cte_over_an_allowed_table_passes(): void
    {
        $sql = 'WITH recent AS (SELECT * FROM zone_score_snapshots) SELECT * FROM recent';
        $out = $this->guard->validate($sql);
        $this->assertSame($sql.' LIMIT 200', $out);
    }

    public function test_multiple_ctes_pass(): void
    {
        $sql = 'WITH a AS (SELECT id FROM zones), b AS (SELECT id FROM projects) '
            .'SELECT a.id FROM a JOIN b ON b.id = a.id';
        $out = $this->guard->validate($sql);
        $this->assertStringContainsString('LIMIT 200', $out);
    }

    public function test_semicolon_inside_a_string_literal_is_not_a_second_statement(): void
    {
        $sql = "SELECT * FROM zones WHERE name = 'Embakasi; East'";
        $this->assertSame($sql.' LIMIT 200', $this->guard->validate($sql));
    }

    public function test_comment_marker_inside_a_string_literal_is_not_a_comment(): void
    {
        $sql = "SELECT * FROM zones WHERE name = 'Nairobi -- Central'";
        $this->assertSame($sql.' LIMIT 200', $this->guard->validate($sql));
    }

    public function test_denied_keyword_inside_a_string_literal_is_not_a_write(): void
    {
        $sql = "SELECT title FROM alerts WHERE title ILIKE '%update%'";
        $this->assertSame($sql.' LIMIT 200', $this->guard->validate($sql));
    }

    public function test_doubled_quote_inside_a_string_literal_is_handled(): void
    {
        $sql = "SELECT * FROM zones WHERE name = 'Nairobi''s core'";
        $this->assertSame($sql.' LIMIT 200', $this->guard->validate($sql));
    }

    public function test_extract_from_is_not_read_as_a_from_clause(): void
    {
        $sql = 'SELECT EXTRACT(YEAR FROM captured_at) AS y FROM zone_score_snapshots';
        $this->assertSame($sql.' LIMIT 200', $this->guard->validate($sql));
    }

    public function test_postgis_and_jsonb_operators_survive(): void
    {
        $sql = 'SELECT id, ST_AsGeoJSON(centroid::geometry) AS g, milestones->>0 AS m FROM projects';
        $this->assertSame($sql.' LIMIT 200', $this->guard->validate($sql));
    }
}
