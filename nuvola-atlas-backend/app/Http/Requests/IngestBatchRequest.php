<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

use App\Models\DataIngestionLog;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Validation\ValidationException;

class IngestBatchRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization is handled by the EnsureInternalSecret middleware
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $indicators = [
            'healthcare_access',
            'education_access',
            'digital_connectivity',
            'crime_rates',
            'emergency_response',
            'emergency_response_access',
            'disaster_exposure',
            'population_density',
            'congestion',
            'housing_pressure',
            'road_quality',
            'energy_reliability',
            'food_risk',
            'waste_management',
        ];

        return [
            'batch_id' => ['required', 'string'],
            'submitted_at' => ['required', 'date'],
            'readings' => ['required', 'array'],
            'readings.*.zone_id' => ['required', 'string', 'exists:zones,id'],
            'readings.*.indicator' => ['required', 'string', 'in:' . implode(',', $indicators)],
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
