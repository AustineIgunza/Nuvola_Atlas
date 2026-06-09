<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

/**
 * Proves the per-PAT `rate_limit_per_minute` cap fires through the named
 * `api` limiter even though `throttle:api` sits upstream of `auth:sanctum`
 * on the v1 group. The limiter peeks at the bearer header directly so the
 * cap applies on public reads (e.g. /zones) and on authed routes alike.
 */
class PartnerApiThrottleTest extends TestCase
{
    public function test_partner_key_with_cap_returns_429_past_the_limit(): void
    {
        $partner = User::factory()->partner()->create();

        $issue = $partner->createToken('capped key', ['api:read']);
        $issue->accessToken->forceFill(['rate_limit_per_minute' => 2])->save();
        $plain = $issue->plainTextToken;

        // First two requests are inside the budget.
        for ($i = 0; $i < 2; $i++) {
            $this->withHeader('Authorization', 'Bearer '.$plain)
                ->getJson('/api/v1/zones')
                ->assertOk();
        }

        // Third request inside the same minute hits the cap.
        $third = $this->withHeader('Authorization', 'Bearer '.$plain)
            ->getJson('/api/v1/zones');
        $third->assertStatus(429);
        $this->assertSame('application/problem+json', $third->headers->get('Content-Type'));
    }

    public function test_partner_key_without_cap_uses_default_60_per_minute(): void
    {
        $partner = User::factory()->partner()->create();
        $plain = $partner->createToken('uncapped key', ['api:read'])->plainTextToken;

        // 10 requests with no per-key cap should all succeed — well under
        // the default 60/min ceiling. (We stay short of 60 so phpunit doesn't
        // spend a minute proving an obvious upper bound.)
        for ($i = 0; $i < 10; $i++) {
            $this->withHeader('Authorization', 'Bearer '.$plain)
                ->getJson('/api/v1/zones')
                ->assertOk();
        }
    }

    public function test_throttle_keys_on_token_id_so_keys_dont_share_budgets(): void
    {
        // Two keys for the same partner, both capped at 2/min. Burning one
        // must not eat the other's budget — caps live on the token, not on
        // the user.
        $partner = User::factory()->partner()->create();

        $issueA = $partner->createToken('key A', ['api:read']);
        $issueA->accessToken->forceFill(['rate_limit_per_minute' => 2])->save();
        $plainA = $issueA->plainTextToken;

        $issueB = $partner->createToken('key B', ['api:read']);
        $issueB->accessToken->forceFill(['rate_limit_per_minute' => 2])->save();
        $plainB = $issueB->plainTextToken;

        for ($i = 0; $i < 2; $i++) {
            $this->withHeader('Authorization', 'Bearer '.$plainA)
                ->getJson('/api/v1/zones')
                ->assertOk();
        }
        $this->withHeader('Authorization', 'Bearer '.$plainA)
            ->getJson('/api/v1/zones')
            ->assertStatus(429);

        // Key B's budget is still intact.
        $this->withHeader('Authorization', 'Bearer '.$plainB)
            ->getJson('/api/v1/zones')
            ->assertOk();
    }
}
