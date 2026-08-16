<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

/**
 * Google OAuth sign-in / sign-up.
 *
 * Flow:
 *   1. Frontend calls GET /api/v1/auth/google/redirect. We return the
 *      Google consent URL as JSON (SPA-friendly) so the browser can
 *      window.location.assign() to it.
 *   2. Google bounces back to /api/v1/auth/google/callback?code=... . We
 *      exchange for the user's profile, match by google_id first,
 *      email second, else create a new viewer.
 *   3. We mint a Sanctum token and redirect the browser to
 *      {FRONTEND_URL}/auth/google/complete?token=... — the SPA reads
 *      the token from the querystring and finishes sign-in.
 */
class GoogleAuthController extends Controller
{
    public function redirect(): JsonResponse
    {
        if (! $this->configured()) {
            return response()->json([
                'type' => 'https://navuuna.dev/problems/oauth-not-configured',
                'title' => 'Google OAuth not configured',
                'status' => 503,
                'detail' => 'Set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in .env, then restart the API.',
            ], 503, ['Content-Type' => 'application/problem+json']);
        }

        $url = Socialite::driver('google')
            ->stateless()
            ->scopes(['openid', 'profile', 'email'])
            ->redirect()
            ->getTargetUrl();

        return response()->json(['authorize_url' => $url]);
    }

    public function callback(): RedirectResponse
    {
        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');

        if (! $this->configured()) {
            return redirect()->away($frontendUrl.'/sign-in?error=oauth_not_configured');
        }

        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (Throwable $e) {
            Log::warning('Google OAuth callback failed', ['error' => $e->getMessage()]);

            return redirect()->away($frontendUrl.'/sign-in?error=oauth_callback_failed');
        }

        try {
            $user = DB::transaction(function () use ($googleUser) {
                $existing = User::where('google_id', $googleUser->getId())->first()
                    ?? User::where('email', $googleUser->getEmail())->first();

                if ($existing) {
                    $existing->fill([
                        'google_id' => $googleUser->getId(),
                        'avatar_url' => $googleUser->getAvatar(),
                        'oauth_provider' => 'google',
                        'email_verified_at' => $existing->email_verified_at ?? now(),
                        'last_active_at' => now(),
                    ])->save();

                    return $existing;
                }

                return User::create([
                    'name' => $googleUser->getName() ?? $googleUser->getEmail(),
                    'email' => $googleUser->getEmail(),
                    'password' => bcrypt(bin2hex(random_bytes(16))),
                    'google_id' => $googleUser->getId(),
                    'avatar_url' => $googleUser->getAvatar(),
                    'oauth_provider' => 'google',
                    'role' => Role::Viewer,
                    'email_verified_at' => now(),
                    'last_active_at' => now(),
                ]);
            });
        } catch (Throwable $e) {
            Log::error('Google OAuth user upsert failed', ['error' => $e->getMessage()]);

            return redirect()->away($frontendUrl.'/sign-in?error=oauth_persist_failed');
        }

        $token = $user->createToken('google-oauth')->plainTextToken;
        Audit::record(action: 'auth.google.sign_in', resource: $user);

        return redirect()->away(
            $frontendUrl.'/auth/google/complete?token='.urlencode($token)
        );
    }

    private function configured(): bool
    {
        return ! empty(config('services.google.client_id'))
            && ! empty(config('services.google.client_secret'));
    }
}
