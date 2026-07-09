<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Zone;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ZoneExportApiTest extends TestCase
{
    private function seedZone(): Zone
    {
        $zone = Zone::create([
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
        DB::statement(
            "UPDATE zones SET centroid = ST_MakePoint(36.8048, -1.2673)::geography WHERE id = ?",
            ['westlands']
        );
        return $zone;
    }

    public function test_default_format_is_pdf(): void
    {
        $this->seedZone();
        $r = $this->get('/api/v1/zones/westlands/export');
        $r->assertOk();
        $r->assertHeader('Content-Type', 'application/pdf');
        // PDF header magic bytes.
        $this->assertSame('%PDF-', substr($r->getContent(), 0, 5));
    }

    public function test_txt_export_contains_score_and_pillars(): void
    {
        $this->seedZone();
        $r = $this->get('/api/v1/zones/westlands/export?format=txt');
        $r->assertOk()->assertHeader('Content-Type', 'text/plain; charset=UTF-8');
        $body = $r->getContent();
        $this->assertStringContainsString('Vitality Score: 76/100', $body);
        $this->assertStringContainsString('Social Wellbeing:    82', $body);
    }

    public function test_docx_export_is_a_zip(): void
    {
        $this->seedZone();
        $r = $this->get('/api/v1/zones/westlands/export?format=docx');
        $r->assertOk();
        $r->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        // DOCX is a ZIP under the hood — first bytes are `PK\x03\x04`.
        $this->assertSame("PK\x03\x04", substr($r->getContent(), 0, 4));
    }

    public function test_invalid_format_returns_422(): void
    {
        $this->seedZone();
        $r = $this->get('/api/v1/zones/westlands/export?format=csv');
        $r->assertStatus(422);
    }

    public function test_unknown_zone_returns_404(): void
    {
        $r = $this->get('/api/v1/zones/nowhere/export');
        $r->assertNotFound();
    }

    public function test_filename_includes_zone_id(): void
    {
        $this->seedZone();
        $r = $this->get('/api/v1/zones/westlands/export?format=txt');
        $r->assertHeader('Content-Disposition', 'attachment; filename="westlands-vitality-report.txt"');
    }
}
