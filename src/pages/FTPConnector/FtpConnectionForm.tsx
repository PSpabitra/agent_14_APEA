import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Wifi, WifiOff, RefreshCcw, Plug, Unplug, Trash2,
  Server, CheckCircle2, AlertCircle, Info, Lock, Settings2,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ftpApi } from "@/services/api/endpoints";
import { formatRelative, formatDate } from "@/utils/formatters";
import { useUiStore } from "@/store/slices/ui";
import { cn } from "@/utils/cn";

interface Props { configName: string; onDelete?: () => void; }

interface FormValues {
  ftp_host:        string;
  ftp_port:        number;
  ftp_user:        string;
  ftp_password:    string;
  ftp_folder:      string;
  sync_interval:   number;
  use_tls:         boolean;
  passive_mode:    boolean;
  connect_timeout: number;
  enabled:         boolean;
}

// ── Step-result row shown inside the Test Results panel ──────────────────────
function StepRow({ step }: { step: { check: string; ok: boolean; detail: string } }) {
  return (
    <div className={cn(
      "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs",
      step.ok
        ? "bg-success/5 border-success/25 text-text"
        : "bg-danger/5  border-danger/25  text-text",
    )}>
      {step.ok
        ? <CheckCircle2 className="h-3.5 w-3.5 text-success mt-0.5 shrink-0" />
        : <AlertCircle  className="h-3.5 w-3.5 text-danger  mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <span className="font-semibold uppercase tracking-wide text-subtext mr-1.5">
          {step.check.replace(/_/g, " ")}
        </span>
        <span className="break-words">{step.detail}</span>
      </div>
    </div>
  );
}

// ── Fix checklist shown when connection is refused ───────────────────────────
function RefusedHelp({ port }: { port: number }) {
  const tips = [
    "Open FileZilla Server on the Windows machine — confirm it shows \"FileZilla Server started\".",
    `In FileZilla Server go to Edit → Settings → General and confirm it is listening on port ${port}.`,
    `Add an Inbound Rule in Windows Defender Firewall → Advanced Settings for TCP port ${port}.`,
    "If this backend runs inside Docker or Linux, use the Windows machine's LAN IP (e.g. 192.168.x.x) — not localhost.",
    "If you are behind a router, add port forwarding for the FTP port to the Windows machine.",
    "Try enabling \"Use FTPS (TLS)\" below if your FileZilla Server requires encrypted connections.",
    "Try toggling Passive Mode — FileZilla Server: Edit → Settings → Passive mode settings.",
  ];
  return (
    <div className="mt-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 space-y-1.5">
      <p className="text-xs font-semibold text-warning mb-2">
        How to fix WinError 10061 / connection refused:
      </p>
      {tips.map((tip, i) => (
        <div key={i} className="flex gap-2 text-xs text-text">
          <span className="text-warning font-bold shrink-0">{i + 1}.</span>
          <span>{tip}</span>
        </div>
      ))}
    </div>
  );
}

export function FtpConnectionForm({ configName, onDelete }: Props) {
  const qc       = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [testResult,   setTestResult]   = useState<{
    ok: boolean; detail: string; steps?: { check: string; ok: boolean; detail: string }[];
  } | null>(null);

  // ── Remote config query ───────────────────────────────────────────────────
  const cfg = useQuery({
    queryKey: ["ftp-config", configName],
    queryFn:  () => ftpApi.getConfig(configName),
    refetchInterval: 15_000,
  });

  const status = useQuery({
    queryKey:        ["ftp-status", configName],
    queryFn:         () => ftpApi.status(configName),
    refetchInterval: 10_000,
    enabled:         !!cfg.data?.configured,
  });

  // ── Form ──────────────────────────────────────────────────────────────────
  const {
    register, handleSubmit, reset, watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    defaultValues: {
      ftp_host: "", ftp_port: 21, ftp_user: "", ftp_password: "",
      ftp_folder: "/", sync_interval: 60,
      use_tls: false, passive_mode: true, connect_timeout: 30,
      enabled: false,
    },
  });

  const useTls = watch("use_tls");

  useEffect(() => {
    if (cfg.data?.configured) {
      reset({
        ftp_host:        cfg.data.ftp_host        || "",
        ftp_port:        cfg.data.ftp_port        || 21,
        ftp_user:        cfg.data.ftp_user        || "",
        ftp_password:    "",
        ftp_folder:      cfg.data.ftp_folder      || "/",
        sync_interval:   cfg.data.sync_interval   || 60,
        use_tls:         !!cfg.data.use_tls,
        passive_mode:    cfg.data.passive_mode !== false,
        connect_timeout: cfg.data.connect_timeout || 30,
        enabled:         cfg.data.enabled         ?? false,
      }, { keepDirty: false });
    }
  }, [cfg.data, reset]);

  const errMsg = (e: unknown) =>
    e instanceof Error ? e.message : String(e);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const saveMut = useMutation({
    mutationFn: (v: FormValues) => ftpApi.saveConfig(configName, v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ftp-config", configName] });
      setTestResult(null);
      pushToast({ title: `FTP "${configName}" saved`, variant: "success" });
    },
    onError: (e) =>
      pushToast({ title: "Save failed", description: errMsg(e), variant: "error" }),
  });

  const testMut = useMutation({
    mutationFn: () => ftpApi.test(configName),
    onSuccess: (r) => {
      setTestResult(r);
      pushToast({
        title:       r.ok ? "Connection test passed" : "Connection test failed",
        description: r.detail,
        variant:     r.ok ? "success" : "error",
      });
    },
    onError: (e) =>
      pushToast({ title: "Test failed", description: errMsg(e), variant: "error" }),
  });

  const connectMut = useMutation({
    mutationFn: () => ftpApi.connect(configName),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["ftp-status", configName] });
      qc.invalidateQueries({ queryKey: ["ftp-config",  configName] });
      pushToast({
        title:       r.ok ? "Connected" : "Connection failed",
        description: r.detail,
        variant:     r.ok ? "success" : "error",
      });
    },
    onError: (e) =>
      pushToast({ title: "Connect failed", description: errMsg(e), variant: "error" }),
  });

  const disconnMut = useMutation({
    mutationFn: () => ftpApi.disconnect(configName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ftp-status", configName] });
      qc.invalidateQueries({ queryKey: ["ftp-config",  configName] });
      pushToast({ title: "Disconnected", variant: "success" });
    },
    onError: (e) =>
      pushToast({ title: "Disconnect failed", description: errMsg(e), variant: "error" }),
  });

  const syncMut = useMutation({
    mutationFn: () => ftpApi.sync(configName),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["ftp-config",   configName] });
      qc.invalidateQueries({ queryKey: ["ftp-sync-logs"] });
      qc.invalidateQueries({ queryKey: ["ftp-analyses"] });
      pushToast({
        title:       "Sync complete",
        description: `${r.files_fetched} file(s), ${r.rows_inserted} row(s) inserted`,
        variant:     "success",
      });
    },
    onError: (e) =>
      pushToast({ title: "Sync failed", description: errMsg(e), variant: "error" }),
  });

  const deleteMut = useMutation({
    mutationFn: () => ftpApi.deleteConfig(configName),
    onSuccess: () => {
      pushToast({ title: `Deleted "${configName}"`, variant: "success" });
      onDelete?.();
    },
    onError: (e) =>
      pushToast({ title: "Delete failed", description: errMsg(e), variant: "error" }),
  });

  // ── Derived ───────────────────────────────────────────────────────────────
  const isSaved     = !!cfg.data?.configured;
  const isConnected = status.data?.connected ?? false;
  const hasUnsaved  = isDirty;
  const canAct      = isSaved && !hasUnsaved;   // Test / Connect require saved + no pending changes

  const testFailed = testResult && !testResult.ok;
  const currentPort = cfg.data?.ftp_port ?? 21;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <Server className="h-4 w-4" />
          FTP Connection
          <code className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-subtext">
            {configName}
          </code>
        </span>
      }
      description="Credentials are encrypted at rest. Connection stays alive and auto-syncs every 60 s."
      action={
        <div className="flex items-center gap-2 flex-wrap">
          {isSaved && (
            isConnected
              ? (
                <Badge tone="success" className="flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  Live
                </Badge>
              ) : (
                <Badge tone="neutral" className="flex items-center gap-1">
                  <WifiOff className="h-3 w-3" /> Offline
                </Badge>
              )
          )}
          {cfg.data?.last_sync_at && cfg.data.last_status === "success" && (
            <Badge tone="success">
              <CheckCircle2 className="mr-1 inline h-3 w-3" />
              {formatRelative(cfg.data.last_sync_at)}
            </Badge>
          )}
          {cfg.data?.last_status === "failed" && (
            <Badge tone="danger">
              <AlertCircle className="mr-1 inline h-3 w-3" /> sync error
            </Badge>
          )}
          {hasUnsaved && <Badge tone="warning">unsaved changes</Badge>}
          {onDelete && (
            <Button size="sm" variant="ghost" className="text-danger hover:text-danger"
              isLoading={deleteMut.isPending} onClick={() => deleteMut.mutate()}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      }
    >
      {/* ── Banners ── */}
      {!isSaved && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-info/40 bg-info/10 px-3 py-2.5 text-xs text-info">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            Fill in your FTP credentials and click <strong>Save</strong> first.
            Test and Connect will unlock after saving.
          </span>
        </div>
      )}
      {isSaved && hasUnsaved && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2.5 text-xs text-warning">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>You have unsaved changes — save before connecting.</span>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit((v) => saveMut.mutate(v))}>

        {/* ── Core credentials ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="FTP Host"
            placeholder="192.168.1.100 or ftp.server.com"
            hint="Windows machine LAN IP — not localhost"
            error={errors.ftp_host?.message}
            {...register("ftp_host", { required: "Host required" })}
          />
          <Input
            label="Port"
            type="number"
            placeholder="21"
            hint={useTls ? "FTPS explicit usually uses 21" : "Plain FTP default is 21"}
            error={errors.ftp_port?.message}
            {...register("ftp_port", { valueAsNumber: true, required: true, min: 1, max: 65535 })}
          />
          <Input
            label="Username"
            placeholder="ftpuser"
            error={errors.ftp_user?.message}
            {...register("ftp_user", { required: "Username required" })}
          />
          <Input
            label="Password"
            type="password"
            placeholder={cfg.data?.ftp_password_masked || "Enter FTP password"}
            hint={isSaved ? "Leave blank to keep existing password" : "Stored encrypted at rest"}
            {...register("ftp_password")}
          />
          <Input
            label="Remote Folder"
            placeholder="/ or /uploads/telemetry"
            hint="Folder on the server to watch for CSV/JSON files"
            {...register("ftp_folder")}
          />
          <Input
            label="Sync interval (seconds)"
            type="number"
            min={10}
            error={errors.sync_interval?.message}
            {...register("sync_interval", { valueAsNumber: true, required: true, min: 10 })}
          />
        </div>

        {/* ── Advanced settings toggle ── */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(o => !o)}
            className="flex items-center gap-1.5 text-xs font-medium text-subtext hover:text-text transition-colors"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Advanced connection settings
            {showAdvanced
              ? <ChevronUp   className="h-3.5 w-3.5" />
              : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showAdvanced && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 rounded-lg border border-border bg-muted/30 p-4">
              {/* FTPS toggle */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none col-span-full md:col-span-1">
                <input type="checkbox" {...register("use_tls")}
                  className="h-4 w-4 mt-0.5 rounded border-border" />
                <div>
                  <p className="text-sm font-medium text-text flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    Use FTPS (TLS)
                  </p>
                  <p className="text-xs text-subtext mt-0.5">
                    Explicit AUTH TLS on the control channel.
                    Enable if FileZilla requires TLS.
                  </p>
                </div>
              </label>

              {/* Passive mode toggle */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input type="checkbox" {...register("passive_mode")}
                  className="h-4 w-4 mt-0.5 rounded border-border" />
                <div>
                  <p className="text-sm font-medium text-text">Passive Mode (PASV)</p>
                  <p className="text-xs text-subtext mt-0.5">
                    Recommended when the backend is behind NAT/Docker.
                    Disable only if the server requires active mode.
                  </p>
                </div>
              </label>

              {/* Connect timeout */}
              <Input
                label="Connect timeout (seconds)"
                type="number"
                min={5}
                max={120}
                hint="Increase if the server is slow to respond"
                {...register("connect_timeout", { valueAsNumber: true, min: 5, max: 120 })}
              />
            </div>
          )}
        </div>

        {/* ── Enable toggle ── */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" {...register("enabled")}
            className="h-4 w-4 rounded border-border" />
          <span className="text-sm text-text">
            Enable auto-sync (keeps connection alive and syncs every interval)
          </span>
        </label>

        {cfg.data?.last_error && (
          <div className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-xs text-danger">
            <strong>Last sync error:</strong> {cfg.data.last_error}
          </div>
        )}

        {/* ── Action buttons ── */}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" isLoading={saveMut.isPending}
            leftIcon={<Server className="h-4 w-4" />}>
            Save
          </Button>

          <Button
            type="button" variant="secondary" isLoading={testMut.isPending}
            leftIcon={<Plug className="h-4 w-4" />}
            onClick={() => testMut.mutate()}
            disabled={!canAct}
            title={!isSaved ? "Save credentials first" : hasUnsaved ? "Save changes first" : "Run connection test"}>
            Test connection
          </Button>

          {isConnected ? (
            <Button
              type="button" variant="secondary" isLoading={disconnMut.isPending}
              leftIcon={<Unplug className="h-4 w-4" />}
              onClick={() => disconnMut.mutate()}
              className="text-danger border-danger/40 hover:bg-danger/10">
              Disconnect
            </Button>
          ) : (
            <Button
              type="button" variant="secondary" isLoading={connectMut.isPending}
              leftIcon={<Wifi className="h-4 w-4" />}
              onClick={() => connectMut.mutate()}
              disabled={!canAct}
              title={!isSaved ? "Save credentials first" : hasUnsaved ? "Save changes first" : ""}>
              Connect
            </Button>
          )}

          <Button
            type="button" variant="ghost" isLoading={syncMut.isPending}
            leftIcon={<RefreshCcw className="h-4 w-4" />}
            onClick={() => syncMut.mutate()}
            disabled={!isConnected}
            title={!isConnected ? "Connect first" : "Sync now"}>
            Sync now
          </Button>
        </div>
      </form>

      {/* ── Test result panel ── */}
      {testResult && (
        <div className="mt-5 rounded-lg border border-border overflow-hidden">
          <div className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-semibold",
            testResult.ok
              ? "bg-success/10 text-success border-b border-success/20"
              : "bg-danger/10  text-danger  border-b border-danger/20",
          )}>
            {testResult.ok
              ? <CheckCircle2 className="h-4 w-4" />
              : <AlertCircle  className="h-4 w-4" />}
            {testResult.ok ? "Connection test passed" : "Connection test failed"}
            <span className="ml-auto text-xs font-normal opacity-75">
              {testResult.detail}
            </span>
          </div>

          {/* Step-by-step results */}
          {testResult.steps && testResult.steps.length > 0 && (
            <div className="p-4 space-y-2">
              <p className="text-xs font-semibold text-subtext uppercase tracking-wide mb-2">
                Diagnostic steps
              </p>
              {testResult.steps.map((s, i) => (
                <StepRow key={i} step={s} />
              ))}
            </div>
          )}

          {/* Fix guide when refused */}
          {testFailed && (
            <div className="px-4 pb-4">
              <RefusedHelp port={currentPort} />
            </div>
          )}
        </div>
      )}

      {/* ── Status strip ── */}
      {isSaved && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 rounded-lg bg-muted/40 p-3 text-xs">
          <div>
            <p className="text-subtext mb-0.5">Host</p>
            <p className="font-mono text-text truncate">
              {cfg.data?.ftp_host || "—"}:{cfg.data?.ftp_port || 21}
            </p>
          </div>
          <div>
            <p className="text-subtext mb-0.5">Connection</p>
            <p className={isConnected ? "text-success font-medium" : "text-subtext"}>
              {isConnected ? "● Connected" : "○ Disconnected"}
            </p>
          </div>
          <div>
            <p className="text-subtext mb-0.5">Last sync</p>
            <p className="text-text">
              {cfg.data?.last_sync_at ? formatDate(cfg.data.last_sync_at) : "Never"}
            </p>
          </div>
          <div>
            <p className="text-subtext mb-0.5">Mode</p>
            <p className="text-text">
              {cfg.data?.use_tls ? "FTPS" : "FTP"} ·{" "}
              {cfg.data?.passive_mode !== false ? "Passive" : "Active"}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
