<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\FirmTier;
use App\Models\Firm;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Three dev firms — one per tier — so the /admin/firms + /investor/*
 * surfaces have something to render locally.
 *
 * Stable UUIDs (Str::uuid5 keyed on the slug) so re-running the seeder
 * doesn't churn IDs and break linked seeders (FirmUserSeeder,
 * FirmWatchlistSeeder).
 */
class FirmSeeder extends Seeder
{
    public const NAMESPACE_UUID = 'a7f2e1c8-4b6d-4e7a-9f2b-3c4d5e6f7a8b';

    public function run(): void
    {
        $firms = [
            [
                'slug' => 'acumen-east-africa',
                'name' => 'Acumen East Africa',
                'tier' => FirmTier::Deal,
                'contact_name' => 'Amina Otieno',
                'contact_email' => 'amina@acumen.example',
                'website' => 'https://acumen.org',
            ],
            [
                'slug' => 'andela-ventures',
                'name' => 'Andela Ventures',
                'tier' => FirmTier::Basic,
                'contact_name' => 'Daniel Ochieng',
                'contact_email' => 'ventures@andela.example',
                'website' => 'https://andela.com',
            ],
            [
                'slug' => 'gcf-nairobi-corridor',
                'name' => 'GCF Nairobi Corridor',
                'tier' => FirmTier::Sovereign,
                'contact_name' => 'Priya Ramesh',
                'contact_email' => 'nairobi@greenclimate.example',
                'website' => 'https://greenclimate.fund',
            ],
        ];

        foreach ($firms as $data) {
            Firm::updateOrCreate(
                ['slug' => $data['slug']],
                [
                    'id' => (string) Str::uuid5(self::NAMESPACE_UUID, $data['slug']),
                    'name' => $data['name'],
                    'tier' => $data['tier'],
                    'contact_name' => $data['contact_name'],
                    'contact_email' => $data['contact_email'],
                    'website' => $data['website'],
                    'active' => true,
                ],
            );
        }
    }
}
