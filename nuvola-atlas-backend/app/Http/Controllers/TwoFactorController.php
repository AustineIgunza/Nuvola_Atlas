<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Mail\TwoFactorCodeMail;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

/**
 * Email-based 2FA.
 *
 * Flow:
 *   1. POST /auth/2fa/email/start    (auth) — emails a 6-digit code to the
 *      user's verified address. Code lives in the cache for 5 minutes.
 *   2. POST /auth/2fa/email/confirm  (auth) — user submits the code from
 *      their inbox. On success `email_two_factor_enabled_at` is flipped.
 *   3. POST /auth/2fa/email/disable  (auth) — body: password + recent code.
 *   4. POST /auth/2fa/verify         (no auth) — body: challenge_token +
 *      code. AuthController::signIn issues the challenge_token when the
 *      account has 2FA on; this endpoint exchanges it for a real Sanctum
 *      access token.
 *
 * Why email and not TOTP: easier UX for partners who don't want yet
 * another authenticator app. Weaker than TOTP if email is compromised,
 * but only as weak as password reset already is on the same address.
 */
class TwoFactorController extends Controller
{
    private const CHALLENGE_TTL_SECONDS = 300;

    private const ENROL_TTL_SECONDS = 300;

    private const RESEND_LIMIT_PER_MINUTE = 1;

    public function emailStart(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->hasTwoFactorEnabled()) {
            throw new AccessDeniedHttpException('Two-factor authentication is already enabled.');
        }

        $this->rateLimitResend('2fa.enrol_send:'.$user->id);

        $code = self::issueCode();
        Cache::put($this->enrolCacheKey($user), $code, self::ENROL_TTL_SECONDS);

        Mail::to($user->email)->send(new TwoFactorCodeMail(
            code: $code,
            purpose: 'enrol',
            ttlSeconds: self::ENROL_TTL_SECONDS,
        ));

        return response()->json([
            'message' => 'Code sent to your email.',
            'email_hint' => $user->maskedEmail(),
            'expires_in_seconds' => self::ENROL_TTL_SECONDS,
        ]);
    }

    public function emailConfirm(Request $request): JsonResponse
    {
        $request->validate(['code' => ['required', 'string', 'size:6']]);

        /** @var User $user */
        $user = $request->user();

        $stored = Cache::pull($this->enrolCacheKey($user));
        if (! is_string($stored) || ! hash_equals($stored, (string) $request->input('code'))) {
            return response()->json(['message' => 'Invalid or expired code.'], 422);
        }

        // Successful enrolment self-heals any prior reminder/lock state so
        // the user is not stuck behind an old escalation flag.
        $user->forceFill([
            'email_two_factor_enabled_at' => now(),
            'email_two_factor_reminded_at' => null,
            'email_two_factor_locked_at' => null,
        ])->save();

        Audit::record(action: 'auth.two_factor_enabled', resource: $user);

        return response()->json(['message' => 'Two-factor authentication enabled.']);
    }

    public function emailDisable(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string'],
            'code' => ['required', 'string'],
        ]);

        /** @var User $user */
        $user = $request->user();

        if (! Hash::check($request->input('password'), $user->password)) {
            return response()->json(['message' => 'Invalid password.'], 422);
        }

        // For disable we accept a fresh code from a new /email/start call.
        $stored = Cache::pull($this->enrolCacheKey($user));
        if (! is_string($stored) || ! hash_equals($stored, (string) $request->input('code'))) {
            return response()->json(['message' => 'Invalid or expired code.'], 422);
        }

        $user->forceFill(['email_two_factor_enabled_at' => null])->save();

        Audit::record(action: 'auth.two_factor_disabled', resource: $user);

        return response()->json(['message' => 'Two-factor authentication disabled.']);
    }

    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'challenge_token' => ['required', 'string'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $challenge = Cache::pull($this->challengeCacheKey($request->input('challenge_token')));
        if (! is_array($challenge) || ! isset($challenge['user_id'], $challenge['code'])) {
            throw new UnauthorizedHttpException('Bearer', 'Challenge expired or invalid.');
        }

        $user = User::find($challenge['user_id']);
        if ($user === null || ! $user->hasTwoFactorEnabled()) {
            throw new UnauthorizedHttpException('Bearer', 'Two-factor not configured.');
        }

        if (! hash_equals((string) $challenge['code'], (string) $request->input('code'))) {
            // Put it back so the user gets one or two retries before TTL ends.
            Cache::put(
                $this->challengeCacheKey($request->input('challenge_token')),
                $challenge,
                self::CHALLENGE_TTL_SECONDS,
            );

            return response()->json(['message' => 'Invalid code.'], 422);
        }

        $token = $user->createToken('api')->plainTextToken;

        Audit::record(action: 'auth.two_factor_verified', resource: $user);

        return response()->json([
            'token' => $token,
            'expires_at' => now()->addMinutes(config('sanctum.expiration', 480))->toIso8601String(),
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role()->value,
                'email_verified' => $user->hasVerifiedEmail(),
            ],
        ]);
    }

    /**
     * Mints a challenge token + caches the code and emails it. Called by
     * AuthController::signIn when the authenticated user has 2FA on.
     */
    public static function issueSignInChallenge(User $user): string
    {
        $token = Str::random(40);
        $code = self::issueCode();

        Cache::put(
            'auth.two_factor_challenge:'.hash('sha256', $token),
            ['user_id' => $user->id, 'code' => $code],
            self::CHALLENGE_TTL_SECONDS,
        );

        Mail::to($user->email)->send(new TwoFactorCodeMail(
            code: $code,
            purpose: 'sign_in',
            ttlSeconds: self::CHALLENGE_TTL_SECONDS,
        ));

        return $token;
    }

    private static function issueCode(): string
    {
        // 6-digit, leading zeros preserved — `00 - 99 99 99` range.
        return str_pad((string) random_int(0, 999_999), 6, '0', STR_PAD_LEFT);
    }

    private function enrolCacheKey(User $user): string
    {
        return 'auth.two_factor_enrol:'.$user->id;
    }

    private function challengeCacheKey(string $token): string
    {
        return 'auth.two_factor_challenge:'.hash('sha256', $token);
    }

    private function rateLimitResend(string $key): void
    {
        $attempts = RateLimiter::attempts($key);
        if ($attempts >= self::RESEND_LIMIT_PER_MINUTE) {
            $retryAfter = RateLimiter::availableIn($key);
            throw new TooManyRequestsHttpException(
                $retryAfter,
                'Wait '.$retryAfter.'s before requesting another code.'
            );
        }
        RateLimiter::hit($key, 60);
    }
}
