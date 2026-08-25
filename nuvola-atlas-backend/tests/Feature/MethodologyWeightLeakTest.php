<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Support\Pillars;
use Tests\TestCase;

/**
 * P8 trade-secret boundary — pillar-level weights (0.4/0.3/0.3/0 today)
 * are public in the Platform Overview and may appear in API responses.
 * Sub-indicator weights and the null-exclusion algorithm internals must
 * NEVER appear in any API response, GeoJSON property, or public file.
 *
 * The current 4-pillar model has no sub-indicators, so this test guards
 * the SHAPE of the endpoint against a future accidental leak — a new
 * indicator layer added to config/methodology.php must not automatically
 * expose its weight vector.
 *
 * If this test fails after a methodology change, the fix is not to relax
 * the assertion — it is to strip the leaking key from the resource / the
 * export before it reaches the client.
 */
class MethodologyWeightLeakTest extends TestCase
{
    /**
     * The exhaustive allowlist of top-level keys the /vitality/methodology
     * response may carry. Adding a new key here requires a written
     * decision — see NAVUUNA_PROMPTS_ROUND2.md §P8 for the boundary.
     */
    private const ALLOWED_TOP_LEVEL_KEYS = ['version', 'pillars', 'weights'];

    /**
     * Keys we never want to see under any nesting level. Named literally
     * because a sub-indicator weight cannot be recognised structurally —
     * it looks like every other {string: float} map.
     */
    private const FORBIDDEN_KEY_PATTERNS = [
        'sub_weights',
        'sub_indicator_weights',
        'indicator_weights',
        'null_exclusion',
        'nullExclusion',
        'null_penalty',
    ];

    public function test_methodology_endpoint_returns_only_the_allowlisted_top_level_keys(): void
    {
        $body = $this->getJson('/api/v1/vitality/methodology')
            ->assertOk()
            ->json();

        $unexpected = array_diff(array_keys($body), self::ALLOWED_TOP_LEVEL_KEYS);
        $this->assertSame(
            [],
            $unexpected,
            'methodology response added a top-level key: '.implode(', ', $unexpected).
            '. If this is intentional, add it to ALLOWED_TOP_LEVEL_KEYS with a comment '.
            'stating the trade-secret decision made in NAVUUNA_PROMPTS_ROUND2.md.'
        );
    }

    public function test_methodology_weights_object_carries_only_pillar_keys(): void
    {
        $weights = $this->getJson('/api/v1/vitality/methodology')
            ->json('weights');

        $known = Pillars::keys();
        $unexpected = array_diff(array_keys($weights), $known);
        $this->assertSame(
            [],
            $unexpected,
            'weights map surfaced a non-pillar key ('.implode(', ', $unexpected).
            '). Sub-indicator weights are trade-secret and must not appear here.'
        );
    }

    public function test_no_forbidden_key_appears_anywhere_in_the_payload(): void
    {
        $body = $this->getJson('/api/v1/vitality/methodology')->json();

        $leaks = $this->keyPathsContaining($body, self::FORBIDDEN_KEY_PATTERNS);
        $this->assertSame(
            [],
            $leaks,
            'methodology payload surfaced a forbidden key path: '.implode(', ', $leaks)
        );
    }

    /**
     * Walk a nested associative array and return the dotted paths of any
     * key whose leaf matches one of the forbidden patterns.
     *
     * @param  mixed  $node
     * @param  array<int, string>  $patterns
     * @return array<int, string>
     */
    private function keyPathsContaining($node, array $patterns, string $prefix = ''): array
    {
        if (! is_array($node)) {
            return [];
        }

        $hits = [];
        foreach ($node as $key => $value) {
            $path = $prefix === '' ? (string) $key : $prefix.'.'.$key;
            foreach ($patterns as $forbidden) {
                if (is_string($key) && stripos($key, $forbidden) !== false) {
                    $hits[] = $path;
                }
            }
            $hits = array_merge($hits, $this->keyPathsContaining($value, $patterns, $path));
        }

        return $hits;
    }
}
