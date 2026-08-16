<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Endpoint that Laravel's SendEmailVerificationNotification links to. The
 * incoming URL is signed by Laravel, so we do not require an authenticated
 * session — the signature is the auth. Once the address is confirmed, redirect
 * the user to the frontend so they land in the app instead of on a JSON blob.
 */
class VerifyEmailController extends Controller
{
    public function __invoke(Request $request, int $id, string $hash): RedirectResponse
    {
        $user = User::findOrFail($id);

        // Guard against link forgery — the hash must match the current email.
        if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            abort(403, 'Invalid verification link.');
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        // Send the user back to the SPA. APP_FRONTEND_URL is the canonical
        // frontend host (set on Fly); falls back to APP_URL for local dev.
        $frontend = rtrim((string) config('app.frontend_url', config('app.url', '/')), '/');

        return redirect()->away($frontend.'/sign-in?verified=1');
    }
}
