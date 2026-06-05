<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Http\Controllers\TwoFactorController;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Http\Requests\SignInRequest;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class AuthController extends Controller
{
    public function signIn(SignInRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        if (! Auth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        /** @var User $user */
        $user = Auth::user();

        // If 2FA is enabled, do NOT issue the access token here. Instead
        // mail a fresh 6-digit code to the user and return a challenge
        // token. The client posts it back to /auth/2fa/verify with the
        // code from their inbox to get the real Sanctum token.
        if ($user->hasTwoFactorEnabled()) {
            $challenge = TwoFactorController::issueSignInChallenge($user);
            Audit::record(action: 'auth.two_factor_challenged', resource: $user);

            return response()->json([
                'requires_two_factor' => true,
                'channel' => 'email',
                'challenge_token' => $challenge,
                'email_hint' => $user->maskedEmail(),
            ]);
        }

        $token = $user->createToken('api')->plainTextToken;
        $expiresAt = now()->addMinutes(config('sanctum.expiration', 480))->toIso8601String();

        Audit::record(action: 'auth.sign_in', resource: $user);

        return response()->json([
            'token' => $token,
            'expires_at' => $expiresAt,
            'user' => $this->userPayload($user),
        ]);
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => Role::Viewer,
        ]);

        // Triggers SendEmailVerificationNotification when the user implements
        // MustVerifyEmail. In dev the mail goes to log; in prod use a real
        // mailer (configured via MAIL_* env vars).
        event(new Registered($user));

        $token = $user->createToken('api')->plainTextToken;
        $expiresAt = now()->addMinutes(config('sanctum.expiration', 480))->toIso8601String();

        return response()->json([
            'token' => $token,
            'expires_at' => $expiresAt,
            'user' => $this->userPayload($user),
        ], 201);
    }

    public function me(): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        return response()->json($this->userPayload($user));
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        Password::sendResetLink($request->only('email'));

        // Don't leak whether the account exists — same response either way.
        return response()->json([
            'message' => 'If an account exists, a reset link has been sent.',
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
                // Revoke every token — a password reset signals a security
                // event, so all active sessions should be invalidated.
                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Invalid or expired reset token.'], 422);
        }

        return response()->json(['message' => 'Password has been reset.']);
    }

    public function signOut(): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();
        $user->currentAccessToken()->delete();

        Audit::record(action: 'auth.sign_out', resource: $user);

        return response()->json(['message' => 'Signed out.']);
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role()->value,
            'email_verified' => $user->hasVerifiedEmail(),
        ];
    }
}
