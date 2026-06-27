import { BASE, USE_MOCK, authHeaders, handleResponse } from "./client";
import { mockApi } from "./mock";

export interface EmailStartResponse {
  message: string;
  email_hint: string;
  expires_in_seconds: number;
}

export interface VerifyResponse {
  token: string;
  expires_at: string;
  user: { id: number; name: string; email: string; role: string; email_verified: boolean };
}

export const twoFactorApi = {
  /** Sends a 6-digit code to the authenticated user's email. */
  emailStart: async (): Promise<EmailStartResponse> => {
    if (USE_MOCK) {
      return { message: "Mock: code 123456 (no email sent).", email_hint: "you@example.test", expires_in_seconds: 300 };
    }
    const res = await fetch(`${BASE}/auth/2fa/email/start`, { method: "POST", headers: authHeaders() });
    return handleResponse<EmailStartResponse>(res);
  },

  /** Confirms enrolment by submitting the code from the inbox. */
  emailConfirm: async (code: string): Promise<void> => {
    if (USE_MOCK) {
      if (!/^\d{6}$/.test(code)) throw new Error("Enter a 6-digit code.");
      return;
    }
    const res = await fetch(`${BASE}/auth/2fa/email/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ code }),
    });
    await handleResponse<{ message: string }>(res);
  },

  /** Disable 2FA. Requires the password + a fresh code (mailed via emailStart). */
  emailDisable: async (password: string, code: string): Promise<void> => {
    if (USE_MOCK) return;
    const res = await fetch(`${BASE}/auth/2fa/email/disable`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ password, code }),
    });
    await handleResponse<{ message: string }>(res);
  },

  /** Sign-in challenge: exchange challenge_token + code for a real Sanctum token. */
  verify: async (challenge_token: string, code: string): Promise<VerifyResponse> => {
    if (USE_MOCK) {
      return (mockApi as unknown as { verifyTwoFactor: (t: string, c: string) => Promise<VerifyResponse> })
        .verifyTwoFactor(challenge_token, code);
    }
    const res = await fetch(`${BASE}/auth/2fa/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge_token, code }),
    });
    return handleResponse<VerifyResponse>(res);
  },
};
