<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\VitalityHistory;
use Illuminate\Database\Seeder;

class HistorySeeder extends Seeder
{
    public function run(): void
    {
        $points = [
            ['month' => "Jun '25", 'overall_avg' => 61.0],
            ['month' => "Jul '25", 'overall_avg' => 61.5],
            ['month' => "Aug '25", 'overall_avg' => 62.0],
            ['month' => "Sep '25", 'overall_avg' => 62.8],
            ['month' => "Oct '25", 'overall_avg' => 63.5],
            ['month' => "Nov '25", 'overall_avg' => 64.0],
            ['month' => "Dec '25", 'overall_avg' => 65.0],
            ['month' => "Jan '26", 'overall_avg' => 65.8],
            ['month' => "Feb '26", 'overall_avg' => 66.5],
            ['month' => "Mar '26", 'overall_avg' => 67.2],
            ['month' => "Apr '26", 'overall_avg' => 68.0],
            ['month' => "May '26", 'overall_avg' => 69.0],
        ];

        foreach ($points as $point) {
            VitalityHistory::create($point);
        }
    }
}
