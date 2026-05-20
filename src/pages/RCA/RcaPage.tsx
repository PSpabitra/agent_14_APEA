import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, Lightbulb, Wand2, FileText } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { deviationApi, rcaApi } from "@/services/api/endpoints";
import { formatDate, formatNumber } from "@/utils/formatters";
import { useUiStore } from "@/store/slices/ui";
import type { Deviation } from "@/types";

export function RcaPage() {
  const [params, setParams] = useSearchParams();
  const deviationId = params.get("deviation") ? Number(params.get("deviation")) : null;
  const qc = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  const recentDeviations = useQuery({
    queryKey: ["rca-deviation-list"],
    queryFn: () => deviationApi.list({ limit: 50 }),
  });

  const detail = useQuery({
    queryKey: ["deviation", deviationId],
    queryFn: () => deviationApi.get(deviationId!),
    enabled: !!deviationId,
  });

  const rcaList = useQuery({
    queryKey: ["rca-list"],
    queryFn: () => rcaApi.list(20),
    refetchInterval: 60_000,
  });

  const generateMut = useMutation({
    mutationFn: (id: number) => rcaApi.generate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deviation", deviationId] });
      qc.invalidateQueries({ queryKey: ["rca-list"] });
      pushToast({ title: "RCA generated", variant: "success" });
    },
    onError: (err: Error) =>
      pushToast({ title: "RCA generation failed", description: err.message, variant: "error" }),
  });

  const rcaListCols: Column<{ id: number; deviation_id: number; summary: string; created_at: string }>[] = useMemo(
    () => [
      { key: "id", header: "ID", cell: (r) => <span className="font-mono text-xs">#{r.id}</span>, width: "80px" },
      {
        key: "dev",
        header: "Deviation",
        cell: (r) => (
          <button
            onClick={() => setParams({ deviation: String(r.deviation_id) })}
            className="font-mono text-xs text-primary hover:underline"
          >
            #{r.deviation_id}
          </button>
        ),
      },
      { key: "summary", header: "Summary", cell: (r) => <span className="truncate">{r.summary}</span> },
      { key: "when", header: "Generated", cell: (r) => formatDate(r.created_at) },
    ],
    [setParams],
  );

  const deviationCols: Column<Deviation>[] = useMemo(
    () => [
      {
        key: "id",
        header: "ID",
        cell: (r) => (
          <button
            onClick={() => setParams({ deviation: String(r.id) })}
            className="font-mono text-xs text-primary hover:underline"
          >
            #{r.id}
          </button>
        ),
        width: "80px",
      },
      { key: "plant", header: "Plant / Line", cell: (r) => `${r.plant} / ${r.line}` },
      { key: "metric", header: "Metric", cell: (r) => r.metric },
      { key: "sev", header: "Severity", cell: (r) => <Badge className="capitalize">{r.severity}</Badge> },
      { key: "when", header: "Detected", cell: (r) => formatDate(r.detected_at) },
    ],
    [setParams],
  );

  return (
    <PageWrapper title="Root Cause Analysis" description="AI-assisted hypothesis ranking with retrieval grounding">
      {deviationId && detail.data ? (
        <div className="space-y-4">
          <Card
            title={`Deviation #${detail.data.id}`}
            description={`${detail.data.plant} / ${detail.data.line} — ${detail.data.metric}`}
            action={
              <Button
                leftIcon={<Wand2 className="h-4 w-4" />}
                onClick={() => generateMut.mutate(detail.data!.id)}
                isLoading={generateMut.isPending}
              >
                Generate RCA
              </Button>
            }
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-subtext">Expected</p>
                <p className="font-mono text-lg">{formatNumber(detail.data.expected_value)}</p>
              </div>
              <div>
                <p className="text-xs text-subtext">Actual</p>
                <p className="font-mono text-lg text-text">{formatNumber(detail.data.actual_value)}</p>
              </div>
              <div>
                <p className="text-xs text-subtext">Confidence</p>
                <p className="font-mono text-lg">{(detail.data.confidence_score * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-xs text-subtext">Status</p>
                <Badge tone="warning" className="capitalize">
                  {detail.data.status}
                </Badge>
              </div>
            </div>
          </Card>

          {detail.data.latest_rca ? (
            <Card title="AI analysis" action={<Brain className="h-5 w-5 text-primary" />}>
              <p className="text-sm text-text whitespace-pre-wrap">{detail.data.latest_rca.summary}</p>

              <h4 className="mt-5 mb-2 text-sm font-semibold text-text flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-warning" /> Ranked hypotheses
              </h4>
              <div className="space-y-2">
                {detail.data.latest_rca.hypotheses.map((h) => (
                  <div key={h.rank} className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-text">
                        #{h.rank}. {h.cause}
                      </p>
                      <Badge tone="info">{(h.confidence * 100).toFixed(0)}%</Badge>
                    </div>
                    <p className="mt-1 text-xs text-subtext">{h.evidence}</p>
                  </div>
                ))}
              </div>

              <h4 className="mt-5 mb-2 text-sm font-semibold text-text">Recommended actions</h4>
              <ul className="space-y-1">
                {detail.data.latest_rca.recommended_actions.map((a, i) => (
                  <li key={i} className="text-sm text-text flex gap-2">
                    <span className="text-subtext">•</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-xs text-subtext">Generated {formatDate(detail.data.latest_rca.created_at)}</p>
            </Card>
          ) : (
            <Card>
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <FileText className="h-8 w-8 text-subtext" />
                <p className="text-sm text-subtext">No RCA yet for this deviation. Click "Generate RCA" above.</p>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card title="Pick a deviation to analyze">
          <DataTable
            columns={deviationCols}
            rows={recentDeviations.data || []}
            rowKey={(r) => r.id}
            isLoading={recentDeviations.isLoading}
            onRowClick={(r) => setParams({ deviation: String(r.id) })}
            empty="No deviations available."
          />
        </Card>
      )}

      <Card title="Recent RCA records">
        <DataTable
          columns={rcaListCols}
          rows={(rcaList.data || []).map((r) => ({
            id: r.id,
            deviation_id: r.deviation_id,
            summary: r.summary,
            created_at: r.created_at,
          }))}
          rowKey={(r) => r.id}
          isLoading={rcaList.isLoading}
          empty="No RCA generated yet."
        />
      </Card>
    </PageWrapper>
  );
}
