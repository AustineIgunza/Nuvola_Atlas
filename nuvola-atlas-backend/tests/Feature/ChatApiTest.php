<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\User;
use App\Models\Zone;
use App\Services\Chat\AiGatewayClient;
use Generator;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Support\IndicatorSeeding;
use Tests\TestCase;

class ChatApiTest extends TestCase
{
    private function seedUser(string $email = 'user@example.com'): User
    {
        return User::create([
            'name' => 'Test User',
            'email' => $email,
            'password' => bcrypt('password'),
            'role' => 'viewer',
        ]);
    }

    private function seedZone(): Zone
    {
        $zone = Zone::create(array_merge([
            'id' => 'westlands',
            'name' => 'Westlands',
            'score' => 76,
            'last_sync_min' => 4,
        ], IndicatorSeeding::fromPillars([
            'social' => 82,
            'safety' => 71,
            'density' => 64,
            'infra' => 80,
        ])));
        DB::statement(
            "UPDATE zones SET centroid = ST_MakePoint(36.8048, -1.2673)::geography WHERE id = ?",
            ['westlands']
        );
        return $zone;
    }

    private function fakeGatewayWith(array $completions, iterable $stream = ['Zone Westlands ', 'is trending up.']): void
    {
        $client = new class($completions, $stream) extends AiGatewayClient {
            public function __construct(private array $completions, private iterable $streamData) {}
            public function isConfigured(): bool { return true; }
            public function complete(array $messages, array $opts = []): array
            {
                return array_shift($this->completions) ?? ['content' => 'summary', 'tokens_in' => 0, 'tokens_out' => 0];
            }
            public function stream(array $messages, array $opts = []): Generator
            {
                foreach ($this->streamData as $d) yield $d;
            }
        };
        $this->app->instance(AiGatewayClient::class, $client);
    }

    public function test_anonymous_cannot_send_a_message(): void
    {
        $r = $this->postJson('/api/v1/chat/conversations/foo/messages', ['prompt' => 'hi']);
        $r->assertUnauthorized();
    }

    public function test_authed_user_can_create_conversation(): void
    {
        Sanctum::actingAs($this->seedUser());
        $r = $this->postJson('/api/v1/chat/conversations', ['title' => 'Westlands drill-down']);
        $r->assertCreated()->assertJsonPath('title', 'Westlands drill-down');
    }

    public function test_missing_ai_key_returns_503(): void
    {
        config()->set('ai.gateway.api_key', '');
        $user = $this->seedUser();
        Sanctum::actingAs($user);
        $c = ChatConversation::create(['user_id' => $user->id, 'title' => 't']);

        $r = $this->postJson("/api/v1/chat/conversations/{$c->id}/messages", ['prompt' => 'hi']);
        $r->assertStatus(503);
    }

    public function test_cross_user_conversation_returns_404(): void
    {
        config()->set('ai.gateway.api_key', 'sk-test');
        $owner = $this->seedUser('owner@example.com');
        $intruder = $this->seedUser('intruder@example.com');
        $c = ChatConversation::create(['user_id' => $owner->id, 'title' => 't']);

        Sanctum::actingAs($intruder);
        $r = $this->getJson("/api/v1/chat/conversations/{$c->id}/messages");
        $r->assertNotFound();
    }

    public function test_happy_path_streams_events_and_persists_messages(): void
    {
        config()->set('ai.gateway.api_key', 'sk-test');
        $this->seedZone();

        $user = $this->seedUser();
        Sanctum::actingAs($user);

        $this->fakeGatewayWith([
            ['content' => 'summary', 'tokens_in' => 5, 'tokens_out' => 1],       // intent
            ['content' => 'SELECT id, score FROM zones', 'tokens_in' => 10, 'tokens_out' => 6], // sql
            ['content' => '["compare Kasarani","which pillar dropped?","show trend for Kibra"]', 'tokens_in' => 3, 'tokens_out' => 20], // followups
        ]);

        $c = ChatConversation::create(['user_id' => $user->id, 'title' => 't']);

        $r = $this->postJson("/api/v1/chat/conversations/{$c->id}/messages", ['prompt' => 'give me a snapshot']);
        $r->assertOk();

        $body = $r->streamedContent();
        $this->assertStringContainsString('event: intent', $body);
        $this->assertStringContainsString('event: sql', $body);
        $this->assertStringContainsString('event: rows', $body);
        $this->assertStringContainsString('event: insight_delta', $body);
        $this->assertStringContainsString('event: followups', $body);
        $this->assertStringContainsString('event: done', $body);

        $this->assertSame(2, ChatMessage::where('conversation_id', $c->id)->count());
        $assistant = ChatMessage::where('conversation_id', $c->id)->where('role', 'assistant')->first();
        $this->assertNotNull($assistant);
        $this->assertNotEmpty($assistant->content);
        $this->assertStringContainsString('LIMIT 200', (string) $assistant->generated_sql);
    }

    public function test_bad_sql_from_llm_is_caught_by_guard(): void
    {
        config()->set('ai.gateway.api_key', 'sk-test');

        $user = $this->seedUser();
        Sanctum::actingAs($user);

        $this->fakeGatewayWith([
            ['content' => 'summary', 'tokens_in' => 5, 'tokens_out' => 1],
            ['content' => 'DROP TABLE zones', 'tokens_in' => 4, 'tokens_out' => 4],
        ]);

        $c = ChatConversation::create(['user_id' => $user->id, 'title' => 't']);

        $r = $this->postJson("/api/v1/chat/conversations/{$c->id}/messages", ['prompt' => 'delete stuff']);
        $r->assertOk();

        $body = $r->streamedContent();
        $this->assertStringContainsString('event: error', $body);
        $this->assertStringNotContainsString('DROP TABLE', $body);
    }
}
