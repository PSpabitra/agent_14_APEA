import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi } from "@/services/api/endpoints";
import { useAuthStore } from "@/store/slices/auth";
import type { User } from "@/types/api.types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, setSession, setUser, clear } = useAuthStore();
  const [isLoading, setLoading] = useState<boolean>(Boolean(accessToken));

  const refreshMe = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      clear();
    } finally {
      setLoading(false);
    }
  }, [accessToken, setUser, clear]);

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login(email, password);
      setSession({ access_token: data.access_token, refresh_token: data.refresh_token, user: data.user });
    },
    [setSession],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    clear();
  }, [clear]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user && accessToken),
      login,
      logout,
      refreshMe,
    }),
    [user, accessToken, isLoading, login, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
