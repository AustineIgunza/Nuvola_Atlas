<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

class SecurityTest extends TestCase
{
    public function test_api_responses_contain_security_headers(): void
    {
        $response = $this->getJson('/api/zones');

        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    }

    public function test_write_routes_require_authentication(): void
    {
        $this->postJson('/api/alerts/mark-all-read')
            ->assertUnauthorized();

        $this->postJson('/api/reports', ['title' => 'Test'])
            ->assertUnauthorized();
    }

    public function test_read_routes_remain_public(): void
    {
        $this->getJson('/api/zones')->assertOk();
        $this->getJson('/api/projects')->assertOk();
        $this->getJson('/api/alerts')->assertOk();
        $this->getJson('/api/reports')->assertOk();
        $this->getJson('/api/history')->assertOk();
        $this->getJson('/api/vitality/methodology')->assertOk();
    }
}
