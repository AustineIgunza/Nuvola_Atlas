<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

class VitalityApiTest extends TestCase
{
    public function test_can_get_methodology(): void
    {
        $response = $this->getJson('/api/vitality/methodology');

        $response->assertOk()
            ->assertJsonStructure(['pillars'])
            ->assertJsonCount(4, 'pillars');
    }
}
