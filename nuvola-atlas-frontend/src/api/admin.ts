import { BASE, USE_MOCK, authHeaders, handleResponse } from "./client";

export interface AdminMetrics {
  users_total: number;
  partners_total: number;
  reports_total: number;
  alerts_unread: number;
  audit_events_last_24h: number;
  api_keys_active: number;
  admins_total: number;
  admins_with_two_factor: number;
  generated_at: string;
}

export interface AuditEntry {
  id: number;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string | null;
  actor: { id: number; name: string; email: string; role: string } | null;
}

export interface AuditPage {
  data: AuditEntry[];
  meta: { next_cursor: string | null; prev_cursor: string | null; per_page: number };
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  email_verified: boolean;
  two_factor_enabled: boolean;
  partner: { id: number; name: string } | null;
  created_at: string | null;
}

export interface AdminUserPage {
  data: AdminUser[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

export interface ApiKey {
  id: number;
  name: string;
  abilities: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string | null;
  user: { id: number; name: string; email: string; role: string; partner_id: number | null } | null;
}

export interface MintApiKeyPayload {
  user_id: number;
  name: string;
  abilities: string[];
  expires_in_days?: number;
}

export interface MintApiKeyResponse {
  token: string;
  data: ApiKey;
}

// ── Mock fixtures so the dashboard renders in preview/local without a backend.
const mockMetrics = (): AdminMetrics => ({
  users_total: 27,
  partners_total: 4,
  reports_total: 142,
  alerts_unread: 6,
  audit_events_last_24h: 89,
  api_keys_active: 3,
  admins_total: 2,
  admins_with_two_factor: 2,
  generated_at: new Date().toISOString(),
});

const mockAudit = (): AuditPage => ({
  data: [
    { id: 1042, action: "report.created", resource_type: "Report", resource_id: "r-101", before: null, after: { title: "Westlands Q2 review" }, ip: "203.0.113.5", user_agent: "Mozilla/5.0", created_at: new Date().toISOString(), actor: { id: 1, name: "Joy Nthei", email: "joy@nuvola.dev", role: "admin" } },
    { id: 1041, action: "auth.sign_in", resource_type: "User", resource_id: "1", before: null, after: null, ip: "203.0.113.5", user_agent: "Mozilla/5.0", created_at: new Date(Date.now() - 3600_000).toISOString(), actor: { id: 1, name: "Joy Nthei", email: "joy@nuvola.dev", role: "admin" } },
    { id: 1040, action: "api_key.created", resource_type: "PersonalAccessToken", resource_id: "7", before: null, after: { name: "partner pilot — readonly", abilities: ["api:read"] }, ip: "203.0.113.5", user_agent: "Mozilla/5.0", created_at: new Date(Date.now() - 86400_000).toISOString(), actor: { id: 1, name: "Joy Nthei", email: "joy@nuvola.dev", role: "admin" } },
  ],
  meta: { next_cursor: null, prev_cursor: null, per_page: 15 },
});

const mockUsers = (): AdminUserPage => ({
  data: [
    { id: 1, name: "Joy Nthei", email: "joy@nuvola.dev", role: "admin", email_verified: true, two_factor_enabled: true, partner: null, created_at: new Date(Date.now() - 30 * 86400_000).toISOString() },
    { id: 2, name: "Ken N'ganga", email: "ken@nuvola.dev", role: "admin", email_verified: true, two_factor_enabled: true, partner: null, created_at: new Date(Date.now() - 30 * 86400_000).toISOString() },
    { id: 3, name: "Austine Igunza", email: "austine@nuvola.dev", role: "editor", email_verified: true, two_factor_enabled: false, partner: null, created_at: new Date(Date.now() - 28 * 86400_000).toISOString() },
    { id: 4, name: "Pilot Partner", email: "pilot@example.test", role: "partner", email_verified: true, two_factor_enabled: false, partner: { id: 1, name: "Nairobi County Planning" }, created_at: new Date(Date.now() - 5 * 86400_000).toISOString() },
  ],
  meta: { current_page: 1, last_page: 1, per_page: 20, total: 4 },
});

const mockApiKeys = (): { data: ApiKey[] } => ({
  data: [
    { id: 7, name: "partner pilot — readonly", abilities: ["api:read"], last_used_at: new Date(Date.now() - 2 * 3600_000).toISOString(), expires_at: new Date(Date.now() + 90 * 86400_000).toISOString(), created_at: new Date(Date.now() - 86400_000).toISOString(), user: { id: 4, name: "Pilot Partner", email: "pilot@example.test", role: "partner", partner_id: 1 } },
  ],
});

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  return handleResponse<T>(res);
}

export const adminApi = {
  metrics: async (): Promise<AdminMetrics> => {
    if (USE_MOCK) return mockMetrics();
    const r = await getJson<{ data: AdminMetrics }>("/admin/metrics");
    return r.data;
  },

  audit: async (cursor?: string | null, action?: string): Promise<AuditPage> => {
    if (USE_MOCK) return mockAudit();
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (action) params.set("action", action);
    const qs = params.toString() ? `?${params}` : "";
    return getJson<AuditPage>(`/admin/audit${qs}`);
  },

  users: async (page = 1, q?: string, role?: string): Promise<AdminUserPage> => {
    if (USE_MOCK) return mockUsers();
    const params = new URLSearchParams({ page: String(page) });
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    return getJson<AdminUserPage>(`/admin/users?${params}`);
  },

  apiKeys: async (): Promise<ApiKey[]> => {
    if (USE_MOCK) return mockApiKeys().data;
    const r = await getJson<{ data: ApiKey[] }>("/admin/api-keys");
    return r.data;
  },

  mintApiKey: async (payload: MintApiKeyPayload): Promise<MintApiKeyResponse> => {
    if (USE_MOCK) {
      // Return a fake token so the wizard UI can show its "copy once" flow.
      return {
        token: `${Math.floor(Math.random() * 1000)}|${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`,
        data: { id: Math.floor(Math.random() * 1000), name: payload.name, abilities: payload.abilities, last_used_at: null, expires_at: payload.expires_in_days ? new Date(Date.now() + payload.expires_in_days * 86400_000).toISOString() : null, created_at: new Date().toISOString(), user: { id: payload.user_id, name: "Mock user", email: "mock@example.test", role: "partner", partner_id: null } },
      };
    }
    const res = await fetch(`${BASE}/admin/api-keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });
    return handleResponse<MintApiKeyResponse>(res);
  },

  revokeApiKey: async (id: number): Promise<void> => {
    if (USE_MOCK) return;
    const res = await fetch(`${BASE}/admin/api-keys/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    await handleResponse<{ message: string }>(res);
  },

  updateUserRole: async (id: number, role: string): Promise<AdminUser> => {
    if (USE_MOCK) {
      // mutate the mock list in-place so the UI feels responsive
      return { id, name: "Mock user", email: "mock@example.test", role, email_verified: true, two_factor_enabled: false, partner: null, created_at: null };
    }
    const res = await fetch(`${BASE}/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ role }),
    });
    const r = await handleResponse<{ data: AdminUser }>(res);
    return r.data;
  },

  auditExportUrl: (action?: string): string => {
    const params = new URLSearchParams();
    if (action) params.set("action", action);
    const qs = params.toString() ? `?${params}` : "";
    return `${BASE}/admin/audit/export${qs}`;
  },
};
