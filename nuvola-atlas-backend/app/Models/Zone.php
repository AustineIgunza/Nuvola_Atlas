<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Zone extends Model
{
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    /**
     * Pillar deltas batch-loaded by PillarDeltaCalculator before rendering.
     * A plain property rather than an attribute so Eloquent never tries to
     * persist it; null means "not loaded", which ZoneResource reports as
     * unknown rather than as no movement.
     *
     * @var array{deltas: array{social: ?int, safety: ?int, density: ?int, infra: ?int}, windowDays: ?int}|null
     */
    public ?array $pillarDelta = null;

    public function scopeWithCentroid($query)
    {
        return $query->selectRaw('*, ST_X(centroid::geometry) as lon, ST_Y(centroid::geometry) as lat');
    }

    public function scopeWithBoundary($query)
    {
        return $query->selectRaw('*, ST_AsGeoJSON(boundary::geometry) as boundary_geojson');
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function alerts(): HasMany
    {
        return $this->hasMany(Alert::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    public function layers(): HasMany
    {
        return $this->hasMany(ZoneLayer::class);
    }

    public function touchLastSync(): void
    {
        $this->update(['last_sync_min' => 0]);
    }
}
