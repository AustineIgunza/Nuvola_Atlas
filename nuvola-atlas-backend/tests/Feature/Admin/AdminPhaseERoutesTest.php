<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Enums\Role;
use App\Jobs\RecalculateAllZones;
use App\Models\ContentBlock;
use App\Models\DataFeedStatus;
use App\Models\Firm;
use App\Models\ImpersonationSession;
use App\Models\MethodologyVersion;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use PHPUnit\Framework\Attributes\DataProvider;
use App\Support\Pillars;
use Tests\Support\PillarSeeding;
use Tests\TestCase;

/**
 * Phase E admin surface — firms, methodology, feeds, impersonation, content.
 *
 * The gate on every one of these is `role:admin` + `admin.two_factor`, so
 * each group gets its access assertion alongside its behaviour assertion:
 * a route that works but is reachable by an editor is still a defect.
 */
class AdminPhaseERoutesTest extends TestCase
{
    private const EVEN_WEIGHTS = [
        'water_sanitation' => 0.25,
        'road_density' => 0.25,
        'transit_access' => 0.25,
        'electricity_access' => 0.25,
    ];

    private function adminWithTwoFactor(): User
    {
        return User::factory()->create([
            'role' => Role::Admin,
            'email_two_factor_enabled_at' => now(),
        ]);
    }

    private function seedZone(string $id, int $pillar = 70): void
    {
        $pillars = PillarSeeding::columns(array_fill_keys(Pillars::keys(), $pillar));
        $cols = implode(', ', array_keys($pillars));
        $vals = implode(', ', array_fill(0, count($pillars), '?'));

        DB::statement(
            "INSERT INTO zones (id, name, score, {$cols}, last_sync_min,
             centroid, created_at, updated_at)
             VALUES (?, ?, ?, {$vals}, 5,
             ST_GeogFromText('POINT(36.82 -1.29)'), now(), now())",
            array_merge([$id, ucfirst($id), $pillar], array_values($pillars))
        );
    }

    // ---------------------------------------------------------------- gating

    /**
     * One assertion per Phase E group. If a new admin route lands without a
     * role gate, this is the test that should go red.
     *
     * @return list<array{0: string, 1: string}>
     */
    public static function phaseERoutes(): array
    {
        return [
            'firms index' => ['get', '/api/v1/admin/firms'],
            'methodology index' => ['get', '/api/v1/admin/methodology'],
            'feeds index' => ['get', '/api/v1/admin/feeds'],
            'impersonate index' => ['get', '/api/v1/admin/impersonate'],
            'content index' => ['get', '/api/v1/admin/content'],
        ];
    }

    #[DataProvider('phaseERoutes')]
    public function test_non_admin_roles_are_refused(string $method, string $uri): void
    {
        foreach (['editor', 'viewer', 'partner'] as $role) {
            $user = User::factory()->{$role}()->create();

            $this->actingAs($user)->json(strtoupper($method), $uri)
                ->assertForbidden();
        }
    }

    #[DataProvider('phaseERoutes')]
    public function test_guest_is_refused(string $method, string $uri): void
    {
        $this->json(strtoupper($method), $uri)->assertUnauthorized();
    }

    #[DataProvider('phaseERoutes')]
    public function test_admin_without_two_factor_is_refused(string $method, string $uri): void
    {
        $admin = User::factory()->create([
            'role' => Role::Admin,
            'email_two_factor_enabled_at' => null,
        ]);

        $this->actingAs($admin)->json(strtoupper($method), $uri)
            ->assertForbidden()
            ->assertJsonPath('two_factor_required', true);
    }

    // ----------------------------------------------------------------- firms

    public function test_admin_can_create_and_list_firms(): void
    {
        $admin = $this->adminWithTwoFactor();

        $this->actingAs($admin)->postJson('/api/v1/admin/firms', [
            'name' => 'Rift Valley Capital',
            'slug' => 'rift-valley-'.uniqid(),
            'tier' => 'deal',
            'contact_email' => 'deals@example.com',
        ])->assertCreated()
            ->assertJsonPath('name', 'Rift Valley Capital')
            ->assertJsonPath('tier', 'deal')
            ->assertJsonPath('active', true);

        $names = collect(
            $this->actingAs($admin)->getJson('/api/v1/admin/firms')->assertOk()->json('data')
        )->pluck('name');

        $this->assertContains('Rift Valley Capital', $names->all());
    }

    public function test_firm_store_rejects_an_unknown_tier(): void
    {
        $admin = $this->adminWithTwoFactor();

        $this->actingAs($admin)->postJson('/api/v1/admin/firms', [
            'name' => 'Bad Tier Capital',
            'tier' => 'platinum',
        ])->assertStatus(422)->assertJsonValidationErrors('tier');
    }

    public function test_firm_index_filters_by_tier(): void
    {
        $admin = $this->adminWithTwoFactor();

        $deal = Firm::factory()->deal()->create(['slug' => 'tier-deal-'.uniqid()]);
        $basic = Firm::factory()->create(['slug' => 'tier-basic-'.uniqid(), 'tier' => 'basic']);

        $ids = collect(
            $this->actingAs($admin)->getJson('/api/v1/admin/firms?tier=deal')
                ->assertOk()->json('data')
        )->pluck('id')->all();

        $this->assertContains($deal->id, $ids);
        $this->assertNotContains($basic->id, $ids);
    }

    public function test_firm_destroy_deactivates_rather_than_deletes(): void
    {
        $admin = $this->adminWithTwoFactor();
        $firm = Firm::factory()->create(['slug' => 'deact-'.uniqid()]);

        $this->actingAs($admin)->deleteJson("/api/v1/admin/firms/{$firm->id}")
            ->assertOk();

        // Deactivation must preserve the row — watchlists and audit history
        // hang off the firm id, so a hard delete would orphan them.
        $this->assertNotNull(Firm::find($firm->id));
        $this->assertFalse((bool) Firm::find($firm->id)->active);
    }

    public function test_firm_show_404s_for_an_unknown_id(): void
    {
        $admin = $this->adminWithTwoFactor();

        // firms.id is a uuid, so the absent id has to be well-formed —
        // a non-uuid string fails at the Postgres cast, not at findOrFail.
        $this->actingAs($admin)
            ->getJson('/api/v1/admin/firms/00000000-0000-4000-8000-000000000000')
            ->assertNotFound();
    }

    // ----------------------------------------------------------- methodology

    public function test_publishing_a_version_makes_it_current_and_queues_a_recalc(): void
    {
        Queue::fake();
        $admin = $this->adminWithTwoFactor();

        $current = MethodologyVersion::create([
            'version' => 'v1.0.0',
            'weights' => self::EVEN_WEIGHTS,
            'bands' => [],
            'is_current' => true,
            'draft' => false,
        ]);
        $next = MethodologyVersion::create([
            'version' => 'v1.1.0',
            'weights' => ['water_sanitation' => 0.5, 'road_density' => 0.3, 'transit_access' => 0.2, 'electricity_access' => 0.0],
            'bands' => [],
            'is_current' => false,
            'draft' => false,
        ]);

        $this->actingAs($admin)->postJson("/api/v1/admin/methodology/{$next->id}/publish")
            ->assertOk()
            ->assertJsonPath('is_current', true)
            ->assertJsonPath('version', 'v1.1.0');

        // The swap is exclusive — the partial unique index depends on it.
        $this->assertTrue((bool) $next->fresh()->is_current);
        $this->assertFalse((bool) $current->fresh()->is_current);

        Queue::assertPushed(RecalculateAllZones::class);
    }

    public function test_publishing_a_draft_is_rejected(): void
    {
        $admin = $this->adminWithTwoFactor();

        $draft = MethodologyVersion::create([
            'version' => 'v2.0.0-draft',
            'weights' => self::EVEN_WEIGHTS,
            'bands' => [],
            'is_current' => false,
            'draft' => true,
        ]);

        $this->actingAs($admin)
            ->postJson("/api/v1/admin/methodology/{$draft->id}/publish")
            ->assertStatus(500);

        $this->assertFalse((bool) $draft->fresh()->is_current);
    }

    public function test_methodology_preview_rejects_out_of_range_weights(): void
    {
        $admin = $this->adminWithTwoFactor();

        $this->actingAs($admin)->postJson('/api/v1/admin/methodology/preview', [
            'weights' => ['water_sanitation' => 1.4] + self::EVEN_WEIGHTS,
        ])->assertStatus(422)->assertJsonValidationErrors('weights.water_sanitation');
    }

    public function test_methodology_preview_does_not_mutate_the_live_version(): void
    {
        $admin = $this->adminWithTwoFactor();
        $this->seedZone('preview-zone', pillar: 64);

        $live = MethodologyVersion::create([
            'version' => 'v1.0.0',
            'weights' => self::EVEN_WEIGHTS,
            'bands' => [],
            'is_current' => true,
            'draft' => false,
        ]);

        $this->actingAs($admin)->postJson('/api/v1/admin/methodology/preview', [
            'weights' => ['water_sanitation' => 0.7, 'road_density' => 0.1, 'transit_access' => 0.1, 'electricity_access' => 0.1],
        ])->assertOk()
            ->assertJsonPath('weights.water_sanitation', 0.7)
            ->assertJsonStructure(['weights', 'impact']);

        $this->assertSame(0.25, (float) $live->fresh()->weights['water_sanitation']);
    }

    // ----------------------------------------------------------------- feeds

    public function test_feed_matrix_derives_freshness_from_delivery_age(): void
    {
        $admin = $this->adminWithTwoFactor();
        $this->seedZone('feed-zone');

        DataFeedStatus::create([
            'feed_name' => 'wasreb.impact',
            'zone_id' => 'feed-zone',
            'pillar_key' => 'water_sanitation',
            'last_delivered_at' => now()->subMinutes(5),
            'expected_frequency_min' => 60,
            'verified_records' => 12,
            'source_system' => 'wasreb',
        ]);
        DataFeedStatus::create([
            'feed_name' => 'hotosm.roads',
            'zone_id' => 'feed-zone',
            'pillar_key' => 'road_density',
            'last_delivered_at' => null,
            'expected_frequency_min' => 60,
        ]);

        $response = $this->actingAs($admin)->getJson('/api/v1/admin/feeds')
            ->assertOk()
            ->assertJsonStructure([
                'summary' => ['fresh', 'stale', 'overdue', 'missing', 'total'],
                'feeds',
            ]);

        $states = collect($response->json('feeds'))
            ->pluck('state', 'pillar_key');

        $this->assertSame('fresh', $states['water_sanitation']);
        $this->assertSame('missing', $states['road_density']);
        $this->assertSame(2, $response->json('summary.total'));
    }

    // ---------------------------------------------------------- impersonation

    public function test_impersonation_start_mints_a_token_for_the_target(): void
    {
        $admin = $this->adminWithTwoFactor();
        $target = User::factory()->partner()->create();

        $response = $this->actingAs($admin)->postJson('/api/v1/admin/impersonate', [
            'target_user_id' => $target->id,
            'reason' => 'Reproducing a partner-reported scorecard bug.',
        ])->assertCreated()
            ->assertJsonPath('target.id', $target->id)
            ->assertJsonPath('target.role', 'partner');

        $this->assertNotEmpty($response->json('token'));

        $session = ImpersonationSession::find($response->json('session_id'));
        $this->assertNotNull($session);
        $this->assertSame($admin->id, $session->admin_user_id);
        $this->assertNull($session->ended_at);
    }

    public function test_impersonating_yourself_is_rejected(): void
    {
        $admin = $this->adminWithTwoFactor();

        $this->actingAs($admin)->postJson('/api/v1/admin/impersonate', [
            'target_user_id' => $admin->id,
            'reason' => 'Trying to impersonate myself.',
        ])->assertStatus(422);

        $this->assertSame(0, ImpersonationSession::count());
    }

    public function test_impersonation_requires_a_substantive_reason(): void
    {
        $admin = $this->adminWithTwoFactor();
        $target = User::factory()->viewer()->create();

        // The reason is the audit trail — a one-word reason is not one.
        $this->actingAs($admin)->postJson('/api/v1/admin/impersonate', [
            'target_user_id' => $target->id,
            'reason' => 'why',
        ])->assertStatus(422)->assertJsonValidationErrors('reason');
    }

    public function test_impersonation_stop_closes_the_session(): void
    {
        $admin = $this->adminWithTwoFactor();
        $target = User::factory()->viewer()->create();

        $sessionId = $this->actingAs($admin)->postJson('/api/v1/admin/impersonate', [
            'target_user_id' => $target->id,
            'reason' => 'Checking a viewer-only regression.',
        ])->assertCreated()->json('session_id');

        $this->actingAs($admin)->deleteJson("/api/v1/admin/impersonate/{$sessionId}")
            ->assertOk();

        $this->assertNotNull(ImpersonationSession::find($sessionId)->ended_at);
    }

    // --------------------------------------------------------------- content

    public function test_saving_a_content_block_creates_it_and_records_a_revision(): void
    {
        $admin = $this->adminWithTwoFactor();

        $this->actingAs($admin)->putJson('/api/v1/admin/content/methodology-intro', [
            'body' => 'Navuuna scores 17 Nairobi sub-counties.',
        ])->assertOk()->assertJsonPath('key', 'methodology-intro');

        $this->actingAs($admin)->putJson('/api/v1/admin/content/methodology-intro', [
            'body' => 'Navuuna scores 17 Nairobi sub-counties on four service pillars.',
        ])->assertOk();

        $show = $this->actingAs($admin)
            ->getJson('/api/v1/admin/content/methodology-intro')
            ->assertOk();

        $this->assertStringContainsString('four service pillars', $show->json('body'));
        // The first body survives as a revision — content edits are recoverable.
        $this->assertNotEmpty($show->json('revisions'));
    }

    public function test_content_show_404s_for_an_unknown_key(): void
    {
        $admin = $this->adminWithTwoFactor();

        $this->actingAs($admin)->getJson('/api/v1/admin/content/does-not-exist')
            ->assertNotFound();
    }

    public function test_content_save_rejects_an_empty_body(): void
    {
        $admin = $this->adminWithTwoFactor();

        $this->actingAs($admin)->putJson('/api/v1/admin/content/empty-block', [
            'body' => '',
        ])->assertStatus(422)->assertJsonValidationErrors('body');

        $this->assertNull(ContentBlock::find('empty-block'));
    }
}
