<?php

declare(strict_types=1);

namespace App\Services\CountyContext;

use App\Models\CountyContext;
use App\Support\Pillars;
use Illuminate\Support\Collection;
use InvalidArgumentException;

/**
 * Reads county_context rows for the banner. Filters out any row that
 * points at a retired pillar as a defence in depth — the DB has no such
 * FK and a stale row could otherwise leak a switched-off pillar back into
 * the public payload.
 */
class CountyContextReadService
{
    public function forCounty(string $county): Collection
    {
        $county = trim($county);
        if ($county === '') {
            throw new InvalidArgumentException('county is required');
        }

        $retired = Pillars::retiredKeys();

        return CountyContext::query()
            ->where('county', $county)
            ->orderBy('pillar_key')
            ->orderBy('indicator_key')
            ->get()
            ->reject(fn (CountyContext $row) => in_array($row->pillar_key, $retired, true))
            ->values();
    }
}
