import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Activity,
  Ticket as TicketIcon,
  Brain,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { dashboardApi } from "@/services/api/endpoints";
import { formatDate, formatNumber, formatPercent } from "@/utils/formatters";
import type { Deviation, Severity } from "@/types";

const SEVERITY_COLORS: Record<Severity, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

const SEVERITY_TONE: Record<Severity, "success" | "warning" | "info" | "danger"> = {
  low: "success",
  medium: "warning",
  high: "info",
  critical: "danger",
};

export function DashboardPage() {
  const navigate = useNavigate();
  const stats = useQuery({ queryKey: ["dash", "stats"], queryFn: dashboardApi.stats, refetchInterval: 30_000 });
  const severity = useQuery({ queryKey: ["dash", "severity"], queryFn: dashboardApi.severity, refetchInterval: 60_000 });
  const timeseries = useQuery({ queryKey: ["dash", "timeseries"], queryFn: () => dashboardApi.timeseries(24), refetchInterval: 60_000 });
  const sla = useQuery({ queryKey: ["dash", "sla"], queryFn: dashboardApi.sla, refetchInterval: 120_000 });
  const recent = useQuery({ queryKey: ["dash", "recent"], queryFn: () => dashboardApi.recentDeviations(10), refetchInterval: 20_000 });

  const recentCols: Column<Deviation>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="font-mono text-xs">#{r.id}</span>, width: "80px" },
    { key: "plant", header: "Plant / Line", cell: (r) => `${r.plant} / ${r.line}` },
    { key: "metric", header: "Metric", cell: (r) => r.metric },
    { key: "value", header: "Actual", cell: (r) => <span className="font-mono">{formatNumber(r.actual_value)}</span>, align: "right" },
    { key: "severity", header: "Severity", cell: (r) => <Badge tone={SEVERITY_TONE[r.severity]} className="capitalize">{r.severity}</Badge> },
    { key: "when", header: "Detected", cell: (r) => formatDate(r.detected_at) },
  ];

  const severityData = severity.data?.map((s) => ({ name: s.severity, value: s.count, fill: SEVERITY_COLORS[s.severity] })) || [];

  return (
    <PageWrapper title="Operations Overview" description="Real-time production exception monitoring">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Telemetry events" value={formatNumber(stats.data?.total_events ?? 0, 0)} icon={<Activity className="h-5 w-5" />} />
        <StatCard
          label="Open deviations"
          value={formatNumber(stats.data?.open_deviations ?? 0, 0)}
          hint={`${stats.data?.critical_count ?? 0} critical, ${stats.data?.high_count ?? 0} high`}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone={(stats.data?.critical_count ?? 0) > 0 ? "danger" : (stats.data?.high_count ?? 0) > 0 ? "warning" : "default"}
        />
        <StatCard label="Open tickets" value={formatNumber(stats.data?.open_tickets ?? 0, 0)} icon={<TicketIcon className="h-5 w-5" />} tone="info" />
        <StatCard label="RCA generated" value={formatNumber(stats.data?.rca_generated ?? 0, 0)} icon={<Brain className="h-5 w-5" />} tone="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Deviations — last 24 hours" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={timeseries.data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="bucket" stroke="rgb(var(--color-subtext))" fontSize={11} />
                <YAxis stroke="rgb(var(--color-subtext))" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "rgb(var(--color-surface))", border: "1px solid rgb(var(--color-border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="count" stroke="rgb(var(--color-primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Severity breakdown">
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={severityData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {severityData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "rgb(var(--color-surface))", border: "1px solid rgb(var(--color-border))", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="SLA compliance — past 7 days" description="4-hour resolution SLA" action={<TrendingUp className="h-5 w-5 text-success" />}>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={sla.data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
              <XAxis dataKey="day" stroke="rgb(var(--color-subtext))" fontSize={11} />
              <YAxis stroke="rgb(var(--color-subtext))" fontSize={11} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} domain={[0, 1]} />
              <Tooltip formatter={(v: number) => formatPercent(v, 1)} contentStyle={{ background: "rgb(var(--color-surface))", border: "1px solid rgb(var(--color-border))", borderRadius: 8 }} />
              <Bar dataKey="sla_pct" fill="rgb(var(--color-primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Recent deviations" description="Click a row to investigate">
        <DataTable rows={recent.data || []} columns={recentCols} rowKey={(r) => r.id} isLoading={recent.isLoading} onRowClick={(r) => navigate(`/rca?deviation=${r.id}`)} />
      </Card>
    </PageWrapper>
  );
}
