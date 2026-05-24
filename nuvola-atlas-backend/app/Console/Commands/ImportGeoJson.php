<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Events\ZoneLayerUpdated;
use App\Models\Zone;
use App\Models\ZoneLayer;
use Illuminate\Console\Command;

class ImportGeoJson extends Command
{
    protected $signature = 'atlas:import-geojson
                            {file : Path to GeoJSON file}
                            {--zone= : Zone ID (required)}
                            {--layer= : Layer type: road_progress, smart_grid, or density (required)}
                            {--broadcast : Fire broadcast event after import}';

    protected $description = 'Import a GeoJSON FeatureCollection into a zone layer';

    public function handle(): int
    {
        $file = $this->argument('file');
        $zoneId = $this->option('zone');
        $layerType = $this->option('layer');

        if (! $zoneId || ! $layerType) {
            $this->error('Both --zone and --layer options are required.');

            return self::FAILURE;
        }

        $validTypes = ['road_progress', 'smart_grid', 'density'];
        if (! in_array($layerType, $validTypes)) {
            $this->error("Invalid layer type. Must be one of: ".implode(', ', $validTypes));

            return self::FAILURE;
        }

        if (! Zone::find($zoneId)) {
            $this->error("Zone '{$zoneId}' not found.");

            return self::FAILURE;
        }

        if (! file_exists($file)) {
            $this->error("File not found: {$file}");

            return self::FAILURE;
        }

        $contents = file_get_contents($file);
        $geojson = json_decode($contents, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->error('Invalid JSON: '.json_last_error_msg());

            return self::FAILURE;
        }

        if (($geojson['type'] ?? null) !== 'FeatureCollection') {
            $this->error('GeoJSON must be a FeatureCollection.');

            return self::FAILURE;
        }

        $layer = ZoneLayer::updateOrCreate(
            ['zone_id' => $zoneId, 'layer_type' => $layerType],
            ['geojson' => $geojson]
        );

        $featureCount = count($geojson['features'] ?? []);
        $this->info("Imported {$featureCount} features into {$zoneId}/{$layerType}.");

        if ($this->option('broadcast')) {
            ZoneLayerUpdated::dispatch($layer);
        }

        return self::SUCCESS;
    }
}
