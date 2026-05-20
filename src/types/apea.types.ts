export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type ExceptionStatus = 'new' | 'triaging' | 'action_pending' | 'escalated' | 'monitoring' | 'resolved' | 'reopened' | 'closed';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface TelemetryMetric {
  id: number;
  idempotency_key: string;
  plant_name: string;
  line_name: string;
  studio_name?: string;
  metric_type: string;
  actual_value: number;
  target_value: number;
  unit?: string;
  source: string;
  recorded_at: string;
  created_at: string;
}

export interface DeviationEvent {
  id: number;
  telemetry_id: number;
  plant_name: string;
  line_name: string;
  metric_type: string;
  actual_value: number;
  target_value: number;
  gap_percent: number;
  severity: Severity;
  confidence: number;
  evidence?: string;
  status: 'open' | 'acknowledged' | 'resolved';
  detected_at: string;
}

export interface ExceptionCase {
  id: number;
  exception_ref: string;
  deviation_id: number;
  plant_name: string;
  line_name: string;
  studio_name?: string;
  title: string;
  description?: string;
  severity: Severity;
  status: ExceptionStatus;
  risk_score: number;
  risk_level: RiskLevel;
  sla_deadline?: string;
  sla_breached: boolean;
  assigned_owner?: string;
  execution_plan?: string;
  workflow_state?: string;
  last_status_reason?: string;
  opened_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface ExceptionDetail extends ExceptionCase {
  rca?: RcaResult;
  corrective_actions: CorrectiveAction[];
  escalations: EscalationEvent[];
  audit_trail: AuditLog[];
}

export interface RcaResult {
  id: number;
  exception_id: number;
  hypotheses: RcaHypothesis[] | string;
  top_cause?: string;
  evidence_sources?: string;
  owner_input?: string;
  rag_context?: string;
  status: 'pending' | 'complete' | 'owner_input_required';
  analyzed_at: string;
}

export interface RcaHypothesis {
  rank: number;
  cause: string;
  confidence: number;
  evidence: string[];
}

export interface CorrectiveAction {
  id: number;
  exception_id: number;
  playbook_id?: number;
  ticket_id?: string;
  ticket_system: 'jira' | 'servicenow' | 'manual';
  ticket_url?: string;
  title: string;
  description?: string;
  assigned_to?: string;
  priority: Severity;
  status: 'open' | 'in_progress' | 'pending_review' | 'complete' | 'cancelled';
  due_date?: string;
  completed_at?: string;
  closure_notes?: string;
  created_at: string;
}

export interface EscalationEvent {
  id: number;
  exception_id: number;
  escalation_level: 'l1' | 'l2' | 'l3' | 'executive';
  reason: string;
  policy_rule_id?: string;
  notified_to?: string;
  channels?: string;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  escalated_at: string;
}

export interface Playbook {
  id: number;
  name: string;
  category?: string;
  plant_name?: string;
  line_name?: string;
  severity_target: Severity | 'all';
  steps: PlaybookStep[] | string;
  tags?: string;
  version: number;
  is_active: boolean;
  created_at: string;
}

export interface PlaybookStep {
  step: number;
  action: string;
  owner?: string;
}

export interface AuditLog {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  old_value?: string;
  new_value?: string;
  performed_by: string;
  agent_name?: string;
  notes?: string;
  created_at: string;
}

export interface DashboardSummary {
  status_counts: Record<ExceptionStatus, number>;
  severity_counts: Record<Severity, number>;
  top_risks: ExceptionCase[];
  recent_exceptions: ExceptionCase[];
  metrics: {
    recent_deviations_24h: number;
    sla_breached_open: number;
    avg_risk_score_open: number;
    total_open: number;
  };
  telemetry_trend: { day: string; count: number }[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  rag_used?: boolean;
}

export interface ApiListResponse<T> {
  data: T[];
  count: number;
}
