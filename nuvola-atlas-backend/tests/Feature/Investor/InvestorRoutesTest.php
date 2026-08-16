<?php

declare(strict_types=1);

namespace Tests\Feature\Investor;

use App\Models\Firm;
use App\Models\FirmWatchlist;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Tests\Support\IndicatorSeeding;
use Tests\TestCase;

class InvestorRoutesTest extends TestCase
{
    private function seedZone(string $id, int $pillar = 70): void
    {
        $indicators = IndicatorSeeding::fromPillars([
            'social' => $pillar,
            'safety' => $pillar,
            'density' => $pillar,
            'infra' => $pillar,
        ]);
        $cols = implode(', ', array_keys($indicators));
        $vals = implode(', ', array_fill(0, count($indicators), '?'));

        DB::statement(
            "INSERT INTO zones (id, name, score, {$cols}, last_sync_min,
             centroid, created_at, updated_at)
             VALUES (?, ?, ?, {$vals}, 5,
             ST_GeogFromText('POINT(36.82 -1.29)'), now(), now())",
            array_merge([$id, ucfirst($id), $pillar], array_values($indicators))
        );
    }

    private function investorFor(Firm $firm): User
    {
        $user = User::factory()->partner()->create([
            'primary_firm_id' => $firm->id,
        ]);
        $firm->users()->syncWithoutDetaching([
            $user->id => ['role_within_firm' => 'admin'],
        ]);

        return $user;
    }

    public function test_viewer_without_firm_gets_403_on_me(): void
    {
        $viewer = User::factory()->viewer()->create(['primary_firm_id' => null]);

        $this->actingAs($viewer)->getJson('/api/v1/investor/me')
            ->assertForbidden();
    }

    public function test_investor_with_firm_sees_own_profile(): void
    {
        $firm = Firm::factory()->deal()->create();
        $user = $this->investorFor($firm);

        $this->actingAs($user)->getJson('/api/v1/investor/me')
            ->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('firm.id', $firm->id)
            ->assertJsonPath('tier', 'deal');
    }

    public function test_investor_cannot_see_another_firms_watchlist(): void
    {
        $firmA = Firm::factory()->create(['slug' => 'firm-a-'.uniqid()]);
        $firmB = Firm::factory()->create(['slug' => 'firm-b-'.uniqid()]);
        $userA = $this->investorFor($firmA);

        $this->seedZone('policy-zone-a');
        $this->seedZone('policy-zone-b');

        FirmWatchlist::create([
            'firm_id' => $firmB->id,
            'zone_id' => 'policy-zone-b',
            'priority' => 1,
            'thesis' => 'B-only',
        ]);
        FirmWatchlist::create([
            'firm_id' => $firmA->id,
            'zone_id' => 'policy-zone-a',
            'priority' => 2,
            'thesis' => 'A-only',
        ]);

        $response = $this->actingAs($userA)->getJson('/api/v1/investor/watchlist')
            ->assertOk();

        $zoneIds = collect($response->json('data'))->pluck('zone.id')->all();
        $this->assertContains('policy-zone-a', $zoneIds);
        $this->assertNotContains('policy-zone-b', $zoneIds);
    }

    public function test_add_to_watchlist_rejects_duplicates_with_422(): void
    {
        $firm = Firm::factory()->create(['slug' => 'firm-dup-'.uniqid()]);
        $user = $this->investorFor($firm);

        $this->seedZone('dup-zone');

        $this->actingAs($user)->postJson('/api/v1/investor/watchlist', [
            'zone_id' => 'dup-zone',
            'priority' => 3,
            'thesis' => 'First',
        ])->assertCreated();

        $this->actingAs($user)->postJson('/api/v1/investor/watchlist', [
            'zone_id' => 'dup-zone',
            'priority' => 4,
            'thesis' => 'Second',
        ])->assertStatus(422);
    }

    public function test_investor_cannot_update_another_firms_entry(): void
    {
        $firmA = Firm::factory()->create(['slug' => 'firm-a-upd-'.uniqid()]);
        $firmB = Firm::factory()->create(['slug' => 'firm-b-upd-'.uniqid()]);
        $userA = $this->investorFor($firmA);

        $this->seedZone('upd-zone');

        $entryB = FirmWatchlist::create([
            'firm_id' => $firmB->id,
            'zone_id' => 'upd-zone',
            'priority' => 1,
            'thesis' => 'B',
        ]);

        $this->actingAs($userA)->patchJson("/api/v1/investor/watchlist/{$entryB->id}", [
            'priority' => 5,
            'thesis' => 'attempted-cross-firm-write',
        ])->assertNotFound();

        // Confirm the row was untouched.
        $this->assertSame(1, $entryB->fresh()->priority);
        $this->assertSame('B', $entryB->fresh()->thesis);
    }

    public function test_investor_can_delete_own_watchlist_entry(): void
    {
        $firm = Firm::factory()->create(['slug' => 'firm-del-'.uniqid()]);
        $user = $this->investorFor($firm);

        $this->seedZone('del-zone');

        $entry = FirmWatchlist::create([
            'firm_id' => $firm->id,
            'zone_id' => 'del-zone',
            'priority' => 3,
            'thesis' => 'about to be deleted',
        ]);

        $this->actingAs($user)->deleteJson("/api/v1/investor/watchlist/{$entry->id}")
            ->assertOk();

        $this->assertNull(FirmWatchlist::find($entry->id));
    }

    public function test_portfolio_returns_composite_over_watchlist(): void
    {
        $firm = Firm::factory()->create(['slug' => 'firm-port-'.uniqid()]);
        $user = $this->investorFor($firm);

        $this->seedZone('port-a', pillar: 80);
        $this->seedZone('port-b', pillar: 60);

        FirmWatchlist::create(['firm_id' => $firm->id, 'zone_id' => 'port-a', 'priority' => 1]);
        FirmWatchlist::create(['firm_id' => $firm->id, 'zone_id' => 'port-b', 'priority' => 2]);

        $this->actingAs($user)->getJson('/api/v1/investor/portfolio')
            ->assertOk()
            ->assertJsonPath('composite.count', 2)
            ->assertJsonPath('firm.name', $firm->name);
    }

    public function test_opportunities_excludes_watchlisted_zones(): void
    {
        $firm = Firm::factory()->deal()->create(['slug' => 'firm-opp-'.uniqid()]);
        $user = $this->investorFor($firm);

        $this->seedZone('opp-a', pillar: 82);
        $this->seedZone('opp-b', pillar: 55);
        $this->seedZone('opp-watched', pillar: 90);

        FirmWatchlist::create([
            'firm_id' => $firm->id,
            'zone_id' => 'opp-watched',
            'priority' => 1,
        ]);

        $response = $this->actingAs($user)->getJson('/api/v1/investor/opportunities')
            ->assertOk()
            ->assertJsonPath('firm_tier', 'deal');

        $zoneIds = collect($response->json('data'))->pluck('zone_id')->all();
        $this->assertNotContains('opp-watched', $zoneIds);
    }

    public function test_brief_streams_pdf(): void
    {
        $firm = Firm::factory()->create(['slug' => 'firm-brief-'.uniqid()]);
        $user = $this->investorFor($firm);

        $this->seedZone('brief-a', pillar: 72);
        FirmWatchlist::create([
            'firm_id' => $firm->id,
            'zone_id' => 'brief-a',
            'priority' => 1,
            'thesis' => 'Anchor holding',
        ]);

        $response = $this->actingAs($user)->get('/api/v1/investor/brief');
        $response->assertOk();
        $this->assertSame('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('.pdf', (string) $response->headers->get('Content-Disposition'));
    }
}
