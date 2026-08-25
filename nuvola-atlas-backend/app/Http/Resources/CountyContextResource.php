<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\CountyContext;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Serialise a county_context row. The fields shipped to the client are
 * exactly the ones the county banner needs to render itself without asking
 * a second question — value, source, vintage, and the granularity chip
 * that tells a reader this is not a sub-county number.
 */
class CountyContextResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var CountyContext $row */
        $row = $this->resource;

        return [
            'county' => $row->county,
            'pillarKey' => $row->pillar_key,
            'indicatorKey' => $row->indicator_key,
            'value' => $row->value,
            'unit' => $row->unit,
            'granularity' => $row->granularity,
            'method' => $row->method,
            'sourceId' => $row->source_id,
            'vintage' => $row->vintage,
            'retrieved' => $row->retrieved?->toDateString(),
            'extractionConfidence' => $row->extraction_confidence,
            'pageRef' => $row->page_ref,
            'notes' => $row->notes,
        ];
    }
}
