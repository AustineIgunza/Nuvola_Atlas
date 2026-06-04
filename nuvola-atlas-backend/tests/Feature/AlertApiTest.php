<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Alert;
use App\Models\User;
use Tests\TestCase;

class AlertApiTest extends TestCase
{
    public function test_can_list_alerts(): void
    {
        Alert::create([
            'id' => 'a1',
            'severity' => 'high',
            'kind' => 'infra',
            'title' => 'Test alert',
            'body' => 'Alert body text',
            'zone_id' => null,
            'read' => false,
        ]);

        $response = $this->getJson('/api/v1/alerts');

        $response->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_can_mark_all_read(): void
    {
        $user = User::factory()->editor()->create();

        Alert::create([
            'id' => 'a1',
            'severity' => 'medium',
            'kind' => 'vitality',
            'title' => 'Unread alert',
            'body' => 'Body',
            'zone_id' => null,
            'read' => false,
        ]);

        $response = $this->actingAs($user)->postJson('/api/v1/alerts/mark-all-read');

        $response->assertOk()->assertJsonPath('ok', true);
        $this->assertDatabaseHas('alerts', ['id' => 'a1', 'read' => true]);
    }
}
