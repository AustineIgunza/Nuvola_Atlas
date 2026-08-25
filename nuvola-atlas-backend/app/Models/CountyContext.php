<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A county- or utility-level indicator reading that must never render on
 * a sub-county bubble. The envelope mirrors pipeline.indicators.ProvenanceValue
 * one-for-one so a row round-trips through the ingestion service without
 * shape drift.
 */
class CountyContext extends Model
{
    protected $table = 'county_context';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'value' => 'float',
            'retrieved' => 'date',
        ];
    }
}
