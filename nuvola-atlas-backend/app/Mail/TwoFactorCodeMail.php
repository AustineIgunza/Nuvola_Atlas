<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * One-time 6-digit code emailed for 2FA enrolment or sign-in challenge.
 * Inline-only — no view file, no images, no analytics pixels. Lowest
 * friction for partners' mail clients and least surface area.
 */
class TwoFactorCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $code,
        public string $purpose,
        public int $ttlSeconds,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Nuvola Atlas verification code',
        );
    }

    public function content(): Content
    {
        $minutes = max(1, (int) round($this->ttlSeconds / 60));
        $purposeLine = $this->purpose === 'sign_in'
            ? 'Use this code to finish signing in to Nuvola Atlas.'
            : 'Use this code to finish enrolling in two-factor authentication.';

        $body = <<<TEXT
{$purposeLine}

Your code is: {$this->code}

It expires in {$minutes} minute(s). If you didn't request it, ignore
this email — your account is unchanged.

— Nuvola Atlas
TEXT;

        return new Content(text: 'mail.two-factor-code', with: [
            'body' => $body,
            'code' => $this->code,
        ]);
    }
}
