<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\VitalityHistory;
use Tests\TestCase;

class HistoryApiTest extends TestCase
{
    public function test_can_list_history(): void
    {
        VitalityHistory::create([
            'month' => "May '26",
            'overall_avg' => 69.0,
        ]);

        $response = $this->getJson('/api/v1/history');

        $response->assertOk()->assertJsonCount(1, 'data');
    }
}
