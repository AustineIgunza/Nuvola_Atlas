<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Alert;
use Illuminate\Database\Seeder;

class AlertSeeder extends Seeder
{
    public function run(): void
    {
        $alerts = [
            ['id' => 'a1', 'severity' => 'high', 'kind' => 'infra', 'title' => 'Inner Ring Resurfacing stalled', 'body' => 'Contractor has not mobilized equipment for 45 days. KURA issued a show-cause notice on May 10. Project timeline at risk.', 'zone_id' => 'starehe', 'created_at' => '2026-05-20 09:30:00', 'read' => false],
            ['id' => 'a2', 'severity' => 'medium', 'kind' => 'vitality', 'title' => 'Kibra safety score dropped 4 pts', 'body' => 'Safety & Security pillar for Kibra fell from 56 to 52 following two reported infrastructure vandalism incidents in April.', 'zone_id' => 'kibra', 'created_at' => '2026-05-18 14:00:00', 'read' => false],
            ['id' => 'a3', 'severity' => 'low', 'kind' => 'esia', 'title' => 'ESIA published for Mathare Distribution Line', 'body' => 'Environmental and Social Impact Assessment for the Mathare Distribution Line project is now publicly available on the NEMA portal.', 'zone_id' => 'mathare', 'created_at' => '2026-05-15 11:00:00', 'read' => false],
            ['id' => 'a4', 'severity' => 'high', 'kind' => 'system', 'title' => 'KPLC data feed interrupted', 'body' => 'The automated feed from Kenya Power has not delivered updates in 72 hours. Energy layer data may be stale for affected zones.', 'zone_id' => null, 'created_at' => '2026-05-22 07:15:00', 'read' => false],
            ['id' => 'a5', 'severity' => 'medium', 'kind' => 'partner', 'title' => 'Nairobi County GIS unit MOU signed', 'body' => 'Letter of intent signed with Nairobi County GIS unit for pilot data sharing. Integration timeline TBD.', 'zone_id' => null, 'created_at' => '2026-05-12 16:30:00', 'read' => true],
            ['id' => 'a6', 'severity' => 'low', 'kind' => 'vitality', 'title' => 'Embakasi East tops leaderboard', 'body' => 'Embakasi East has overtaken Westlands for the highest overall Vitality score (76) following infrastructure upgrades at the KETRACO substation.', 'zone_id' => 'embakasi-east', 'created_at' => '2026-05-10 10:00:00', 'read' => true],
        ];

        foreach ($alerts as $alert) {
            Alert::create($alert);
        }
    }
}
