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
  total_events: number;
  open_deviations: number;
  open_tickets: number;
  rca_generated: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
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

export interface DeviationDetail extends Deviation {
  latest_rca?: RcaRecord | null;
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
  hypotheses: { rank: number; cause: string; evidence: string; confidence: number }[];
  summary: string;
  recommended_actions: string[];
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
  source: string;
  chunks: number;
  uploaded_at: string;
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
