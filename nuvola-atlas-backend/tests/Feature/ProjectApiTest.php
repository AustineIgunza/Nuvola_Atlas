<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Zone;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ProjectApiTest extends TestCase
{
    private function seedZoneAndProject(): Project
    {
        Zone::create([
            'id' => 'westlands',
            'name' => 'Westlands',
            'score' => 76,
            'pillar_social' => 82,
            'pillar_safety' => 71,
            'pillar_density' => 64,
            'pillar_infra' => 80,
            'delta_social' => 3,
            'delta_safety' => -1,
            'delta_density' => 2,
            'delta_infra' => 4,
            'last_sync_min' => 4,
        ]);

        DB::statement("UPDATE zones SET centroid = ST_MakePoint(36.8048, -1.2673)::geography WHERE id = 'westlands'");

        return Project::create([
            'id' => 'p1',
            'name' => 'Waiyaki Way Expansion',
            'zone_id' => 'westlands',
            'agency' => 'KeNHA',
            'type' => 'road',
            'status' => 'active',
            'progress' => 72,
            'budget' => 'KES 1.2B',
            'started' => '2025-01-15',
            'eta' => '2026-06-30',
            'milestones' => [['date' => '2025-01-15', 'label' => 'Groundbreaking', 'done' => true]],
            'marker_lon' => 36.7950,
            'marker_lat' => -1.2650,
        ]);
    }

    public function test_can_list_projects(): void
    {
        $this->seedZoneAndProject();

        $response = $this->getJson('/api/v1/projects');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonStructure(['data' => ['*' => ['id', 'name', 'zoneId', 'type', 'status', 'progress']]]);
    }

    public function test_can_show_single_project(): void
    {
        $this->seedZoneAndProject();

        $response = $this->getJson('/api/v1/projects/p1');

        $response->assertOk()->assertJsonPath('id', 'p1');
    }

    public function test_show_project_not_found_returns_404(): void
    {
        $response = $this->getJson('/api/v1/projects/nonexistent');

        $response->assertNotFound();
    }
}
