<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Report;
use App\Models\User;
use Tests\TestCase;

class ReportApiTest extends TestCase
{
    public function test_can_list_reports(): void
    {
        Report::create([
            'id' => 'r1',
            'title' => 'Test Report',
            'zone_id' => null,
            'date' => '2026-05-01',
            'status' => 'draft',
            'author' => 'Tester',
            'size_bytes' => 1000,
            'format' => 'PDF',
        ]);

        $response = $this->getJson('/api/v1/reports');

        $response->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_can_create_report(): void
    {
        $user = User::factory()->editor()->create();

        $response = $this->actingAs($user)->postJson('/api/v1/reports', [
            'title' => 'New Test Report',
        ]);

        $response->assertCreated()->assertJsonPath('title', 'New Test Report');
        $this->assertDatabaseHas('reports', ['title' => 'New Test Report']);
    }

    public function test_create_report_validation_fails(): void
    {
        $user = User::factory()->editor()->create();

        $response = $this->actingAs($user)->postJson('/api/v1/reports', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);
    }
}
