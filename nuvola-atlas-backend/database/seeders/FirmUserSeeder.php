<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Firm;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * One investor account per firm for local dev + preview.
 *
 * Each user gets `primary_firm_id` set so /investor/me lands on the right
 * firm without needing an intra-firm role picker. `firm_users` pivot row
 * is written as `admin` intra-firm so the account can exercise every
 * /investor/* write path locally.
 */
class FirmUserSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            'acumen-east-africa' => [
                'name' => 'Amina Otieno',
                'email' => 'investor+acumen@navuuna.dev',
            ],
            'andela-ventures' => [
                'name' => 'Daniel Ochieng',
                'email' => 'investor+andela@navuuna.dev',
            ],
            'gcf-nairobi-corridor' => [
                'name' => 'Priya Ramesh',
                'email' => 'investor+gcf@navuuna.dev',
            ],
        ];

        foreach ($accounts as $firmSlug => $account) {
            $firm = Firm::where('slug', $firmSlug)->first();
            if (! $firm) {
                continue;
            }

            $user = User::updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => Hash::make('password'),
                    'role' => 'partner',
                    'primary_firm_id' => $firm->id,
                    'email_verified_at' => now(),
                ],
            );

            $firm->users()->syncWithoutDetaching([
                $user->id => ['role_within_firm' => 'admin'],
            ]);
        }
    }
}
