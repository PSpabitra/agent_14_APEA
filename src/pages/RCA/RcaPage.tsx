import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, Lightbulb, Wand2, FileText, ArrowLeft } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Sheet } from "@/components/ui";
import { deviationApi, rcaApi } from "@/services/api/endpoints";
import { formatDate, formatNumber } from "@/utils/formatters";
import { useUiStore } from "@/store/slices/ui";
import type { Deviation, RcaRecord } from "@/types";

export function RcaPage() {
  const [selectedRca, setSelectedRca] = useState<RcaRecord | null>(null);
  const navigate = useNavigate();
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

  const deviation = detail.data?.deviation;
  const latestRca = detail.data?.rca;

  const parsedHypotheses = useMemo(() => {
    if (!latestRca?.hypotheses) return null;
    let data = latestRca.hypotheses;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        return data;
      }
    }
    if (Array.isArray(data) && data.length === 1 && typeof data[0] === "string") {
      return data[0]; // Markdown block
    }
    return data;
  }, [latestRca?.hypotheses]);

  const parsedRecommendedActions = useMemo(() => {
    if (!latestRca?.recommended_actions) return [];
    let data = latestRca.recommended_actions;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        return [data];
      }
    }
    return Array.isArray(data) ? data : [];
  }, [latestRca?.recommended_actions]);

  const parsedEvidence = useMemo(() => {
    if (!latestRca?.evidence) return [];
    let data = latestRca.evidence;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        return [];
      }
    }
    return Array.isArray(data) ? data : [];
  }, [latestRca?.evidence]);

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

  const rcaListCols: Column<RcaRecord>[] = useMemo(
    () => [
      { key: "id", header: "ID", cell: (r) => <span className="font-mono text-xs">#{r.id}</span>, width: "60px" },
      {
        key: "dev",
        header: "Deviation",
        width: "100px",
        cell: (r) => (
          <button
            onClick={() => setParams({ deviation: String(r.deviation_id) })}
            className="font-mono text-xs text-primary hover:underline"
          >
            #{r.deviation_id}
          </button>
        ),
      },
      {
        key: "summary",
        header: "Summary",
        align: "center",
        cell: (r) => {
          const content = r.root_cause || r.summary || "";
          return (
            <span className="truncate block text-xs overflow-hidden" title={content}>
              {content}
            </span>
          );
        },
      },
      {
        key: "conf",
        header: "Confidence",
        cell: (r) => (r.confidence ? <span className="text-xs">{(r.confidence * 100).toFixed(0)}%</span> : "-"),
        width: "100px",
        align: "center",
      },
      {
        key: "when",
        header: "Generated",
        cell: (r) => r.created_at,
        width: "180px",
        align: "right",
      },
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
    <PageWrapper
      title="Root Cause Analysis"
      description="AI-assisted hypothesis ranking with retrieval grounding"
      actions={
        deviationId ? (
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        ) : undefined
      }
    >
      {deviationId && deviation ? (
        <div className="space-y-4">
          <Card
            title={`Deviation #${deviation.id}`}
            description={`${deviation.plant} / ${deviation.line} — ${deviation.metric}`}
            action={
              <Button
                leftIcon={<Wand2 className="h-4 w-4" />}
                onClick={() => generateMut.mutate(deviation.id)}
                isLoading={generateMut.isPending}
              >
                Generate RCA
              </Button>
            }
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-subtext">Expected</p>
                <p className="font-mono text-lg">{formatNumber(deviation.expected_value)}</p>
              </div>
              <div>
                <p className="text-xs text-subtext">Actual</p>
                <p className="font-mono text-lg text-text">{formatNumber(deviation.actual_value)}</p>
              </div>
              <div>
                <p className="text-xs text-subtext">Confidence</p>
                <p className="font-mono text-lg">{(deviation.confidence_score * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-xs text-subtext">Status</p>
                <Badge tone="warning" className="capitalize">
                  {deviation.status}
                </Badge>
              </div>
            </div>
          </Card>

          {latestRca ? (
            <Card title="AI analysis" action={<Brain className="h-5 w-5 text-primary" />}>
              <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border pb-4 text-xs text-subtext">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold">Generated:</span>
                  <span>{latestRca.created_at}</span>
                </div>
                {latestRca.confidence && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">Confidence:</span>
                    <span className="text-primary font-mono">{(latestRca.confidence * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-text whitespace-pre-wrap">{latestRca.root_cause || latestRca.summary}</p>

              <h4 className="mt-5 mb-2 text-sm font-semibold text-text flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-warning" /> Analysis Output
              </h4>
              <div className="space-y-3">
                {typeof parsedHypotheses === "string" ? (
                  <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-text whitespace-pre-wrap leading-relaxed shadow-sm">
                    {parsedHypotheses}
                  </div>
                ) : (
                  Array.isArray(parsedHypotheses) &&
                  parsedHypotheses.map((h: any) => (
                    <div key={h.rank} className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-text">
                          #{h.rank}. {h.cause}
                        </p>
                        <Badge tone="info">{(h.confidence * 100).toFixed(0)}%</Badge>
                      </div>
                      <p className="mt-1 text-xs text-subtext">{h.evidence}</p>
                    </div>
                  ))
                )}
              </div>

              {parsedEvidence.length > 0 && (
                <>
                  <h4 className="mt-5 mb-2 text-sm font-semibold text-text">Grounding Evidence</h4>
                  <div className="flex flex-wrap gap-2">
                    {parsedEvidence.map((ev, i) => (
                      <Badge key={i} tone="neutral" className="flex items-center gap-1 text-[10px] py-0.5 px-2">
                        <FileText className="h-3 w-3 text-subtext" />
                        <span className="max-w-[150px] truncate">{ev.filename}</span>
                        <span className="text-subtext ml-1 opacity-70">({(ev.score * 100).toFixed(0)}%)</span>
                      </Badge>
                    ))}
                  </div>
                </>
              )}

              {parsedRecommendedActions.length > 0 && (
                <>
                  <h4 className="mt-5 mb-2 text-sm font-semibold text-text">Recommended actions</h4>
                  <ul className="space-y-1">
                    {parsedRecommendedActions.map((a, i) => (
                      <li key={i} className="text-sm text-text flex gap-2">
                        <span className="text-subtext">•</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <p className="mt-4 text-xs text-subtext">Generated {latestRca.created_at}</p>
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
          rows={rcaList.data || []}
          rowKey={(r) => r.id}
          isLoading={rcaList.isLoading}
          onRowClick={(r) => setSelectedRca(r)}
          empty="No RCA generated yet."
        />
      </Card>
      <Sheet
        open={!!selectedRca}
        onClose={() => setSelectedRca(null)}
        title={`RCA Detail #${selectedRca?.id}`}
        description={`Deviation #${selectedRca?.deviation_id}`}
        size="lg"
      >
        {selectedRca && (
          <div className="space-y-6">
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-subtext mb-2">Root Cause Summary</h4>
              <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-text whitespace-pre-wrap leading-relaxed">
                {selectedRca.root_cause || selectedRca.summary}
              </div>
            </section>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-3">
                <p className="text-[10px] font-semibold uppercase text-subtext mb-1">Confidence</p>
                <p className="font-mono text-lg text-primary">
                  {selectedRca.confidence ? `${(selectedRca.confidence * 100).toFixed(0)}%` : "-"}
                </p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-[10px] font-semibold uppercase text-subtext mb-1">Generated</p>
                <p className="text-sm text-text">{selectedRca.created_at}</p>
              </div>
            </div>

            {selectedRca.hypotheses && (
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-subtext mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-warning" /> Analysis Output
                </h4>
                <div className="space-y-3">
                  {typeof selectedRca.hypotheses === "string" ? (
                    <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-text whitespace-pre-wrap leading-relaxed">
                      {selectedRca.hypotheses}
                    </div>
                  ) : (
                    Array.isArray(selectedRca.hypotheses) &&
                    selectedRca.hypotheses.map((h: any) => (
                      <div key={h.rank} className="rounded-lg border border-border bg-muted/30 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-text">
                            #{h.rank}. {h.cause}
                          </p>
                          <Badge tone="info">{(h.confidence * 100).toFixed(0)}%</Badge>
                        </div>
                        <p className="mt-1 text-xs text-subtext">{h.evidence}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {selectedRca.recommended_actions && (
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-subtext mb-2">Recommended Actions</h4>
                <ul className="space-y-2">
                  {(typeof selectedRca.recommended_actions === "string"
                    ? [selectedRca.recommended_actions]
                    : selectedRca.recommended_actions
                  ).map((a, i) => (
                    <li key={i} className="text-sm text-text flex gap-3 p-2 rounded-md hover:bg-muted/30 transition-colors">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {selectedRca.evidence && Array.isArray(selectedRca.evidence) && selectedRca.evidence.length > 0 && (
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-subtext mb-2">Grounding Evidence</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedRca.evidence.map((ev: any, i: number) => (
                    <Badge key={i} tone="neutral" className="flex items-center gap-1.5 text-[10px] py-1 px-2.5">
                      <FileText className="h-3 w-3 text-subtext" />
                      <span className="max-w-[200px] truncate">{ev.filename}</span>
                      <span className="text-subtext ml-1 opacity-70">({(ev.score * 100).toFixed(0)}%)</span>
                    </Badge>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </Sheet>
    </PageWrapper>
  );
}
