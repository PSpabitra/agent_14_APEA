export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  timeoutMs: 30_000,
  tokenStorageKey: "apea-access-token",
  refreshTokenStorageKey: "apea-refresh-token",
  userStorageKey: "apea-user",
} as const;
