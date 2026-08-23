<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\DataIngestionLog;
use App\Support\Pillars;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class IngestBatchRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization is handled by the `internal.secret` middleware
        // (VerifyInternalSecret) on the route itself — see routes/api.php.
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        // A reading for a pillar that was switched off is rejected, not
        // ignored — the sender needs to hear that the batch is out of date
        // rather than watch it disappear.
        return [
            'batch_id' => ['required', 'string'],
            'submitted_at' => ['required', 'date'],
            'readings' => ['required', 'array'],
            'readings.*.zone_id' => ['required', 'string', 'exists:zones,id'],
            'readings.*.pillar' => ['required', 'string', 'in:'.implode(',', Pillars::keys())],
            'readings.*.value' => ['required', 'numeric'],
            'readings.*.observed_at' => ['required', 'date'],
            'readings.*.field_verified' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(Validator $validator): void
    {
        $body = $this->getContent();
        $hash = hash('sha256', $body);
        $batchId = $this->input('batch_id') ?? 'unknown';

        // Check if this duplicate request was already processed
        if (! DataIngestionLog::where('payload_hash', $hash)->exists()) {
            DataIngestionLog::create([
                'source' => $batchId,
                'payload_hash' => $hash,
                'arrived_at' => now(),
                'status' => 'rejected',
                'error_reasons' => $validator->errors()->toArray(),
                'zone_count' => null,
                'indicator_count' => null,
            ]);
        }

        parent::failedValidation($validator);
    }
}
