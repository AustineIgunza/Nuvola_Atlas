<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Zone;
use App\Services\ScoreCalculator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds 17 Nairobi sub-counties with per-indicator readings. A handful of
 * indicators are deliberately null to exercise the "8 of 13 indicators
 * active" partial-data UI. Values are plausible relative to each other
 * (informal settlements score lower on social + infra, well-established
 * urban zones higher across the board).
 *
 * Composite scores are computed from the indicators on insert so seeded
 * data matches what ScoreCalculator would produce at runtime.
 */
class ZoneSeeder extends Seeder
{
    public function run(): void
    {
        $zones = [
            // key => [name, lon, lat, last_sync_min, indicators]
            'westlands' => ['Westlands', 36.8048, -1.2673, 4, [
                'healthcare_access' => 82, 'education_access' => 84, 'digital_connectivity' => 80,
                'crime_rates' => 71, 'emergency_response_access' => 73, 'disaster_exposure' => 69,
                'population_density' => 64, 'congestion' => 62, 'housing_pressure' => 66,
                'road_quality' => 80, 'energy_reliability' => 82, 'food_risk' => 78, 'waste_management' => 80,
            ]],
            'dagoretti-north' => ['Dagoretti North', 36.7600, -1.2750, 7, [
                'healthcare_access' => 74, 'education_access' => 76, 'digital_connectivity' => 72,
                'crime_rates' => 68, 'emergency_response_access' => 70, 'disaster_exposure' => 66,
                'population_density' => 70, 'congestion' => 68, 'housing_pressure' => 72,
                'road_quality' => 66, 'energy_reliability' => 68, 'food_risk' => 64, 'waste_management' => null,
            ]],
            'dagoretti-south' => ['Dagoretti South', 36.7450, -1.3050, 12, [
                'healthcare_access' => 62, 'education_access' => 64, 'digital_connectivity' => 60,
                'crime_rates' => 64, 'emergency_response_access' => 66, 'disaster_exposure' => 62,
                'population_density' => 60, 'congestion' => 58, 'housing_pressure' => 62,
                'road_quality' => 68, 'energy_reliability' => 70, 'food_risk' => 66, 'waste_management' => 68,
            ]],
            'langata' => ['Langata', 36.7350, -1.3600, 5, [
                'healthcare_access' => 72, 'education_access' => 74, 'digital_connectivity' => 70,
                'crime_rates' => 74, 'emergency_response_access' => 76, 'disaster_exposure' => 72,
                'population_density' => 55, 'congestion' => 53, 'housing_pressure' => 57,
                'road_quality' => 71, 'energy_reliability' => 73, 'food_risk' => 69, 'waste_management' => 71,
            ]],
            'kibra' => ['Kibra', 36.7850, -1.3150, 18, [
                'healthcare_access' => 48, 'education_access' => 52, 'digital_connectivity' => null,
                'crime_rates' => 52, 'emergency_response_access' => 50, 'disaster_exposure' => 48,
                'population_density' => 58, 'congestion' => 60, 'housing_pressure' => 42,
                'road_quality' => 46, 'energy_reliability' => null, 'food_risk' => 50, 'waste_management' => 44,
            ]],
            'roysambu' => ['Roysambu', 36.8750, -1.2200, 9, [
                'healthcare_access' => 70, 'education_access' => 72, 'digital_connectivity' => 68,
                'crime_rates' => 65, 'emergency_response_access' => 67, 'disaster_exposure' => 63,
                'population_density' => 62, 'congestion' => 60, 'housing_pressure' => 64,
                'road_quality' => 72, 'energy_reliability' => 74, 'food_risk' => 70, 'waste_management' => 72,
            ]],
            'kasarani' => ['Kasarani', 36.9000, -1.2350, 6, [
                'healthcare_access' => 60, 'education_access' => 62, 'digital_connectivity' => 58,
                'crime_rates' => 62, 'emergency_response_access' => 64, 'disaster_exposure' => 60,
                'population_density' => 58, 'congestion' => 56, 'housing_pressure' => 60,
                'road_quality' => 68, 'energy_reliability' => 70, 'food_risk' => 66, 'waste_management' => 68,
            ]],
            'ruaraka' => ['Ruaraka', 36.8800, -1.2500, 11, [
                'healthcare_access' => 68, 'education_access' => 70, 'digital_connectivity' => 66,
                'crime_rates' => 64, 'emergency_response_access' => 66, 'disaster_exposure' => 62,
                'population_density' => 60, 'congestion' => 58, 'housing_pressure' => 62,
                'road_quality' => 70, 'energy_reliability' => 72, 'food_risk' => 68, 'waste_management' => 70,
            ]],
            'embakasi-south' => ['Embakasi South', 36.9100, -1.3300, 14, [
                'healthcare_access' => 55, 'education_access' => 57, 'digital_connectivity' => 53,
                'crime_rates' => 56, 'emergency_response_access' => 58, 'disaster_exposure' => 54,
                'population_density' => 62, 'congestion' => 60, 'housing_pressure' => 64,
                'road_quality' => 58, 'energy_reliability' => 60, 'food_risk' => 56, 'waste_management' => 58,
            ]],
            'embakasi-north' => ['Embakasi North', 36.9050, -1.2800, 8, [
                'healthcare_access' => 60, 'education_access' => 62, 'digital_connectivity' => 58,
                'crime_rates' => 64, 'emergency_response_access' => 66, 'disaster_exposure' => 62,
                'population_density' => 56, 'congestion' => 54, 'housing_pressure' => 58,
                'road_quality' => 66, 'energy_reliability' => 68, 'food_risk' => 64, 'waste_management' => 66,
            ]],
            'embakasi-central' => ['Embakasi Central', 36.8900, -1.3100, 10, [
                'healthcare_access' => 58, 'education_access' => 60, 'digital_connectivity' => 56,
                'crime_rates' => 60, 'emergency_response_access' => 62, 'disaster_exposure' => 58,
                'population_density' => 54, 'congestion' => 52, 'housing_pressure' => 56,
                'road_quality' => 64, 'energy_reliability' => 66, 'food_risk' => 62, 'waste_management' => 64,
            ]],
            'embakasi-east' => ['Embakasi East', 36.9300, -1.2900, 3, [
                'healthcare_access' => 78, 'education_access' => 80, 'digital_connectivity' => 76,
                'crime_rates' => 72, 'emergency_response_access' => 74, 'disaster_exposure' => 70,
                'population_density' => 70, 'congestion' => 68, 'housing_pressure' => 72,
                'road_quality' => 82, 'energy_reliability' => 84, 'food_risk' => 80, 'waste_management' => 82,
            ]],
            'embakasi-west' => ['Embakasi West', 36.8700, -1.3200, 15, [
                'healthcare_access' => 58, 'education_access' => 60, 'digital_connectivity' => 56,
                'crime_rates' => 62, 'emergency_response_access' => 64, 'disaster_exposure' => 60,
                'population_density' => 56, 'congestion' => 54, 'housing_pressure' => 58,
                'road_quality' => 66, 'energy_reliability' => 68, 'food_risk' => 64, 'waste_management' => 66,
            ]],
            'makadara' => ['Makadara', 36.8600, -1.2950, 7, [
                'healthcare_access' => 62, 'education_access' => 64, 'digital_connectivity' => 60,
                'crime_rates' => 66, 'emergency_response_access' => 68, 'disaster_exposure' => 64,
                'population_density' => 58, 'congestion' => 56, 'housing_pressure' => 60,
                'road_quality' => 68, 'energy_reliability' => 70, 'food_risk' => 66, 'waste_management' => 68,
            ]],
            'kamukunji' => ['Kamukunji', 36.8450, -1.2800, 20, [
                'healthcare_access' => 54, 'education_access' => 56, 'digital_connectivity' => null,
                'crime_rates' => 52, 'emergency_response_access' => 54, 'disaster_exposure' => 50,
                'population_density' => 60, 'congestion' => 58, 'housing_pressure' => 62,
                'road_quality' => 58, 'energy_reliability' => 60, 'food_risk' => 56, 'waste_management' => 58,
            ]],
            'starehe' => ['Starehe', 36.8250, -1.2850, 5, [
                'healthcare_access' => 66, 'education_access' => 68, 'digital_connectivity' => 64,
                'crime_rates' => 68, 'emergency_response_access' => 70, 'disaster_exposure' => 66,
                'population_density' => 72, 'congestion' => 70, 'housing_pressure' => 74,
                'road_quality' => 70, 'energy_reliability' => 72, 'food_risk' => 68, 'waste_management' => 70,
            ]],
            'mathare' => ['Mathare', 36.8580, -1.2580, 22, [
                'healthcare_access' => 46, 'education_access' => null, 'digital_connectivity' => null,
                'crime_rates' => 48, 'emergency_response_access' => 46, 'disaster_exposure' => 44,
                'population_density' => 56, 'congestion' => 58, 'housing_pressure' => 40,
                'road_quality' => 44, 'energy_reliability' => 46, 'food_risk' => 48, 'waste_management' => null,
            ]],
        ];

        $now = now();
        $calc = new ScoreCalculator;

        foreach ($zones as $id => [$name, $lon, $lat, $lastSync, $indicators]) {
            $row = array_merge(
                ['id' => $id, 'name' => $name, 'last_sync_min' => $lastSync],
                $this->prefix($indicators, 'indicator_'),
                [
                    'centroid' => DB::raw("ST_MakePoint({$lon}, {$lat})::geography"),
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            );

            // Score gets computed from the indicators via the same calculator
            // that runs in production so seed data matches production behaviour.
            $tempZone = (new Zone)->forceFill($row);
            $row['score'] = $calc->calculateScore($tempZone) ?? 0;

            DB::table('zones')->insert($row);
        }
    }

    /**
     * @param  array<string, int|null>  $values
     * @return array<string, int|null>
     */
    private function prefix(array $values, string $prefix): array
    {
        $out = [];
        foreach ($values as $k => $v) {
            $out[$prefix.$k] = $v;
        }

        return $out;
    }
}
