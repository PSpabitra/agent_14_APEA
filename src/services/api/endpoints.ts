import { apiClient } from "./client";
import type {
  ApiEnvelope,
  AuditEntry,
  ChatMessage,
  ConnectorConfig,
  DashboardStats,
  Deviation,
  DeviationDetail,
  LoginResponse,
  NotificationItem,
  RcaRecord,
  RagDocumentsResponse,
  SeverityBreakdown,
  SlaMetric,
  SyncLog,
  TelemetryEvent,
  Ticket,
  TimeseriesPoint,
  UploadedDocument,
  User,
} from "@/types/api.types";
import type { ConnectorName, DeviationStatus, Severity } from "@/types/common.types";

function unwrap<T>(env: ApiEnvelope<T>): T {
  if (env.ok !== true && env.success !== true) throw new Error(env.error?.message || env.message || "Request failed");
  return env.data as T;
}

// ---------------- AUTH ----------------
export const authApi = {
  login: async (email: string, password: string) => {
    const r = await apiClient.post<ApiEnvelope<LoginResponse>>("/auth/login", { email, password });
    return unwrap(r.data);
  },
  me: async () => {
    const r = await apiClient.get<ApiEnvelope<User>>("/auth/me");
    return unwrap(r.data);
  },
  refresh: async (refresh_token: string) => {
    const r = await apiClient.post<ApiEnvelope<{ access_token: string }>>("/auth/refresh", { refresh_token });
    return unwrap(r.data);
  },
  register: async (payload: { email: string; password: string; full_name: string; role: string }) => {
    const r = await apiClient.post<ApiEnvelope<User>>("/auth/register", payload);
    return unwrap(r.data);
  },
  logout: async () => {
    await apiClient.post("/auth/logout").catch(() => undefined);
  },
};

// ---------------- DASHBOARD ----------------
export const dashboardApi = {
  stats: async () => {
    const r = await apiClient.get<ApiEnvelope<DashboardStats>>("/dashboard/stats");
    return unwrap(r.data);
  },
  severity: async () => {
    const r = await apiClient.get<ApiEnvelope<SeverityBreakdown[]>>("/dashboard/severity");
    return unwrap(r.data);
  },
  timeseries: async (hours = 24) => {
    const r = await apiClient.get<ApiEnvelope<TimeseriesPoint[]>>("/dashboard/timeseries", { params: { hours } });
    return unwrap(r.data);
  },
  sla: async () => {
    const r = await apiClient.get<ApiEnvelope<SlaMetric[]>>("/dashboard/sla");
    return unwrap(r.data);
  },
  recentDeviations: async (limit = 10) => {
    const r = await apiClient.get<ApiEnvelope<Deviation[]>>("/dashboard/recent-deviations", { params: { limit } });
    return unwrap(r.data);
  },
};

// ---------------- DEVIATIONS ----------------
export const deviationApi = {
  list: async (params: { severity?: Severity; status?: DeviationStatus; limit?: number } = {}) => {
    const r = await apiClient.get<ApiEnvelope<Deviation[]>>("/deviations", { params });
    return unwrap(r.data);
  },
  get: async (id: number) => {
    const r = await apiClient.get<ApiEnvelope<DeviationDetail>>(`/deviations/${id}`);
    return unwrap(r.data);
  },
  updateStatus: async (id: number, status: DeviationStatus, notes?: string) => {
    const r = await apiClient.patch<ApiEnvelope<Deviation>>(`/deviations/${id}/status`, { status, notes });
    return unwrap(r.data);
  },
};

// ---------------- TELEMETRY ----------------
export const telemetryApi = {
  ingest: async (event: Omit<TelemetryEvent, "id" | "occurred_at"> & { occurred_at?: string }) => {
    const r = await apiClient.post<ApiEnvelope<TelemetryEvent>>("/telemetry/ingest", event);
    return unwrap(r.data);
  },
  list: async (params: { plant?: string; metric?: string; limit?: number } = {}) => {
    const r = await apiClient.get<ApiEnvelope<TelemetryEvent[]>>("/telemetry/events", { params });
    return unwrap(r.data);
  },
};

// ---------------- RCA ----------------
export const rcaApi = {
  generate: async (deviation_id: number) => {
    const r = await apiClient.post<ApiEnvelope<RcaRecord>>("/rca/generate", { deviation_id });
    return unwrap(r.data);
  },
  list: async (limit = 50) => {
    const r = await apiClient.get<ApiEnvelope<RcaRecord[]>>("/rca", { params: { limit } });
    return unwrap(r.data);
  },
  get: async (id: number) => {
    const r = await apiClient.get<ApiEnvelope<RcaRecord>>(`/rca/${id}`);
    return unwrap(r.data);
  },
};

// ---------------- TICKETS ----------------
export const ticketApi = {
  list: async (params: { system?: "jira" | "servicenow"; limit?: number } = {}) => {
    const r = await apiClient.get<ApiEnvelope<Ticket[]>>("/tickets", { params });
    return unwrap(r.data);
  },
  create: async (payload: {
    system: "jira" | "servicenow";
    summary: string;
    description: string;
    priority?: string;
    deviation_id?: number;
  }) => {
    const r = await apiClient.post<ApiEnvelope<Ticket>>("/tickets", payload);
    return unwrap(r.data);
  },
};

// ---------------- CONNECTORS ----------------
export const connectorApi = {
  get: async (name: ConnectorName) => {
    const r = await apiClient.get<ApiEnvelope<ConnectorConfig>>(`/connectors/${name}`);
    return unwrap(r.data);
  },
  update: async (
    name: ConnectorName,
    payload: {
      base_url: string;
      username: string;
      secret?: string;
      project_or_table: string;
      sync_interval_seconds: number;
      enabled: boolean;
    },
  ) => {
    const r = await apiClient.put<ApiEnvelope<ConnectorConfig>>(`/connectors/${name}`, payload);
    return unwrap(r.data);
  },
  test: async (name: ConnectorName) => {
    const r = await apiClient.post<ApiEnvelope<{ ok: boolean; detail?: string }>>(`/connectors/${name}/test`);
    return unwrap(r.data);
  },
  sync: async (name: ConnectorName) => {
    const r = await apiClient.post<ApiEnvelope<SyncLog>>(`/connectors/${name}/sync`);
    return unwrap(r.data);
  },
  logs: async (name: ConnectorName, limit = 20) => {
    const r = await apiClient.get<ApiEnvelope<SyncLog[]>>(`/connectors/${name}/logs`, { params: { limit } });
    return unwrap(r.data);
  },
};

// ---------------- RAG ----------------
export const ragApi = {
  upload: async (file: File, source = "manual_upload") => {
    const form = new FormData();
    form.append("file", file);
    form.append("source", source);
    const r = await apiClient.post<ApiEnvelope<UploadedDocument>>("/rag/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap(r.data);
  },
  search: async (query: string, k = 5) => {
    const r = await apiClient.get<ApiEnvelope<{ chunks: { content: string; source: string; score: number }[] }>>(
      "/rag/search",
      { params: { query, k } },
    );
    return unwrap(r.data);
  },
  list: async () => {
    const r = await apiClient.get<ApiEnvelope<RagDocumentsResponse>>("/rag/documents");
    return unwrap(r.data);
  },
};

// ---------------- CHAT ----------------
export const chatApi = {
  send: async (session_id: string, message: string) => {
    const r = await apiClient.post<ApiEnvelope<ChatMessage>>("/chat/send", { session_id, message });
    return unwrap(r.data);
  },
  history: async (session_id: string) => {
    const r = await apiClient.get<ApiEnvelope<ChatMessage[]>>(`/chat/history/${session_id}`);
    return unwrap(r.data);
  },
};

// ---------------- REPORTS ----------------
export const reportApi = {
  generate: (format: "pdf" | "docx", days = 7) => {
    const token = localStorage.getItem("apea-access-token");
    const base = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/$/, "");
    const url = `${base}/reports/generate?format=${format}&days=${days}&token=${encodeURIComponent(token || "")}`;
    window.open(url, "_blank");
  },
  list: async () => {
    const r = await apiClient.get<ApiEnvelope<{ filename: string; size: number; created_at: string }[]>>(
      "/reports/list",
    );
    return unwrap(r.data);
  },
};

// ---------------- NOTIFICATIONS ----------------
export const notificationApi = {
  list: async (limit = 50) => {
    const r = await apiClient.get<ApiEnvelope<NotificationItem[]>>("/notifications", { params: { limit } });
    return unwrap(r.data);
  },
  unreadCount: async () => {
    const r = await apiClient.get<ApiEnvelope<{ count: number }>>("/notifications/unread-count");
    return unwrap(r.data);
  },
  markRead: async (id: number) => {
    const r = await apiClient.post<ApiEnvelope<NotificationItem>>(`/notifications/${id}/read`);
    return unwrap(r.data);
  },
};

// ---------------- AUDIT ----------------
export const auditApi = {
  list: async (limit = 100) => {
    const r = await apiClient.get<ApiEnvelope<AuditEntry[]>>("/audit", { params: { limit } });
    return unwrap(r.data);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FTP CONNECTOR
// ─────────────────────────────────────────────────────────────────────────────

export interface FtpConfig {
  id?: number;
  config_name: string;
  ftp_host: string;
  ftp_port: number;
  ftp_user: string;
  ftp_password?: string;
  ftp_password_masked?: string;
  has_password?: boolean;
  ftp_folder: string;
  sync_interval: number;
  use_tls?: boolean;
  passive_mode?: boolean;
  connect_timeout?: number;
  enabled: boolean;
  last_sync_at?: string;
  last_status?: string;
  last_error?: string;
  configured?: boolean;
}

export interface FtpSyncLog {
  id: number;
  config_name: string;
  started_at: string;
  finished_at?: string;
  status: "success" | "partial" | "failed";
  files_fetched: number;
  rows_inserted: number;
  error?: string;
}

export interface FtpAnalysis {
  id: number;
  config_name: string;
  plant: string;
  line: string;
  metric: string;
  latest_value: number;
  unit?: string;
  issue_detected: boolean;
  severity: "normal" | "low" | "medium" | "high" | "critical" | "unknown";
  issue_summary?: string;
  root_cause?: string;
  recommendation?: string;
  analyzed_at: string;
}

export interface FtpTestStep {
  check: string;
  ok: boolean;
  detail: string;
}

export interface FtpStatus {
  connected: boolean;
  enabled: boolean;
  host?: string;
  port?: number;
  use_tls?: boolean;
  passive_mode?: boolean;
  last_sync?: string;
  last_status?: string;
  last_error?: string;
}


export interface FtpDiagnoseStep {
  step: string;
  ok: boolean;
  detail: string;
}

export interface FtpDiagnoseResult {
  host: string;
  port: number;
  resolved_ip?: string;
  steps: FtpDiagnoseStep[];
  summary: string;
}

export const ftpApi = {
  listConfigs: async () => {
    const r = await apiClient.get<ApiEnvelope<FtpConfig[]>>("/ftp/configs");
    return unwrap(r.data);
  },
  getConfig: async (name: string) => {
    const r = await apiClient.get<ApiEnvelope<FtpConfig>>(`/ftp/configs/${name}`);
    return unwrap(r.data);
  },
  saveConfig: async (name: string, payload: Omit<FtpConfig, "id" | "config_name">) => {
    const r = await apiClient.put<ApiEnvelope<FtpConfig>>(`/ftp/configs/${name}`, payload);
    return unwrap(r.data);
  },
  deleteConfig: async (name: string) => {
    const r = await apiClient.delete<ApiEnvelope<{ deleted: boolean }>>(`/ftp/configs/${name}`);
    return unwrap(r.data);
  },
  connect: async (name: string) => {
    const r = await apiClient.post<ApiEnvelope<{ ok: boolean; detail: string }>>(`/ftp/configs/${name}/connect`);
    return unwrap(r.data);
  },
  disconnect: async (name: string) => {
    const r = await apiClient.delete<ApiEnvelope<{ ok: boolean; detail: string }>>(`/ftp/configs/${name}/connect`);
    return unwrap(r.data);
  },
  status: async (name: string) => {
    const r = await apiClient.get<ApiEnvelope<FtpStatus>>(`/ftp/configs/${name}/status`);
    return unwrap(r.data);
  },
  test: async (name: string) => {
    const r = await apiClient.post<ApiEnvelope<{ ok: boolean; detail: string; welcome?: string; steps?: FtpTestStep[] }>>(`/ftp/configs/${name}/test`);
    return unwrap(r.data);
  },
  sync: async (name: string) => {
    const r = await apiClient.post<ApiEnvelope<{ ok: boolean; files_fetched: number; rows_inserted: number }>>(`/ftp/configs/${name}/sync`);
    return unwrap(r.data);
  },
  syncLogs: async (name?: string, limit = 20) => {
    const url = name ? `/ftp/configs/${name}/sync-logs` : "/ftp/sync-logs";
    const r = await apiClient.get<ApiEnvelope<FtpSyncLog[]>>(url, { params: { limit } });
    return unwrap(r.data);
  },
  diagnose: async (name: string) => {
    const r = await apiClient.get<ApiEnvelope<FtpDiagnoseResult>>(`/ftp/configs/${name}/diagnose`);
    return unwrap(r.data);
  },
  analyses: async (name?: string, limit = 50) => {
    const url = name ? `/ftp/configs/${name}/analyses` : "/ftp/analyses";
    const r = await apiClient.get<ApiEnvelope<FtpAnalysis[]>>(url, { params: { limit } });
    return unwrap(r.data);
  },
};
