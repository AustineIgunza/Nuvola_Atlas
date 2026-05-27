export const BASE = import.meta.env.VITE_API_BASE ?? "/api";
export const USE_MOCK = !BASE.startsWith("http");

export function delay(min = 250, max = 600): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min) + min);
  return new Promise((r) => setTimeout(r, ms));
}

export function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("nuvola_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    localStorage.removeItem("nuvola_authed");
    localStorage.removeItem("nuvola_token");
    window.location.href = "/sign-in";
    throw new Error("Session expired. Please sign in again.");
  }
  if (res.status === 422) {
    try {
      const body = await res.json();
      const firstError = Object.values(body.errors ?? {})[0];
      throw new Error(Array.isArray(firstError) ? firstError[0] : body.message ?? "Validation failed");
    } catch (e) {
      if (e instanceof Error && e.message !== "Validation failed") throw e;
      throw new Error("Validation failed");
    }
  }
  if (!res.ok) {
    try {
      const body = await res.json();
      throw new Error(body.message ?? `Request failed (${res.status})`);
    } catch (e) {
      if (e instanceof Error && e.message !== `Request failed (${res.status})`) throw e;
      throw new Error(`Request failed (${res.status})`);
    }
  }
  return res.json();
}
