import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/api.types";
import { API_CONFIG } from "@/config/api.config";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (data: { access_token: string; refresh_token: string; user: User }) => void;
  setUser: (user: User | null) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: ({ access_token, refresh_token, user }) => {
        localStorage.setItem(API_CONFIG.tokenStorageKey, access_token);
        localStorage.setItem(API_CONFIG.refreshTokenStorageKey, refresh_token);
        localStorage.setItem(API_CONFIG.userStorageKey, JSON.stringify(user));
        set({ accessToken: access_token, refreshToken: refresh_token, user });
      },
      setUser: (user) => set({ user }),
      clear: () => {
        localStorage.removeItem(API_CONFIG.tokenStorageKey);
        localStorage.removeItem(API_CONFIG.refreshTokenStorageKey);
        localStorage.removeItem(API_CONFIG.userStorageKey);
        set({ user: null, accessToken: null, refreshToken: null });
      },
      isAuthenticated: () => Boolean(get().accessToken && get().user),
    }),
    { name: "apea-auth-store" },
  ),
);
