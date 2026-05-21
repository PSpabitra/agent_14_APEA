import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Brain, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ftpApi, type FtpAnalysis } from "@/services/api/endpoints";
import { formatDate } from "@/utils/formatters";

const SEV_TONE: Record<string, "success"|"warning"|"danger"|"neutral"> = {
  normal:"success", low:"neutral", medium:"warning", high:"danger", critical:"danger", unknown:"neutral",
};

function Row({ row }: { row: FtpAnalysis }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/40 transition-colors" onClick={() => setOpen(o => !o)}>
        <span className="shrink-0">{row.issue_detected ? <AlertTriangle className="h-4 w-4 text-warning" /> : <CheckCircle2 className="h-4 w-4 text-success" />}</span>
        <span className="flex-1 min-w-0">
          <span className="font-medium text-sm text-text">{row.plant}</span>
          <span className="text-subtext mx-1">/</span>
          <span className="text-sm text-text">{row.line}</span>
          <span className="text-subtext mx-1">·</span>
          <span className="font-mono text-xs text-subtext">{row.metric}</span>
        </span>
        <span className="text-sm font-mono text-text shrink-0 mr-2">{row.latest_value}{row.unit ? ` ${row.unit}` : ""}</span>
        <Badge tone={SEV_TONE[row.severity] || "neutral"} className="uppercase shrink-0 mr-2">{row.severity}</Badge>
        <span className="text-xs text-subtext shrink-0 mr-2">{formatDate(row.analyzed_at)}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-subtext shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-subtext shrink-0" />}
      </button>
      {open && (
        <div className="px-10 pb-4 space-y-3">
          {row.issue_detected ? (
            <>
              {row.issue_summary && <div><p className="text-xs font-semibold text-subtext uppercase tracking-wide mb-1">Issue</p><p className="text-sm text-text">{row.issue_summary}</p></div>}
              {row.root_cause && <div><p className="text-xs font-semibold text-subtext uppercase tracking-wide mb-1">Root Cause</p><p className="text-sm text-text">{row.root_cause}</p></div>}
              {row.recommendation && <div><p className="text-xs font-semibold text-subtext uppercase tracking-wide mb-1">Recommendation</p><p className="text-sm text-text whitespace-pre-line">{row.recommendation}</p></div>}
            </>
          ) : <p className="text-sm text-success">No anomaly detected for this metric.</p>}
        </div>
      )}
    </div>
  );
}

export function FtpAnalysisPanel() {
  const analyses = useQuery({ queryKey: ["ftp-analyses"], queryFn: () => ftpApi.analyses(undefined, 50), refetchInterval: 30_000 });
  const rows = analyses.data || [];
  const issues = rows.filter(r => r.issue_detected);

  return (
    <Card
      title={<span className="flex items-center gap-2"><Brain className="h-4 w-4" />AI Root Cause Analysis{issues.length > 0 && <Badge tone="danger" className="ml-1">{issues.length} issue{issues.length > 1 ? "s" : ""}</Badge>}</span>}
      description="Mistral LLM analysis of FTP telemetry batches — runs automatically after each sync."
    >
      {analyses.isLoading ? (
        <div className="py-8 text-center text-sm text-subtext animate-pulse">Loading analyses…</div>
      ) : rows.length === 0 ? (
        <div className="py-8 text-center text-sm text-subtext">No analyses yet — connect an FTP source and sync to begin.</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-3 py-1.5 bg-muted/60 border-b border-border text-xs text-subtext font-medium">
            <span className="w-5" /><span className="flex-1">Plant / Line · Metric</span>
            <span className="w-24 text-right">Latest Value</span><span className="w-20 text-right">Severity</span>
            <span className="w-32 text-right">Analyzed</span><span className="w-4" />
          </div>
          {rows.map(row => <Row key={row.id} row={row} />)}
        </div>
      )}
    </Card>
  );
}
