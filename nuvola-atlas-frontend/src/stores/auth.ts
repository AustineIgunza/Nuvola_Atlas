import { create } from "zustand";

export type AuthRole = "viewer" | "partner" | "editor" | "admin";

export interface AuthUser {
  name: string;
  email: string;
  role?: AuthRole;
  email_verified?: boolean;
}

const ROLE_RANK: Record<AuthRole, number> = {
  viewer: 1,
  partner: 2,
  editor: 3,
  admin: 4,
};

export function hasRoleAtLeast(user: AuthUser | null, required: AuthRole): boolean {
  if (!user?.role) return false;
  return ROLE_RANK[user.role] >= ROLE_RANK[required];
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  tokenExpiresAt: number | null;
  signIn: (user: AuthUser, token: string) => void;
  signOut: () => void;
  isTokenExpired: () => boolean;
}

const TOKEN_LIFETIME_MS = 480 * 60 * 1000; // 8 hours, matches Sanctum config

const stored = localStorage.getItem("nuvola_authed");
const initial: AuthUser | null = stored ? JSON.parse(stored) : null;
const initialToken: string | null = localStorage.getItem("nuvola_token");
const initialExpiry: number | null = (() => {
  const v = localStorage.getItem("nuvola_token_expires");
  return v ? Number(v) : null;
})();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initial,
  token: initialToken,
  tokenExpiresAt: initialExpiry,
  signIn: (user, token) => {
    const expiresAt = Date.now() + TOKEN_LIFETIME_MS;
    localStorage.setItem("nuvola_authed", JSON.stringify(user));
    localStorage.setItem("nuvola_token", token);
    localStorage.setItem("nuvola_token_expires", String(expiresAt));
    set({ user, token, tokenExpiresAt: expiresAt });
  },
  signOut: () => {
    localStorage.removeItem("nuvola_authed");
    localStorage.removeItem("nuvola_token");
    localStorage.removeItem("nuvola_token_expires");
    set({ user: null, token: null, tokenExpiresAt: null });
  },
  isTokenExpired: () => {
    const { tokenExpiresAt } = get();
    return tokenExpiresAt !== null && Date.now() > tokenExpiresAt;
  },
}));
