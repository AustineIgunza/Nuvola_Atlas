<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

class SecurityTest extends TestCase
{
    public function test_api_responses_contain_security_headers(): void
    {
        $response = $this->getJson('/api/v1/zones');

        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    }

    public function test_write_routes_require_authentication(): void
    {
        $this->postJson('/api/v1/alerts/mark-all-read')
            ->assertUnauthorized();

        $this->postJson('/api/v1/reports', ['title' => 'Test'])
            ->assertUnauthorized();
    }

    public function test_read_routes_remain_public(): void
    {
        $this->getJson('/api/v1/zones')->assertOk();
        $this->getJson('/api/v1/projects')->assertOk();
        $this->getJson('/api/v1/alerts')->assertOk();
        $this->getJson('/api/v1/reports')->assertOk();
        $this->getJson('/api/v1/history')->assertOk();
        $this->getJson('/api/v1/vitality/methodology')->assertOk();
    }
}
