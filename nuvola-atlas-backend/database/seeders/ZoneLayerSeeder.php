<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\ZoneLayer;
use Illuminate\Database\Seeder;

class ZoneLayerSeeder extends Seeder
{
    public function run(): void
    {
        $zones = $this->zoneCoordinates();

        foreach ($zones as $zoneId => $center) {
            ZoneLayer::create([
                'zone_id' => $zoneId,
                'layer_type' => 'road_progress',
                'geojson' => $this->roadProgressLayer($center[0], $center[1], $zoneId),
            ]);

            ZoneLayer::create([
                'zone_id' => $zoneId,
                'layer_type' => 'smart_grid',
                'geojson' => $this->smartGridLayer($center[0], $center[1], $zoneId),
            ]);

            ZoneLayer::create([
                'zone_id' => $zoneId,
                'layer_type' => 'density',
                'geojson' => $this->densityLayer($center[0], $center[1], $zoneId),
            ]);
        }
    }

    private function zoneCoordinates(): array
    {
        return [
            'westlands' => [36.8048, -1.2673],
            'dagoretti-north' => [36.7600, -1.2750],
            'dagoretti-south' => [36.7450, -1.3050],
            'langata' => [36.7350, -1.3600],
            'kibra' => [36.7850, -1.3150],
            'roysambu' => [36.8750, -1.2200],
            'kasarani' => [36.9000, -1.2350],
            'ruaraka' => [36.8800, -1.2500],
            'embakasi-south' => [36.9100, -1.3300],
            'embakasi-north' => [36.9050, -1.2800],
            'embakasi-central' => [36.8900, -1.3100],
            'embakasi-east' => [36.9300, -1.2900],
            'embakasi-west' => [36.8700, -1.3200],
            'makadara' => [36.8600, -1.2950],
            'kamukunji' => [36.8450, -1.2800],
            'starehe' => [36.8250, -1.2850],
            'mathare' => [36.8580, -1.2580],
        ];
    }

    private function roadProgressLayer(float $lng, float $lat, string $zoneId): array
    {
        $roads = [
            'westlands' => [
                ['name' => 'Waiyaki Way Expansion', 'status' => 'in-progress'],
                ['name' => 'Parklands Ring Road', 'status' => 'complete'],
                ['name' => 'Museum Hill Interchange Link', 'status' => 'planned'],
            ],
            'kasarani' => [
                ['name' => 'Thika Superhighway Service Road', 'status' => 'in-progress'],
                ['name' => 'Kasarani-Mwiki Road', 'status' => 'complete'],
                ['name' => 'Stadium Access Road', 'status' => 'planned'],
            ],
            'starehe' => [
                ['name' => 'Inner Ring Resurfacing', 'status' => 'in-progress'],
                ['name' => 'Uhuru Highway Median', 'status' => 'complete'],
                ['name' => 'CBD Pedestrian Zone', 'status' => 'planned'],
            ],
            'embakasi-east' => [
                ['name' => 'Airport North Access', 'status' => 'complete'],
                ['name' => 'Utawala Bypass', 'status' => 'in-progress'],
                ['name' => 'Embakasi-Ruai Link', 'status' => 'in-progress'],
            ],
            'langata' => [
                ['name' => 'Langata Road Dualling', 'status' => 'in-progress'],
                ['name' => 'Mbagathi Way Extension', 'status' => 'complete'],
                ['name' => 'Karen-Hardy Link', 'status' => 'planned'],
            ],
        ];

        $zoneRoads = $roads[$zoneId] ?? [
            ['name' => 'Main Road Upgrade', 'status' => 'in-progress'],
            ['name' => 'Local Access Road', 'status' => 'complete'],
            ['name' => 'Collector Road Planned', 'status' => 'planned'],
        ];

        $features = [];
        foreach ($zoneRoads as $i => $road) {
            $offset = ($i - 1) * 0.005;
            $features[] = [
                'type' => 'Feature',
                'properties' => [
                    'name' => $road['name'],
                    'status' => $road['status'],
                ],
                'geometry' => [
                    'type' => 'LineString',
                    'coordinates' => [
                        [$lng - 0.012 + $offset, $lat - 0.005],
                        [$lng - 0.004 + $offset, $lat + 0.002],
                        [$lng + 0.006 + $offset, $lat + 0.003],
                        [$lng + 0.012 + $offset, $lat - 0.001],
                    ],
                ],
            ];
        }

        return [
            'type' => 'FeatureCollection',
            'features' => $features,
        ];
    }

    private function smartGridLayer(float $lng, float $lat, string $zoneId): array
    {
        $grids = [
            'westlands' => [
                ['type' => 'substation', 'name' => 'Parklands Substation', 'status' => 'active'],
                ['type' => 'transformer', 'name' => 'Westlands Mall Tx', 'status' => 'active'],
                ['type' => 'line', 'name' => 'Westlands-Chiromo Feeder', 'status' => 'active'],
            ],
            'embakasi-east' => [
                ['type' => 'substation', 'name' => 'Embakasi Substation', 'status' => 'upgrading'],
                ['type' => 'transformer', 'name' => 'Pipeline Tx', 'status' => 'active'],
                ['type' => 'line', 'name' => 'Ruai-Pipeline Feeder', 'status' => 'active'],
            ],
            'kasarani' => [
                ['type' => 'substation', 'name' => 'Kasarani Substation', 'status' => 'active'],
                ['type' => 'transformer', 'name' => 'Thika Road Tx', 'status' => 'active'],
                ['type' => 'line', 'name' => 'Kasarani-Roysambu Feeder', 'status' => 'planned'],
            ],
        ];

        $zoneGrid = $grids[$zoneId] ?? [
            ['type' => 'substation', 'name' => 'Local Substation', 'status' => 'active'],
            ['type' => 'transformer', 'name' => 'Area Transformer', 'status' => 'active'],
            ['type' => 'line', 'name' => 'Distribution Line', 'status' => 'active'],
        ];

        $features = [];
        foreach ($zoneGrid as $i => $node) {
            $dx = ($i - 1) * 0.008;
            $dy = ($i - 1) * 0.004;

            if ($node['type'] === 'line') {
                $features[] = [
                    'type' => 'Feature',
                    'properties' => $node,
                    'geometry' => [
                        'type' => 'LineString',
                        'coordinates' => [
                            [$lng - 0.008, $lat - 0.004],
                            [$lng, $lat],
                            [$lng + 0.008, $lat + 0.004],
                        ],
                    ],
                ];
            } else {
                $features[] = [
                    'type' => 'Feature',
                    'properties' => $node,
                    'geometry' => [
                        'type' => 'Point',
                        'coordinates' => [$lng + $dx, $lat + $dy],
                    ],
                ];
            }
        }

        return [
            'type' => 'FeatureCollection',
            'features' => $features,
        ];
    }

    private function densityLayer(float $lng, float $lat, string $zoneId): array
    {
        $densities = [
            'westlands' => [
                ['level' => 'high', 'population' => 45000, 'name' => 'Parklands'],
                ['level' => 'medium', 'population' => 28000, 'name' => 'Highridge'],
                ['level' => 'low', 'population' => 12000, 'name' => 'Spring Valley'],
            ],
            'kibra' => [
                ['level' => 'high', 'population' => 85000, 'name' => 'Kibera Core'],
                ['level' => 'high', 'population' => 62000, 'name' => 'Laini Saba'],
                ['level' => 'medium', 'population' => 35000, 'name' => 'Olympic'],
            ],
            'starehe' => [
                ['level' => 'high', 'population' => 52000, 'name' => 'CBD'],
                ['level' => 'medium', 'population' => 38000, 'name' => 'Ngara'],
                ['level' => 'medium', 'population' => 31000, 'name' => 'Pangani'],
            ],
            'mathare' => [
                ['level' => 'high', 'population' => 78000, 'name' => 'Mathare Core'],
                ['level' => 'high', 'population' => 55000, 'name' => 'Huruma'],
                ['level' => 'medium', 'population' => 32000, 'name' => 'Mlango Kubwa'],
            ],
        ];

        $zoneDensity = $densities[$zoneId] ?? [
            ['level' => 'medium', 'population' => 30000, 'name' => 'Central Area'],
            ['level' => 'low', 'population' => 15000, 'name' => 'Residential Area'],
            ['level' => 'low', 'population' => 10000, 'name' => 'Peri-urban Area'],
        ];

        $features = [];
        foreach ($zoneDensity as $i => $area) {
            $dx = ($i - 1) * 0.008;
            $dy = ($i - 1) * 0.006;
            $r = 0.005;

            $features[] = [
                'type' => 'Feature',
                'properties' => [
                    'level' => $area['level'],
                    'population' => $area['population'],
                    'name' => $area['name'],
                ],
                'geometry' => [
                    'type' => 'Polygon',
                    'coordinates' => [[
                        [$lng + $dx - $r, $lat + $dy - $r],
                        [$lng + $dx + $r, $lat + $dy - $r],
                        [$lng + $dx + $r, $lat + $dy + $r],
                        [$lng + $dx - $r, $lat + $dy + $r],
                        [$lng + $dx - $r, $lat + $dy - $r],
                    ]],
                ],
            ];
        }

        return [
            'type' => 'FeatureCollection',
            'features' => $features,
        ];
    }
}
