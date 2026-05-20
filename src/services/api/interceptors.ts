import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { apiClient } from "./client";
import { API_CONFIG } from "@/config/api.config";
import { storage } from "@/services/storage/local";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

function processQueue(token: string | null) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

export function installInterceptors(onAuthFailure: () => void) {
  apiClient.interceptors.request.use((config) => {
    const token = storage.get<string>(API_CONFIG.tokenStorageKey);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config as RetryableRequestConfig | undefined;
      if (!original || !error.response) return Promise.reject(error);

      if (error.response.status === 401 && !original._retry) {
        const refreshToken = storage.get<string>(API_CONFIG.refreshTokenStorageKey);
        if (!refreshToken) {
          onAuthFailure();
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            pendingQueue.push((newToken) => {
              if (!newToken) {
                reject(error);
                return;
              }
              original.headers = original.headers ?? {};
              (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
              original._retry = true;
              resolve(apiClient(original));
            });
          });
        }

        original._retry = true;
        isRefreshing = true;
        try {
          const r = await apiClient.post("/auth/refresh", { refresh_token: refreshToken });
          const newAccess = r.data?.data?.access_token as string | undefined;
          if (!newAccess) throw new Error("No new access token");
          storage.set(API_CONFIG.tokenStorageKey, newAccess);
          processQueue(newAccess);
          original.headers = original.headers ?? {};
          (original.headers as Record<string, string>).Authorization = `Bearer ${newAccess}`;
          return apiClient(original);
        } catch (e) {
          processQueue(null);
          storage.remove(API_CONFIG.tokenStorageKey);
          storage.remove(API_CONFIG.refreshTokenStorageKey);
          storage.remove(API_CONFIG.userStorageKey);
          onAuthFailure();
          return Promise.reject(e);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );
}
