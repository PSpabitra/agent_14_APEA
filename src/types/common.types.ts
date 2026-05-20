export type Severity = "low" | "medium" | "high" | "critical";
export type DeviationStatus = "open" | "ack" | "resolved" | "ignored";
export type ConnectorName = "jira" | "servicenow";
export type Role = "admin" | "engineer" | "viewer";

export interface PaginatedQuery {
  page?: number;
  page_size?: number;
}
