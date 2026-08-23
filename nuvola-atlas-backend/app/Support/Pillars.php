<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Read access to the pillar registry in `config/pillars.php`.
 *
 * That config file is generated from `pillars.json` at the repo root and is
 * shared with the frontend and the ingestion service. Nothing in the backend
 * should name a pillar as a string literal — go through here, so a pillar
 * that gets switched off disappears from every loop at once instead of
 * lingering in whichever array nobody remembered to update.
 *
 * Off pillars are filtered out by every method on this class except
 * `retiredKeys()`. There is deliberately no accessor that returns one.
 */
final class Pillars
{
    /**
     * Pillar keys in registry order, excluding anything switched off.
     *
     * @return array<int, string>
     */
    public static function keys(): array
    {
        return array_column(self::all(), 'key');
    }

    /**
     * Full definitions, excluding anything switched off.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function all(): array
    {
        return array_values(array_filter(
            config('pillars.pillars', []),
            fn (array $pillar) => $pillar['status'] !== 'off',
        ));
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function find(string $key): ?array
    {
        foreach (self::all() as $pillar) {
            if ($pillar['key'] === $key) {
                return $pillar;
            }
        }

        return null;
    }

    public static function exists(string $key): bool
    {
        return self::find($key) !== null;
    }

    /**
     * Scoring weights, keyed by pillar. Held pillars sit at 0 — their value is
     * shown with its vintage attached but is not folded into the composite.
     *
     * @return array<string, float>
     */
    public static function weights(): array
    {
        $weights = [];
        foreach (self::all() as $pillar) {
            $weights[$pillar['key']] = (float) $pillar['weight'];
        }

        return $weights;
    }

    /**
     * A map from every pillar key to $value. Use instead of writing a literal
     * array keyed by pillar names.
     *
     * @template T
     *
     * @param  T  $value
     * @return array<string, T>
     */
    public static function fill(mixed $value): array
    {
        return array_fill_keys(self::keys(), $value);
    }

    /**
     * Keys that were switched off. Exposed only so tests and the guard in
     * ZoneResource can assert these never reach a response.
     *
     * @return array<int, string>
     */
    public static function retiredKeys(): array
    {
        return array_values(array_map(
            fn (array $pillar) => $pillar['key'],
            array_filter(
                config('pillars.pillars', []),
                fn (array $pillar) => $pillar['status'] === 'off',
            ),
        ));
    }

    public static function version(): string
    {
        return (string) config('pillars.version', 'unknown');
    }

    /** Column on `zones` and `zone_score_snapshots` holding this pillar's value. */
    public static function column(string $key): string
    {
        return 'pillar_'.$key;
    }
}
