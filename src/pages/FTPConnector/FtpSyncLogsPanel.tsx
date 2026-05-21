import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { ftpApi, type FtpSyncLog } from "@/services/api/endpoints";
import { formatDate, formatRelative } from "@/utils/formatters";

const STATUS_TONE: Record<string,"success"|"warning"|"danger"> = { success:"success", partial:"warning", failed:"danger" };

export function FtpSyncLogsPanel() {
  const logs = useQuery({ queryKey: ["ftp-sync-logs"], queryFn: () => ftpApi.syncLogs(undefined, 30), refetchInterval: 20_000 });

  const cols: Column<FtpSyncLog>[] = [
    { key:"status", header:"Status", cell:(r) => <Badge tone={STATUS_TONE[r.status]||"neutral"} className="uppercase">{r.status}</Badge> },
    { key:"config", header:"Connection", cell:(r) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{r.config_name}</code> },
    { key:"files",  header:"Files",  cell:(r) => r.files_fetched, align:"right" },
    { key:"rows",   header:"Rows",   cell:(r) => r.rows_inserted, align:"right" },
    { key:"started",  header:"Started",  cell:(r) => formatDate(r.started_at) },
    { key:"finished", header:"Finished", cell:(r) => r.finished_at ? formatRelative(r.finished_at) : "—" },
    { key:"error", header:"Error", cell:(r) => r.error ? <span className="text-xs text-danger truncate max-w-xs block" title={r.error}>{r.error}</span> : <span className="text-subtext">—</span> },
  ];

  return (
    <Card
      title={<span className="flex items-center gap-2"><History className="h-4 w-4" />Sync History</span>}
      description="Every scheduled and manual sync run. Refreshes every 20 s."
    >
      <DataTable columns={cols} rows={logs.data || []} rowKey={(r) => r.id} isLoading={logs.isLoading} />
    </Card>
  );
}
