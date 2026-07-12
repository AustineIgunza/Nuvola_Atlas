export const BASE = import.meta.env.VITE_API_BASE ?? "/api/v1";
// Default to MOCK EVERYWHERE — local dev, Vercel previews, Vercel prod.
// The mock is the demo-safe default: it does not depend on the Laravel
// backend being up, does not depend on the ingestion pipeline having
// delivered data, and does not depend on any per-environment secret.
//
// To hit the real API instead (once staging has seeded data), set
// VITE_USE_REMOTE_API=true on that Vercel environment and redeploy.
const remoteFlag = String(import.meta.env.VITE_USE_REMOTE_API ?? "")
  .trim()
  .toLowerCase();
export const USE_MOCK = !(remoteFlag === "true" || remoteFlag === "1");

// Chat has its own gate on top of USE_MOCK. The rest of the API can be
// pointing at real Postgres while chat still uses the client-side mock —
// useful while Vercel AI Gateway billing is being provisioned. Set
// VITE_USE_REMOTE_CHAT=true to route chat through the real backend.
const remoteChatFlag = String(import.meta.env.VITE_USE_REMOTE_CHAT ?? "")
  .trim()
  .toLowerCase();
export const USE_MOCK_CHAT = USE_MOCK || !(remoteChatFlag === "true" || remoteChatFlag === "1");

export function delay(min = 250, max = 600): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min) + min);
  return new Promise((r) => setTimeout(r, ms));
}

export function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("nuvola_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Backend errors are RFC 7807 application/problem+json: { title, detail,
// status, errors? }. Fall through to legacy { message, errors } for any
// transitional clients (e.g. third-party SDKs proxying the API).
function pickErrorMessage(body: unknown, status: number): string {
  if (!body || typeof body !== "object") return `Request failed (${status})`;
  const b = body as Record<string, unknown>;
  const errors = b.errors as Record<string, string[]> | undefined;
  if (errors) {
    const first = Object.values(errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
  }
  if (typeof b.detail === "string") return b.detail;
  if (typeof b.message === "string") return b.message;
  if (typeof b.title === "string") return b.title;
  return `Request failed (${status})`;
}

export async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    localStorage.removeItem("nuvola_authed");
    localStorage.removeItem("nuvola_token");
    window.location.href = "/sign-in";
    throw new Error("Session expired. Please sign in again.");
  }
  if (!res.ok) {
    let body: unknown = null;
    try { body = await res.json(); } catch { /* non-JSON body */ }
    throw new Error(pickErrorMessage(body, res.status));
  }
  return res.json();
}
