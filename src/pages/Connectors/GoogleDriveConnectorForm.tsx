import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  RefreshCcw,
  ShieldAlert,
  Cable,
  Plug,
  HardDrive,
  FileText,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { gdriveApi } from "@/services/api/endpoints";
import { formatDate, formatRelative } from "@/utils/formatters";
import { useUiStore } from "@/store/slices/ui";
import type { GDriveFile, SyncLog } from "@/types";

interface FormValues {
  username: string;
  api_token: string;
  project_or_table: string;
  sync_interval: number;
  enabled: boolean;
}

/**
 * GoogleDriveConnectorForm
 *
 * Renders a configuration card for the Google Drive connector.
 * Auto-syncs every 60 seconds via APScheduler on the backend;
 * this component also polls the config every 20 s to reflect
 * the latest sync status.
 */
export function GoogleDriveConnectorForm() {
  const qc = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);
  const [showFiles, setShowFiles] = useState(false);

  // ── Remote data ──────────────────────────────────────────────────────────
  const cfg = useQuery({
    queryKey: ["gdrive-config"],
    queryFn: () => gdriveApi.getConfig(),
    refetchInterval: 20_000,
    retry: false,
  });

  const logs = useQuery({
    queryKey: ["gdrive-logs"],
    queryFn: () => gdriveApi.logs(10),
    refetchInterval: 20_000,
    retry: false,
  });

  const filesQuery = useQuery({
    queryKey: ["gdrive-files"],
    queryFn: () => gdriveApi.files(50),
    enabled: showFiles,
    refetchInterval: showFiles ? 60_000 : false,
  });

  // ── Form ─────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      username: "",
      api_token: "",
      project_or_table: "",
      sync_interval: 60,
      enabled: false,
    },
  });

  useEffect(() => {
    if (cfg.data) {
      reset({
        username: cfg.data.username || "",
        api_token: "",
        project_or_table: cfg.data.project_or_table || "",
        sync_interval: cfg.data.sync_interval || 60,
        enabled: cfg.data.enabled,
      });
    }
  }, [cfg.data, reset]);

  // ── Mutations ────────────────────────────────────────────────────────────
  const saveMut = useMutation({
    mutationFn: (v: FormValues) =>
      gdriveApi.saveConfig({
        username: v.username,
        api_token: v.api_token || undefined,
        project_or_table: v.project_or_table,
        sync_interval: v.sync_interval,
        enabled: v.enabled,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gdrive-config"] });
      pushToast({ title: "Google Drive saved", variant: "success" });
    },
    onError: (err: Error) =>
      pushToast({ title: "Save failed", description: err.message, variant: "error" }),
  });

  const testMut = useMutation({
    mutationFn: () => gdriveApi.test(),
    onSuccess: (r) =>
      pushToast({
        title: r.ok ? "Google Drive: connection OK" : "Google Drive: connection failed",
        description: r.ok ? `Signed in as ${r.display_name ?? r.email ?? "unknown"}` : r.error,
        variant: r.ok ? "success" : "error",
      }),
    onError: (err: Error) =>
      pushToast({ title: "Connection test failed", description: err.message, variant: "error" }),
  });

  const syncMut = useMutation({
    mutationFn: () => gdriveApi.sync(),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["gdrive-config"] });
      qc.invalidateQueries({ queryKey: ["gdrive-logs"] });
      qc.invalidateQueries({ queryKey: ["gdrive-files"] });
      pushToast({
        title: "Google Drive: synced",
        description: `${r.fetched} file(s) fetched, ${r.upserted} new`,
        variant: "success",
      });
    },
    onError: (err: Error) =>
      pushToast({ title: "Sync failed", description: err.message, variant: "error" }),
  });

  // ── Table columns ────────────────────────────────────────────────────────
  const logCols: Column<SyncLog>[] = [
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <Badge tone={r.status === "ok" ? "success" : "danger"} className="uppercase">
          {r.status}
        </Badge>
      ),
    },
    { key: "items", header: "Files", cell: (r) => r.items_pulled, align: "right" },
    { key: "started", header: "Started", cell: (r) => formatDate(r.started_at) },
    { key: "finished", header: "Finished", cell: (r) => formatRelative(r.finished_at) },
    {
      key: "msg",
      header: "Message",
      cell: (r) => <span className="text-xs">{r.message || "—"}</span>,
    },
  ];

  const fileCols: Column<GDriveFile>[] = [
    {
      key: "name",
      header: "Name",
      cell: (r) => (
        <span className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 shrink-0 text-text/40" />
          <span className="truncate max-w-[200px]" title={r.name}>
            {r.name}
          </span>
        </span>
      ),
    },
    {
      key: "mime_type",
      header: "Type",
      cell: (r) => (
        <span className="text-xs text-text/60 truncate max-w-[140px]" title={r.mime_type}>
          {r.mime_type.replace("application/vnd.google-apps.", "").replace("application/", "")}
        </span>
      ),
    },
    {
      key: "size",
      header: "Size",
      cell: (r) =>
        r.size ? `${Math.round(parseInt(r.size, 10) / 1024)} KB` : "—",
      align: "right",
    },
    {
      key: "modified",
      header: "Modified",
      cell: (r) => (r.modified_time ? formatRelative(r.modified_time) : "—"),
    },
    {
      key: "link",
      header: "",
      cell: (r) =>
        r.web_view_link ? (
          <a
            href={r.web_view_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 text-xs text-primary hover:underline"
          >
            Open <ExternalLink className="h-3 w-3" />
          </a>
        ) : null,
    },
  ];

  // ── Status badge ─────────────────────────────────────────────────────────
  const statusBadge = cfg.data?.configured ? (
    <div className="flex items-center gap-2">
      <Badge tone={cfg.data.enabled ? "success" : "neutral"}>
        {cfg.data.enabled ? "Enabled" : "Disabled"}
      </Badge>
      {cfg.data.last_status === "success" && (
        <Badge tone="success">
          <CheckCircle2 className="mr-1 inline h-3 w-3" />
          {cfg.data.last_sync_at ? formatRelative(cfg.data.last_sync_at) : "synced"}
        </Badge>
      )}
      {cfg.data.last_status === "failed" && (
        <Badge tone="danger">
          <ShieldAlert className="mr-1 inline h-3 w-3" />
          error
        </Badge>
      )}
      {cfg.data.enabled && (
        <Badge tone="neutral" className="gap-1">
          <Clock className="h-3 w-3" />
          auto-sync 60s
        </Badge>
      )}
    </div>
  ) : null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Card
      title="Google Drive"
      description="Files are listed from the configured folder and cached locally. Auto-sync runs every 60 seconds when enabled."
      action={statusBadge}
    >
      <form className="space-y-4" onSubmit={handleSubmit((v) => saveMut.mutate(v))}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Service-account email or OAuth client ID */}
          <Input
            label="Service Account Email (optional)"
            placeholder="my-sa@project.iam.gserviceaccount.com"
            hint="Leave blank for personal OAuth2 tokens."
            {...register("username")}
          />

          {/* Access token or service-account JSON key */}
          <Input
            label="Access Token / Service-Account JSON Key"
            type="password"
            placeholder={
              cfg.data?.has_secret
                ? "•••••••• (leave blank to keep existing)"
                : "Paste OAuth2 token or service-account JSON"
            }
            hint={
              cfg.data?.has_secret
                ? "Already set. Submit blank to keep current."
                : "Stored encrypted at rest."
            }
            {...register("api_token")}
          />

          {/* Folder ID */}
          <Input
            label='Folder ID (or "root")'
            placeholder="root"
            hint='The Google Drive folder ID to sync. Use "root" for My Drive.'
            error={errors.project_or_table?.message}
            {...register("project_or_table", { required: "Required" })}
          />

          {/* Sync interval */}
          <Input
            label="Sync interval (seconds)"
            type="number"
            min={15}
            error={errors.sync_interval?.message}
            {...register("sync_interval", {
              valueAsNumber: true,
              required: true,
              min: 15,
            })}
          />

          {/* Enable toggle */}
          <label className="flex items-center gap-2 self-end mt-6">
            <input
              type="checkbox"
              {...register("enabled")}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm text-text">Enable automatic sync</span>
          </label>
        </div>

        {cfg.data?.last_error && (
          <div className="rounded-lg border border-danger/40 bg-danger/10 p-2 text-xs text-danger">
            Last error: {cfg.data.last_error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            isLoading={saveMut.isPending}
            leftIcon={<Cable className="h-4 w-4" />}
          >
            Save
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => testMut.mutate()}
            isLoading={testMut.isPending}
            leftIcon={<Plug className="h-4 w-4" />}
          >
            Test connection
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => syncMut.mutate()}
            isLoading={syncMut.isPending}
            leftIcon={<RefreshCcw className="h-4 w-4" />}
          >
            Manual sync now
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowFiles((p) => !p)}
            leftIcon={<HardDrive className="h-4 w-4" />}
          >
            {showFiles ? "Hide" : "Browse"} synced files
          </Button>
        </div>
      </form>

      {/* ── Sync logs ─────────────────────────────────────────────────────── */}
      <div className="mt-6">
        <h4 className="mb-2 text-sm font-semibold text-text">Recent sync runs</h4>
        <DataTable
          columns={logCols}
          rows={logs.data || []}
          rowKey={(r) => r.id}
          isLoading={logs.isLoading}
        />
      </div>

      {/* ── Synced files browser ──────────────────────────────────────────── */}
      {showFiles && (
        <div className="mt-6">
          <h4 className="mb-2 text-sm font-semibold text-text">
            Synced files
            {filesQuery.data ? (
              <span className="ml-2 font-normal text-text/50">
                ({filesQuery.data.length} cached)
              </span>
            ) : null}
          </h4>
          <DataTable
            columns={fileCols}
            rows={filesQuery.data || []}
            rowKey={(r) => r.id}
            isLoading={filesQuery.isLoading}
          />
        </div>
      )}
    </Card>
  );
}
