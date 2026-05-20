import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CircleSlash, Filter, Search } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { deviationApi } from "@/services/api/endpoints";
import { formatDate, formatNumber } from "@/utils/formatters";
import { useDebounce } from "@/hooks/useDebounce";
import { useUiStore } from "@/store/slices/ui";
import type { Deviation, DeviationStatus, Severity } from "@/types";

const SEVERITY_TONE: Record<Severity, "success" | "warning" | "info" | "danger"> = {
  low: "success",
  medium: "warning",
  high: "info",
  critical: "danger",
};

const STATUS_TONE: Record<DeviationStatus, "neutral" | "info" | "success" | "warning"> = {
  open: "warning",
  ack: "info",
  resolved: "success",
  ignored: "neutral",
};

const SEVERITIES: ("" | Severity)[] = ["", "low", "medium", "high", "critical"];
const STATUSES: ("" | DeviationStatus)[] = ["", "open", "ack", "resolved", "ignored"];

export function ExceptionsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  const [severity, setSeverity] = useState<"" | Severity>("");
  const [status, setStatus] = useState<"" | DeviationStatus>("open");
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 250);

  const list = useQuery({
    queryKey: ["deviations", severity, status],
    queryFn: () => deviationApi.list({
      severity: severity || undefined,
      status: status || undefined,
      limit: 200,
    }),
    refetchInterval: 20_000,
  });

  const filtered = useMemo(() => {
    const rows = list.data || [];
    if (!debounced) return rows;
    const q = debounced.toLowerCase();
    return rows.filter((r) =>
      r.plant.toLowerCase().includes(q) ||
      r.line.toLowerCase().includes(q) ||
      r.metric.toLowerCase().includes(q) ||
      String(r.id).includes(q),
    );
  }, [list.data, debounced]);

  const updateMut = useMutation({
    mutationFn: ({ id, next }: { id: number; next: DeviationStatus }) => deviationApi.updateStatus(id, next),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["deviations"] });
      qc.invalidateQueries({ queryKey: ["dash"] });
      pushToast({ title: `Deviation #${vars.id} -> ${vars.next}`, variant: "success" });
    },
    onError: (err: Error) => pushToast({ title: "Update failed", description: err.message, variant: "error" }),
  });

  const columns: Column<Deviation>[] = [
    { key: "id", header: "ID", cell: (r) => <span className="font-mono text-xs">#{r.id}</span>, width: "80px" },
    { key: "plant", header: "Plant / Line", cell: (r) => `${r.plant} / ${r.line}` },
    { key: "metric", header: "Metric", cell: (r) => <span className="capitalize">{r.metric}</span> },
    { key: "expected", header: "Expected", cell: (r) => <span className="font-mono">{formatNumber(r.expected_value)}</span>, align: "right" },
    { key: "actual", header: "Actual", cell: (r) => <span className="font-mono text-text">{formatNumber(r.actual_value)}</span>, align: "right" },
    { key: "conf", header: "Confidence", cell: (r) => <span className="text-xs">{(r.confidence_score * 100).toFixed(0)}%</span>, align: "right" },
    { key: "severity", header: "Severity", cell: (r) => <Badge tone={SEVERITY_TONE[r.severity]} className="capitalize">{r.severity}</Badge> },
    { key: "status", header: "Status", cell: (r) => <Badge tone={STATUS_TONE[r.status]} className="capitalize">{r.status}</Badge> },
    { key: "when", header: "Detected", cell: (r) => formatDate(r.detected_at) },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (r) => (
        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {r.status === "open" && (
            <Button size="sm" variant="secondary" onClick={() => updateMut.mutate({ id: r.id, next: "ack" })}>
              Ack
            </Button>
          )}
          {r.status !== "resolved" && (
            <Button size="sm" variant="ghost" leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={() => updateMut.mutate({ id: r.id, next: "resolved" })}>
              Resolve
            </Button>
          )}
          {r.status !== "ignored" && r.status !== "resolved" && (
            <Button size="sm" variant="ghost" leftIcon={<CircleSlash className="h-3.5 w-3.5" />} onClick={() => updateMut.mutate({ id: r.id, next: "ignored" })}>
              Ignore
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageWrapper title="Exceptions" description="All detected production deviations">
      <Card padded>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
            <Input
              label="Search"
              placeholder="plant, line, metric..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text">Severity</label>
              <select value={severity} onChange={(e) => setSeverity(e.target.value as Severity | "")} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text">
                {SEVERITIES.map((s) => <option key={s || "all"} value={s}>{s ? s : "All"}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as DeviationStatus | "")} className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text">
                {STATUSES.map((s) => <option key={s || "all"} value={s}>{s ? s : "All"}</option>)}
              </select>
            </div>
          </div>
          <div className="text-xs text-subtext flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            <span>{filtered.length} result(s)</span>
          </div>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.id}
        isLoading={list.isLoading}
        onRowClick={(r) => navigate(`/rca?deviation=${r.id}`)}
        empty="No deviations match the current filters."
      />
    </PageWrapper>
  );
}
