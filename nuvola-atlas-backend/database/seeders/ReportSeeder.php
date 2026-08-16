<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Report;
use Illuminate\Database\Seeder;

class ReportSeeder extends Seeder
{
    public function run(): void
    {
        $reports = [
            ['id' => 'r1', 'title' => 'Nairobi Q1 2026 Vitality Report', 'zone_id' => null, 'date' => '2026-04-15', 'status' => 'published', 'author' => "Ken N'ganga", 'size_bytes' => 2450000, 'format' => 'PDF'],
            ['id' => 'r2', 'title' => 'Westlands Infrastructure Assessment', 'zone_id' => 'westlands', 'date' => '2026-05-01', 'status' => 'published', 'author' => 'Devyan Jethwa', 'size_bytes' => 1820000, 'format' => 'PDF'],
            ['id' => 'r3', 'title' => 'Kibra Urban Density Analysis', 'zone_id' => 'kibra', 'date' => '2026-05-10', 'status' => 'review', 'author' => 'Joy Nthei', 'size_bytes' => 980000, 'format' => 'PDF'],
            ['id' => 'r4', 'title' => 'Embakasi Substation Impact Study', 'zone_id' => 'embakasi-east', 'date' => '2026-05-18', 'status' => 'review', 'author' => 'Khillon', 'size_bytes' => 1540000, 'format' => 'PDF'],
            ['id' => 'r5', 'title' => 'Mathare Baseline Survey', 'zone_id' => 'mathare', 'date' => '2026-05-20', 'status' => 'draft', 'author' => 'Austine Igunza', 'size_bytes' => 640000, 'format' => 'PDF'],
            ['id' => 'r6', 'title' => 'Nairobi Safety Corridor Mapping', 'zone_id' => null, 'date' => '2026-05-22', 'status' => 'draft', 'author' => "Ken N'ganga", 'size_bytes' => 420000, 'format' => 'PDF'],
            ['id' => 'r7', 'title' => 'Langata Road Dualling Progress', 'zone_id' => 'langata', 'date' => '2026-04-28', 'status' => 'published', 'author' => 'Devyan Jethwa', 'size_bytes' => 1230000, 'format' => 'PDF'],
        ];

        foreach ($reports as $report) {
            Report::create($report);
        }
    }
}
