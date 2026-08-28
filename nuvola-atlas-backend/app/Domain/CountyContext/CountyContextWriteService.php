<?php

declare(strict_types=1);

namespace App\Domain\CountyContext;

use App\Models\CountyContext;
use App\Support\Pillars;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Upserts county_context rows on the internal intake path. The uniqueness
 * key is (county, indicator_key, vintage), so a re-run of the same batch
 * updates in place rather than duplicating — the ingestion service is
 * expected to retry on any 5xx and idempotency has to live somewhere.
 *
 * Validation is layered: the Pydantic schema catches the wire shape, the
 * DB CHECK constraints catch anything that slips through, and this
 * service catches the semantic ones the DB cannot express (retired pillar
 * on a live route).
 */
class CountyContextWriteService
{
    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @return array{written: int, skipped: int}
     */
    public function upsert(array $rows): array
    {
        $retired = Pillars::retiredKeys();
        $written = 0;
        $skipped = 0;

        DB::transaction(function () use ($rows, $retired, &$written, &$skipped) {
            foreach ($rows as $row) {
                $this->assertShape($row);

                if (in_array($row['pillar_key'], $retired, true)) {
                    // A retired pillar reaching intake is the ingester
                    // running against a stale registry — skip and let the
                    // receipt say so, don't hard-fail the batch.
                    $skipped++;

                    continue;
                }

                CountyContext::updateOrCreate(
                    [
                        'county' => $row['county'],
                        'indicator_key' => $row['indicator_key'],
                        'vintage' => $row['vintage'],
                    ],
                    [
                        'pillar_key' => $row['pillar_key'],
                        'value' => $row['value'],
                        'unit' => $row['unit'],
                        'granularity' => $row['granularity'],
                        'method' => $row['method'],
                        'source_id' => $row['source_id'],
                        'retrieved' => $row['retrieved'],
                        'extraction_confidence' => $row['extraction_confidence'] ?? null,
                        'page_ref' => $row['page_ref'] ?? null,
                        'notes' => $row['notes'] ?? null,
                    ],
                );
                $written++;
            }
        });

        return ['written' => $written, 'skipped' => $skipped];
    }

    /** @param  array<string, mixed>  $row */
    private function assertShape(array $row): void
    {
        foreach (['county', 'pillar_key', 'indicator_key', 'unit', 'granularity', 'method', 'retrieved'] as $required) {
            if (! isset($row[$required]) || $row[$required] === '') {
                throw new InvalidArgumentException("county_context row missing {$required}");
            }
        }
        if ($row['granularity'] === 'subcounty') {
            throw new InvalidArgumentException(
                'county_context refuses subcounty granularity; a sub-county value belongs on a zone.'
            );
        }
        if ($row['method'] === 'gap' && $row['value'] !== null) {
            throw new InvalidArgumentException(
                "R1 breach: method='gap' but value is not null (indicator {$row['indicator_key']})."
            );
        }
        if ($row['method'] !== 'gap' && (empty($row['source_id']) || empty($row['vintage']))) {
            throw new InvalidArgumentException(
                "non-gap reading for {$row['indicator_key']} needs source_id and vintage"
            );
        }
    }
}
