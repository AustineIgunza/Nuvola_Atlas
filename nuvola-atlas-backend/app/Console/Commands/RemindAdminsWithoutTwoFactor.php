<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\Role;
use App\Mail\TwoFactorReminderMail;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;

/**
 * §9.13 — Force-2FA enrolment escalation for admins.
 *
 * Daily-run command (wired in routes/console.php). For every admin
 * whose email_two_factor_enabled_at is NULL:
 *
 *   - First contact: send 'reminder' email, stamp reminded_at.
 *   - 7+ days after the reminder, still unenrolled, not yet locked:
 *     revoke every Sanctum token they hold, send 'locked' email,
 *     stamp locked_at. Their admin sessions are gone; signing back in
 *     lands them on the enrolment wizard (RequireAdminTwoFactor middleware).
 *   - Already locked or already enrolled: skipped.
 *
 * On successful enrolment, TwoFactorController::emailConfirm clears
 * both timestamps so the same admin can be reminded again if they
 * later disable 2FA.
 */
class RemindAdminsWithoutTwoFactor extends Command
{
    protected $signature = 'nuvola:remind-admin-2fa
        {--grace-days=7 : Days between first reminder and account lock}
        {--dry-run : Print actions but do not send mail or revoke tokens}';

    protected $description = 'Email admins missing 2FA and lock their accounts after the grace window';

    public function handle(): int
    {
        $graceDays = (int) $this->option('grace-days');
        $dryRun = (bool) $this->option('dry-run');
        $now = Carbon::now();

        $admins = User::query()
            ->where('role', Role::Admin->value)
            ->whereNull('email_two_factor_enabled_at')
            ->get();

        $reminded = 0;
        $locked = 0;
        $skipped = 0;

        foreach ($admins as $admin) {
            if ($admin->email_two_factor_locked_at !== null) {
                $skipped++;

                continue;
            }

            if ($admin->email_two_factor_reminded_at === null) {
                $this->info("Reminding admin {$admin->email}");
                if (! $dryRun) {
                    Mail::to($admin->email)->send(new TwoFactorReminderMail(
                        name: $admin->name,
                        stage: 'reminder',
                    ));
                    $admin->forceFill(['email_two_factor_reminded_at' => $now])->save();
                    Audit::record(action: 'user.two_factor_reminder_sent', resource: $admin);
                }
                $reminded++;

                continue;
            }

            $remindedAt = Carbon::parse($admin->email_two_factor_reminded_at);
            if ($remindedAt->copy()->addDays($graceDays)->lessThanOrEqualTo($now)) {
                $this->warn("Locking admin {$admin->email} (grace window expired)");
                if (! $dryRun) {
                    // Revoke every Sanctum token so the admin is forced back
                    // through sign-in, where RequireAdminTwoFactor will gate
                    // /admin/* on enrolment.
                    $admin->tokens()->delete();

                    Mail::to($admin->email)->send(new TwoFactorReminderMail(
                        name: $admin->name,
                        stage: 'locked',
                    ));
                    $admin->forceFill(['email_two_factor_locked_at' => $now])->save();
                    Audit::record(action: 'user.two_factor_locked', resource: $admin);
                }
                $locked++;

                continue;
            }

            $skipped++;
        }

        $this->newLine();
        $this->line("Scan complete: reminded={$reminded} locked={$locked} skipped={$skipped}");

        return self::SUCCESS;
    }
}
