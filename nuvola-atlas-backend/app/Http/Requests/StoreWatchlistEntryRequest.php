<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWatchlistEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'zone_id' => ['required', 'string', 'exists:zones,id'],
            'priority' => ['nullable', 'integer', 'between:1,5'],
            'thesis' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
