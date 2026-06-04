export const BASE = import.meta.env.VITE_API_BASE ?? "/api/v1";
// Default to mock so local dev works without Khillon's backend running.
// Set VITE_USE_REMOTE_API=true on Vercel production (only). Previews stay
// mock so partners can review UI even when the API is down.
const remoteFlag = String(import.meta.env.VITE_USE_REMOTE_API ?? "")
  .trim()
  .toLowerCase();
export const USE_MOCK = !(remoteFlag === "true" || remoteFlag === "1");

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
