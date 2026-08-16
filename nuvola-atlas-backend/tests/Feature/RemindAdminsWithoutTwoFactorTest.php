<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\Role;
use App\Mail\TwoFactorReminderMail;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class RemindAdminsWithoutTwoFactorTest extends TestCase
{
    public function test_first_run_emails_unenrolled_admin_and_stamps_reminded_at(): void
    {
        Mail::fake();

        $admin = User::factory()->create([
            'role' => Role::Admin,
            'email_two_factor_enabled_at' => null,
            'email_two_factor_reminded_at' => null,
            'email_two_factor_locked_at' => null,
        ]);

        $this->artisan('nuvola:remind-admin-2fa')->assertSuccessful();

        Mail::assertSent(TwoFactorReminderMail::class, function (TwoFactorReminderMail $mail) use ($admin) {
            return $mail->hasTo($admin->email) && $mail->stage === 'reminder';
        });

        $admin->refresh();
        $this->assertNotNull($admin->email_two_factor_reminded_at);
        $this->assertNull($admin->email_two_factor_locked_at);

        $this->assertSame(1, AuditLog::where('action', 'user.two_factor_reminder_sent')->count());
    }

    public function test_second_run_inside_grace_window_is_a_noop(): void
    {
        Mail::fake();

        $admin = User::factory()->create([
            'role' => Role::Admin,
            'email_two_factor_enabled_at' => null,
            'email_two_factor_reminded_at' => now()->subDays(3),
            'email_two_factor_locked_at' => null,
        ]);

        $this->artisan('nuvola:remind-admin-2fa')->assertSuccessful();

        Mail::assertNothingSent();

        $admin->refresh();
        $this->assertSame(0, AuditLog::where('action', 'user.two_factor_locked')->count());
        $this->assertNull($admin->email_two_factor_locked_at);
    }

    public function test_after_grace_window_admin_is_locked_tokens_revoked_audit_logged(): void
    {
        Mail::fake();

        $admin = User::factory()->create([
            'role' => Role::Admin,
            'email_two_factor_enabled_at' => null,
            'email_two_factor_reminded_at' => now()->subDays(8),
            'email_two_factor_locked_at' => null,
        ]);

        // Seed a couple of Sanctum tokens so we can prove they're revoked.
        $admin->createToken('one');
        $admin->createToken('two');
        $this->assertSame(2, $admin->tokens()->count());

        $this->artisan('nuvola:remind-admin-2fa')->assertSuccessful();

        Mail::assertSent(TwoFactorReminderMail::class, function (TwoFactorReminderMail $mail) use ($admin) {
            return $mail->hasTo($admin->email) && $mail->stage === 'locked';
        });

        $admin->refresh();
        $this->assertNotNull($admin->email_two_factor_locked_at);
        $this->assertSame(0, $admin->tokens()->count(), 'Expected all Sanctum tokens to be revoked on lock');

        $this->assertSame(1, AuditLog::where('action', 'user.two_factor_locked')->count());
    }

    public function test_already_locked_admin_is_skipped(): void
    {
        Mail::fake();

        $admin = User::factory()->create([
            'role' => Role::Admin,
            'email_two_factor_enabled_at' => null,
            'email_two_factor_reminded_at' => now()->subDays(20),
            'email_two_factor_locked_at' => now()->subDays(13),
        ]);

        $this->artisan('nuvola:remind-admin-2fa')->assertSuccessful();

        Mail::assertNothingSent();
        $this->assertSame(0, AuditLog::where('action', 'user.two_factor_locked')->count());
        $this->assertSame(0, AuditLog::where('action', 'user.two_factor_reminder_sent')->count());
    }

    public function test_enrolled_admin_is_ignored(): void
    {
        Mail::fake();

        User::factory()->create([
            'role' => Role::Admin,
            'email_two_factor_enabled_at' => now()->subWeek(),
        ]);

        $this->artisan('nuvola:remind-admin-2fa')->assertSuccessful();

        Mail::assertNothingSent();
    }

    public function test_non_admin_users_are_ignored_even_without_two_factor(): void
    {
        Mail::fake();

        User::factory()->editor()->create(['email_two_factor_enabled_at' => null]);
        User::factory()->partner()->create(['email_two_factor_enabled_at' => null]);
        User::factory()->create(['role' => Role::Viewer, 'email_two_factor_enabled_at' => null]);

        $this->artisan('nuvola:remind-admin-2fa')->assertSuccessful();

        Mail::assertNothingSent();
    }

    public function test_dry_run_does_not_send_mail_or_update_state(): void
    {
        Mail::fake();

        $admin = User::factory()->create([
            'role' => Role::Admin,
            'email_two_factor_enabled_at' => null,
        ]);

        $this->artisan('nuvola:remind-admin-2fa', ['--dry-run' => true])->assertSuccessful();

        Mail::assertNothingSent();
        $admin->refresh();
        $this->assertNull($admin->email_two_factor_reminded_at);
        $this->assertNull($admin->email_two_factor_locked_at);
    }

    public function test_enrolment_clears_reminder_and_lock_state(): void
    {
        $admin = User::factory()->create([
            'role' => Role::Admin,
            'email_two_factor_enabled_at' => null,
            'email_two_factor_reminded_at' => now()->subDays(5),
            'email_two_factor_locked_at' => now()->subDays(1),
        ]);

        // Stash a code in the cache that emailConfirm will accept.
        Cache::put('auth.two_factor_enrol:'.$admin->id, '123456', 300);

        $this->actingAs($admin)
            ->postJson('/api/v1/auth/2fa/email/confirm', ['code' => '123456'])
            ->assertOk();

        $admin->refresh();
        $this->assertNotNull($admin->email_two_factor_enabled_at);
        $this->assertNull($admin->email_two_factor_reminded_at);
        $this->assertNull($admin->email_two_factor_locked_at);
    }
}
