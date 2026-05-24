import { create } from "zustand";

interface AuthUser {
  name: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  signIn: (user: AuthUser) => void;
  signOut: () => void;
}

const stored = localStorage.getItem("nuvola_authed");
const initial: AuthUser | null = stored ? JSON.parse(stored) : null;

export const useAuthStore = create<AuthState>((set) => ({
  user: initial,
  signIn: (user) => {
    localStorage.setItem("nuvola_authed", JSON.stringify(user));
    set({ user });
  },
  signOut: () => {
    localStorage.removeItem("nuvola_authed");
    set({ user: null });
  },
}));
