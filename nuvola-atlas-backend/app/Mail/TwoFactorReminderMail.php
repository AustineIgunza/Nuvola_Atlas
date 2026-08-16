<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent by the nuvola:remind-admin-2fa command to admins who haven't
 * enrolled in two-factor yet. Two stages, controlled by $stage:
 *
 *   'reminder' — first nudge. Friendly but explicit about the 7-day
 *                grace window before access is suspended.
 *   'locked'   — escalation. Their tokens have been revoked; signing
 *                back in lands them on the enrolment wizard.
 *
 * Reuses the same Blade template as TwoFactorCodeMail (raw text body).
 * No links, no images — partner mail clients are friendlier to plain.
 */
class TwoFactorReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $name,
        public string $stage,
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->stage === 'locked'
            ? 'Your Nuvola Atlas admin access is suspended pending two-factor enrolment'
            : 'Please enrol in two-factor authentication for Nuvola Atlas';

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        $body = $this->stage === 'locked' ? $this->lockedBody() : $this->reminderBody();

        return new Content(text: 'mail.two-factor-code', with: [
            'body' => $body,
            'code' => '',
        ]);
    }

    private function reminderBody(): string
    {
        return <<<TEXT
Hi {$this->name},

This is a reminder to enrol your Nuvola Atlas admin account in
two-factor authentication.

Two-factor adds an emailed 6-digit code on top of your password, so a
stolen password is not enough to reach the admin dashboard.

How to enrol:
  1. Sign in at https://atlas.nuvola.dev/sign-in
  2. Open the Admin page (top-right of the sidebar)
  3. Click "Set up 2FA" and follow the on-screen steps

If you do not enrol within 7 days, your admin sessions will be revoked
automatically and you will need to enrol before you can sign back in.

— Nuvola Atlas
TEXT;
    }

    private function lockedBody(): string
    {
        return <<<TEXT
Hi {$this->name},

Your Nuvola Atlas admin access has been suspended because your account
has been without two-factor authentication for more than 7 days.

What this means:
  - Your existing API tokens have been revoked.
  - You can still sign in, but the admin dashboard will only show the
    two-factor enrolment wizard until you finish enrolling.

How to clear the lock:
  1. Sign in at https://atlas.nuvola.dev/sign-in
  2. Follow the on-screen prompt to enrol in two-factor.
  3. Once enrolled, your admin access is restored on the next sign-in.

If you believe this is in error, contact another admin from the team.

— Nuvola Atlas
TEXT;
    }
}
