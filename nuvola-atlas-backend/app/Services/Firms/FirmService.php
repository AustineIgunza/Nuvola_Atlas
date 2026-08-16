<?php

declare(strict_types=1);

namespace App\Services\Firms;

use App\Enums\FirmTier;
use App\Enums\FirmUserRole;
use App\Models\Firm;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Firm CRUD + intra-firm role management. Wraps the raw model access so
 * controllers stay thin and every write is transactional. Audit rows are
 * written by `AdminFirmController` via explicit `Audit::record` calls, which
 * carry the resource and the semantic action — this service only owns the DB
 * transitions.
 */
class FirmService
{
    /**
     * @param  array{name: string, slug?: string, tier: string, contact_email?: ?string, contact_name?: ?string, website?: ?string, active?: bool} $data
     */
    public function create(array $data): Firm
    {
        return DB::transaction(function () use ($data) {
            return Firm::create([
                'id' => (string) Str::uuid(),
                'name' => $data['name'],
                'slug' => $data['slug'] ?? Str::slug($data['name']),
                'tier' => FirmTier::from($data['tier']),
                'contact_email' => $data['contact_email'] ?? null,
                'contact_name' => $data['contact_name'] ?? null,
                'website' => $data['website'] ?? null,
                'active' => $data['active'] ?? true,
            ]);
        });
    }

    /**
     * @param  array{name?: string, slug?: string, tier?: string, contact_email?: ?string, contact_name?: ?string, website?: ?string, active?: bool} $data
     */
    public function update(Firm $firm, array $data): Firm
    {
        return DB::transaction(function () use ($firm, $data) {
            $updates = collect($data)
                ->filter(fn ($value, $key) => $key !== 'tier' && $value !== null)
                ->toArray();

            if (isset($data['tier'])) {
                $updates['tier'] = FirmTier::from($data['tier']);
            }

            $firm->fill($updates)->save();
            return $firm->refresh();
        });
    }

    public function deactivate(Firm $firm): Firm
    {
        return DB::transaction(function () use ($firm) {
            $firm->active = false;
            $firm->save();
            return $firm->refresh();
        });
    }

    public function attachUser(Firm $firm, User $user, FirmUserRole $role = FirmUserRole::Analyst): void
    {
        DB::transaction(function () use ($firm, $user, $role) {
            $firm->users()->syncWithoutDetaching([
                $user->id => ['role_within_firm' => $role->value],
            ]);
            if ($user->primary_firm_id === null) {
                $user->primary_firm_id = $firm->id;
                $user->save();
            }
        });
    }

    public function detachUser(Firm $firm, User $user): void
    {
        DB::transaction(function () use ($firm, $user) {
            $firm->users()->detach($user->id);
            if ((string) $user->primary_firm_id === (string) $firm->id) {
                $user->primary_firm_id = null;
                $user->save();
            }
        });
    }
}
