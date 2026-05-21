import type { ConnectorName, DeviationStatus, Role, Severity } from "./common.types";

export interface ApiEnvelope<T = unknown> {
  ok?: boolean;
  success?: boolean;
  data?: T;
  error?: { code?: string; message: string };
  message?: string;
  meta?: Record<string, unknown>;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface DashboardStats {
  telemetry_24h: number;
  deviations_open: number;
  deviations_total: number;
  tickets_open: number;
  critical_open: number;
  rca_generated?: number;
  high_count?: number;
  medium_count?: number;
  low_count?: number;
}

export interface SeverityBreakdown {
  severity: Severity;
  count: number;
}

export interface TimeseriesPoint {
  bucket: string;
  count: number;
}

export interface SlaMetric {
  day: string;
  total: number;
  within_sla: number;
  breached: number;
  sla_pct: number;
}

export interface Deviation {
  id: number;
  plant: string;
  line: string;
  metric: string;
  expected_value: number | null;
  actual_value: number;
  severity: Severity;
  confidence_score: number;
  status: DeviationStatus;
  detected_at: string;
  notes?: string | null;
}

export interface DeviationDetail {
  deviation: Deviation;
  rca: RcaRecord | null;
}

export interface TelemetryEvent {
  id: number;
  plant: string;
  line: string;
  metric: string;
  value: number;
  unit?: string | null;
  occurred_at: string;
}

export interface Ticket {
  id: number;
  external_id: string;
  system: "jira" | "servicenow";
  summary: string;
  status: string;
  priority?: string | null;
  url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RcaRecord {
  id: number;
  deviation_id: number;
  root_cause: string;
  confidence?: number;
  summary?: string;
  hypotheses?: string | any[];
  evidence?: string | any[];
  generated_by?: string;
  recommended_actions?: string[] | string;
  created_at: string;
}

export interface ConnectorConfig {
  connector: ConnectorName;
  base_url: string;
  username: string;
  project_or_table: string;
  sync_interval_seconds: number;
  enabled: boolean;
  has_secret: boolean;
  last_sync_at?: string | null;
  last_status?: "ok" | "error" | null;
  last_error?: string | null;
}

export interface SyncLog {
  id: number;
  connector: ConnectorName;
  status: "ok" | "error";
  items_pulled: number;
  message?: string | null;
  started_at: string;
  finished_at: string;
}

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  citations?: { source: string; score: number }[];
  created_at?: string;
}

export interface UploadedDocument {
  id: number;
  filename: string;
  doc_type: string;
  chunk_count: number;
  status: string;
  created_at: string;
}

export interface RagDocumentsResponse {
  documents: UploadedDocument[];
  stats: {
    count: number;
    name: string;
    path: string;
  };
}

export interface AuditEntry {
  id: number;
  user_email?: string | null;
  action: string;
  entity: string;
  entity_id?: string | null;
  ip?: string | null;
  created_at: string;
}

export interface GDriveConfig {
  connector: "gdrive";
  base_url: string;
  username: string;
  project_or_table: string; // folder ID
  sync_interval: number;
  enabled: boolean;
  has_secret: boolean;
  last_sync_at?: string | null;
  last_status?: "success" | "partial" | "failed" | "skipped" | null;
  last_error?: string | null;
  configured: boolean;
}

export interface GDriveFile {
  id: number;
  drive_file_id: string;
  name: string;
  mime_type: string;
  size?: string | null;
  modified_time?: string | null;
  created_time?: string | null;
  web_view_link?: string | null;
  owners?: { displayName?: string; emailAddress?: string }[] | null;
  trashed: boolean;
  last_synced_at: string;
}
