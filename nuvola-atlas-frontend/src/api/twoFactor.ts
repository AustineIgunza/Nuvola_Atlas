import { BASE, USE_MOCK, authHeaders, handleResponse } from "./client";

export interface EnableResponse {
  secret: string;
  otpauth_uri: string;
  recovery_codes: string[];
}

const MOCK_SECRET = "JBSWY3DPEHPK3PXP";

export const twoFactorApi = {
  enable: async (): Promise<EnableResponse> => {
    if (USE_MOCK) {
      // The mock otpauth URI works with any TOTP authenticator app — the
      // secret is the well-known RFC 6238 test secret.
      return {
        secret: MOCK_SECRET,
        otpauth_uri: `otpauth://totp/Nuvola%20Atlas:mock@example.test?secret=${MOCK_SECRET}&issuer=Nuvola%20Atlas`,
        recovery_codes: [
          "mock-aaaa-1111", "mock-bbbb-2222", "mock-cccc-3333", "mock-dddd-4444",
          "mock-eeee-5555", "mock-ffff-6666", "mock-gggg-7777", "mock-hhhh-8888",
        ],
      };
    }
    const res = await fetch(`${BASE}/auth/2fa/enable`, { method: "POST", headers: authHeaders() });
    return handleResponse<EnableResponse>(res);
  },

  confirm: async (code: string): Promise<void> => {
    if (USE_MOCK) {
      // Accept any 6-digit code so the wizard can be exercised end-to-end
      // without a real authenticator.
      if (!/^\d{6}$/.test(code)) throw new Error("Enter a 6-digit code.");
      return;
    }
    const res = await fetch(`${BASE}/auth/2fa/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ code }),
    });
    await handleResponse<{ message: string }>(res);
  },

  disable: async (password: string, code: string): Promise<void> => {
    if (USE_MOCK) return;
    const res = await fetch(`${BASE}/auth/2fa/disable`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ password, code }),
    });
    await handleResponse<{ message: string }>(res);
  },
};
