<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use App\Services\Agents\AgentProvider;
use Tests\TestCase;

/**
 * The agent is a second door onto data the REST surface already gates.
 * `feed_status` wraps GET /api/v1/admin/feeds, which requires role:admin,
 * so a viewer reaching it through the assistant would be an escalation.
 */
class AssistantAgentToolAccessTest extends TestCase
{
    /** Provider that ignores the offered schemas and demands one tool by name. */
    private function forceToolCall(string $tool): void
    {
        $this->app->bind(AgentProvider::class, fn () => new class($tool) implements AgentProvider
        {
            public function __construct(private string $tool) {}

            public function nextStep(string $prompt, array $tools, array $history): array
            {
                if ($history !== []) {
                    return ['action' => 'final', 'answer' => 'done'];
                }

                return ['action' => 'tool_call', 'tool' => $this->tool, 'args' => []];
            }
        });
    }

    public function test_viewer_is_not_offered_the_admin_feed_tool(): void
    {
        $viewer = User::factory()->create(['role' => Role::Viewer]);

        $names = collect(
            $this->actingAs($viewer)
                ->getJson('/api/v1/assistant/agent/tools')
                ->assertOk()
                ->json('tools')
        )->pluck('name');

        $this->assertNotContains('feed_status', $names);
        $this->assertContains('list_zones', $names, 'public tools must stay available to viewers');
    }

    public function test_admin_is_offered_the_feed_tool(): void
    {
        $admin = User::factory()->create(['role' => Role::Admin]);

        $names = collect(
            $this->actingAs($admin)
                ->getJson('/api/v1/assistant/agent/tools')
                ->assertOk()
                ->json('tools')
        )->pluck('name');

        $this->assertContains('feed_status', $names);
    }

    public function test_viewer_cannot_execute_the_feed_tool_by_naming_it_directly(): void
    {
        // Hiding a tool from discovery is not enough on its own — a model
        // that names it anyway must still be refused at execution.
        $this->forceToolCall('feed_status');

        $viewer = User::factory()->create(['role' => Role::Viewer]);

        $steps = $this->actingAs($viewer)
            ->postJson('/api/v1/assistant/agent', ['prompt' => 'which feeds are stale?'])
            ->assertOk()
            ->json('steps');

        $this->assertSame('unknown tool', $steps[0]['error'] ?? null);
        $this->assertArrayNotHasKey('observation', $steps[0]);
    }

    public function test_admin_can_execute_the_feed_tool(): void
    {
        $this->forceToolCall('feed_status');

        $admin = User::factory()->create(['role' => Role::Admin]);

        $steps = $this->actingAs($admin)
            ->postJson('/api/v1/assistant/agent', ['prompt' => 'which feeds are stale?'])
            ->assertOk()
            ->json('steps');

        $this->assertSame('feed_status', $steps[0]['tool'] ?? null);
        $this->assertArrayHasKey('observation', $steps[0]);
    }
}
