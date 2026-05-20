import axios, { type AxiosInstance } from "axios";
import { API_CONFIG } from "@/config/api.config";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeoutMs,
  headers: { "Content-Type": "application/json" },
});
