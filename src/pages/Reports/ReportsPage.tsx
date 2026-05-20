import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileDown, FileText } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { reportApi } from "@/services/api/endpoints";
import { formatDate, formatNumber } from "@/utils/formatters";

export function ReportsPage() {
  const [days, setDays] = useState(7);
  const list = useQuery({ queryKey: ["reports"], queryFn: reportApi.list, refetchInterval: 30_000 });

  return (
    <PageWrapper title="Reports" description="On-demand PDF / DOCX summaries of incidents, RCAs, and SLA">
      <Card title="Generate report">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text">Time window</label>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text"
            >
              {[1, 7, 14, 30, 90].map((d) => (
                <option key={d} value={d}>
                  Last {d} day(s)
                </option>
              ))}
            </select>
          </div>
          <Button leftIcon={<FileDown className="h-4 w-4" />} onClick={() => reportApi.generate("pdf", days)}>
            Download PDF
          </Button>
          <Button
            variant="secondary"
            leftIcon={<FileDown className="h-4 w-4" />}
            onClick={() => reportApi.generate("docx", days)}
          >
            Download DOCX
          </Button>
        </div>
      </Card>

      <Card title="Previously generated">
        <ul className="divide-y divide-border">
          {(list.data || []).map((r) => (
            <li key={r.filename} className="flex items-center gap-3 py-2.5">
              <FileText className="h-4 w-4 text-subtext" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">{r.filename}</p>
                <p className="text-xs text-subtext">{formatDate(r.created_at)}</p>
              </div>
              <span className="text-xs text-subtext">{formatNumber(r.size / 1024, 0)} KB</span>
            </li>
          ))}
          {!list.isLoading && (list.data?.length || 0) === 0 && (
            <li className="py-6 text-center text-sm text-subtext">No reports generated yet.</li>
          )}
        </ul>
      </Card>
    </PageWrapper>
  );
}
