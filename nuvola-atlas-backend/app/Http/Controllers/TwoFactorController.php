<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

/**
 * TOTP-based two-factor authentication.
 *
 * Flow:
 *   1. POST /api/v1/auth/2fa/enable       (auth required) — generates a
 *      secret + 8 recovery codes, returns the otpauth:// URI for the user
 *      to scan, and the plaintext recovery codes. The secret is NOT yet
 *      active until confirmed.
 *   2. POST /api/v1/auth/2fa/confirm      (auth required) — user submits
 *      the first TOTP code. On success two_factor_confirmed_at is set
 *      and the account is now 2FA-gated.
 *   3. POST /api/v1/auth/2fa/disable      (auth required) — body: code.
 *      Clears the columns.
 *   4. POST /api/v1/auth/2fa/verify       (no auth) — body: challenge_token
 *      + code. On success returns a real Sanctum access token. Used by the
 *      sign-in flow when AuthController::signIn() determines 2FA is on.
 *
 * Admins are the only role required to enrol (per todo §9.3 scope choice);
 * other roles can opt in but never have to.
 */
class TwoFactorController extends Controller
{
    private const RECOVERY_CODE_COUNT = 8;
    private const CHALLENGE_TTL_SECONDS = 300;

    public function enable(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->hasTwoFactorEnabled()) {
            throw new AccessDeniedHttpException('Two-factor authentication is already enabled.');
        }

        $g2fa = new Google2FA;
        $secret = $g2fa->generateSecretKey();

        $codes = collect(range(1, self::RECOVERY_CODE_COUNT))
            ->map(fn () => Str::random(10).'-'.Str::random(10))
            ->all();

        $user->forceFill([
            'two_factor_secret' => Crypt::encryptString($secret),
            'two_factor_recovery_codes' => Crypt::encryptString(json_encode($codes)),
            'two_factor_confirmed_at' => null,
        ])->save();

        $appName = config('app.name', 'Nuvola Atlas');
        $otpauthUri = $g2fa->getQRCodeUrl($appName, $user->email, $secret);

        return response()->json([
            'secret' => $secret,
            'otpauth_uri' => $otpauthUri,
            'recovery_codes' => $codes,
        ]);
    }

    public function confirm(Request $request): JsonResponse
    {
        $request->validate(['code' => ['required', 'string', 'size:6']]);

        /** @var User $user */
        $user = $request->user();

        if ($user->two_factor_secret === null) {
            throw new AccessDeniedHttpException('Two-factor enrolment has not started.');
        }

        $g2fa = new Google2FA;
        $valid = $g2fa->verifyKey($user->twoFactorSecret(), $request->input('code'));

        if (! $valid) {
            return response()->json(['message' => 'Invalid code.'], 422);
        }

        $user->forceFill(['two_factor_confirmed_at' => now()])->save();

        Audit::record(action: 'auth.two_factor_enabled', resource: $user);

        return response()->json(['message' => 'Two-factor authentication enabled.']);
    }

    public function disable(Request $request): JsonResponse
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

        if (! $this->codeIsValid($user, $request->input('code'))) {
            return response()->json(['message' => 'Invalid code.'], 422);
        }

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        Audit::record(action: 'auth.two_factor_disabled', resource: $user);

        return response()->json(['message' => 'Two-factor authentication disabled.']);
    }

    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'challenge_token' => ['required', 'string'],
            'code' => ['required', 'string'],
        ]);

        $userId = Cache::pull('2fa:challenge:'.hash('sha256', $request->input('challenge_token')));
        if ($userId === null) {
            throw new UnauthorizedHttpException('Bearer', 'Challenge expired or invalid.');
        }

        $user = User::find($userId);
        if ($user === null || ! $user->hasTwoFactorEnabled()) {
            throw new UnauthorizedHttpException('Bearer', 'Two-factor not configured.');
        }

        if (! $this->codeIsValid($user, $request->input('code'))) {
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

    public static function issueChallenge(User $user): string
    {
        $token = Str::random(40);
        Cache::put(
            '2fa:challenge:'.hash('sha256', $token),
            $user->id,
            self::CHALLENGE_TTL_SECONDS,
        );

        return $token;
    }

    private function codeIsValid(User $user, string $code): bool
    {
        // 6-digit TOTP path.
        if (preg_match('/^\d{6}$/', $code)) {
            return (new Google2FA)->verifyKey($user->twoFactorSecret() ?? '', $code);
        }

        // Recovery code path — single-use; consumed on match.
        $codes = $user->twoFactorRecoveryCodes();
        if (in_array($code, $codes, true)) {
            $remaining = array_values(array_filter($codes, fn ($c) => $c !== $code));
            $user->forceFill([
                'two_factor_recovery_codes' => empty($remaining)
                    ? null
                    : Crypt::encryptString(json_encode($remaining)),
            ])->save();

            return true;
        }

        return false;
    }
}
