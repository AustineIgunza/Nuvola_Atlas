<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\Zone;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Tests\TestCase;

class ZoneModelTest extends TestCase
{
    public function test_zone_key_type_is_string(): void
    {
        $zone = new Zone;

        $this->assertSame('string', $zone->getKeyType());
        $this->assertFalse($zone->getIncrementing());
    }

    public function test_zone_has_projects_relationship(): void
    {
        $zone = new Zone;

        $this->assertInstanceOf(HasMany::class, $zone->projects());
    }

    public function test_zone_has_alerts_relationship(): void
    {
        $zone = new Zone;

        $this->assertInstanceOf(HasMany::class, $zone->alerts());
    }

    public function test_zone_has_layers_relationship(): void
    {
        $zone = new Zone;

        $this->assertInstanceOf(HasMany::class, $zone->layers());
    }
}
