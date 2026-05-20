import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, RefreshCcw, ShieldAlert, Cable, Plug } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { connectorApi } from "@/services/api/endpoints";
import { formatDate, formatRelative } from "@/utils/formatters";
import { useUiStore } from "@/store/slices/ui";
import type { ConnectorName, SyncLog } from "@/types";

interface ConnectorFormProps {
  name: ConnectorName;
}

interface FormValues {
  base_url: string;
  username: string;
  secret: string;
  project_or_table: string;
  sync_interval_seconds: number;
  enabled: boolean;
}

const META: Record<ConnectorName, { title: string; description: string; secretLabel: string; projectLabel: string; placeholderUrl: string }> = {
  jira: {
    title: "Jira Cloud",
    description: "REST API v3. Issues are pulled every minute into the local store.",
    secretLabel: "API Token",
    projectLabel: "Project key (e.g. PROD)",
    placeholderUrl: "https://your-tenant.atlassian.net",
  },
  servicenow: {
    title: "ServiceNow",
    description: "Table API. Incidents are pulled every minute into the local store.",
    secretLabel: "Password",
    projectLabel: "Table name (e.g. incident)",
    placeholderUrl: "https://your-instance.service-now.com",
  },
};

export function ConnectorForm({ name }: ConnectorFormProps) {
  const meta = META[name];
  const qc = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);

  const cfg = useQuery({
    queryKey: ["connector", name],
    queryFn: () => connectorApi.get(name),
    refetchInterval: 20_000,
  });
  const logs = useQuery({
    queryKey: ["connector-logs", name],
    queryFn: () => connectorApi.logs(name, 10),
    refetchInterval: 20_000,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      base_url: "",
      username: "",
      secret: "",
      project_or_table: "",
      sync_interval_seconds: 60,
      enabled: false,
    },
  });

  useEffect(() => {
    if (cfg.data) {
      reset({
        base_url: cfg.data.base_url || "",
        username: cfg.data.username || "",
        secret: "",
        project_or_table: cfg.data.project_or_table || "",
        sync_interval_seconds: cfg.data.sync_interval_seconds || 60,
        enabled: cfg.data.enabled,
      });
    }
  }, [cfg.data, reset]);

  const saveMut = useMutation({
    mutationFn: (v: FormValues) => connectorApi.update(name, v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connector", name] });
      pushToast({ title: `${meta.title} saved`, variant: "success" });
    },
    onError: (err: Error) => pushToast({ title: "Save failed", description: err.message, variant: "error" }),
  });

  const testMut = useMutation({
    mutationFn: () => connectorApi.test(name),
    onSuccess: (r) =>
      pushToast({
        title: r.ok ? `${meta.title}: connection OK` : `${meta.title}: failed`,
        description: r.detail,
        variant: r.ok ? "success" : "error",
      }),
    onError: (err: Error) =>
      pushToast({ title: `${meta.title}: connection failed`, description: err.message, variant: "error" }),
  });

  const syncMut = useMutation({
    mutationFn: () => connectorApi.sync(name),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["connector", name] });
      qc.invalidateQueries({ queryKey: ["connector-logs", name] });
      pushToast({
        title: `${meta.title}: synced`,
        description: `${r.items_pulled} item(s) pulled`,
        variant: "success",
      });
    },
    onError: (err: Error) => pushToast({ title: `Sync failed`, description: err.message, variant: "error" }),
  });

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
    { key: "items", header: "Items", cell: (r) => r.items_pulled, align: "right" },
    { key: "started", header: "Started", cell: (r) => formatDate(r.started_at) },
    { key: "finished", header: "Finished", cell: (r) => formatRelative(r.finished_at) },
    { key: "msg", header: "Message", cell: (r) => <span className="text-xs">{r.message || "—"}</span> },
  ];

  return (
    <Card
      title={meta.title}
      description={meta.description}
      action={
        cfg.data ? (
          <div className="flex items-center gap-2">
            <Badge tone={cfg.data.enabled ? "success" : "neutral"}>{cfg.data.enabled ? "Enabled" : "Disabled"}</Badge>
            {cfg.data.last_status === "ok" && (
              <Badge tone="success">
                <CheckCircle2 className="mr-1 inline h-3 w-3" />
                {formatRelative(cfg.data.last_sync_at)}
              </Badge>
            )}
            {cfg.data.last_status === "error" && (
              <Badge tone="danger">
                <ShieldAlert className="mr-1 inline h-3 w-3" />
                error
              </Badge>
            )}
          </div>
        ) : null
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit((v) => saveMut.mutate(v))}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Base URL"
            placeholder={meta.placeholderUrl}
            error={errors.base_url?.message}
            {...register("base_url", { required: "Required" })}
          />
          <Input
            label="Username / Email"
            placeholder="service-account@company.com"
            error={errors.username?.message}
            {...register("username", { required: "Required" })}
          />
          <Input
            label={meta.secretLabel}
            type="password"
            placeholder={cfg.data?.has_secret ? "•••••••• (leave blank to keep existing)" : "Paste token/password"}
            hint={cfg.data?.has_secret ? "Already set. Submit blank to keep current." : "Stored encrypted at rest."}
            {...register("secret")}
          />
          <Input
            label={meta.projectLabel}
            error={errors.project_or_table?.message}
            {...register("project_or_table", { required: "Required" })}
          />
          <Input
            label="Sync interval (seconds)"
            type="number"
            min={15}
            error={errors.sync_interval_seconds?.message}
            {...register("sync_interval_seconds", { valueAsNumber: true, required: true, min: 15 })}
          />
          <label className="flex items-center gap-2 self-end mt-6">
            <input type="checkbox" {...register("enabled")} className="h-4 w-4 rounded border-border" />
            <span className="text-sm text-text">Enable automatic sync</span>
          </label>
        </div>

        {cfg.data?.last_error && (
          <div className="rounded-lg border border-danger/40 bg-danger/10 p-2 text-xs text-danger">
            Last error: {cfg.data.last_error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" isLoading={saveMut.isPending} leftIcon={<Cable className="h-4 w-4" />}>
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
        </div>
      </form>

      <div className="mt-6">
        <h4 className="mb-2 text-sm font-semibold text-text">Recent sync runs</h4>
        <DataTable columns={logCols} rows={logs.data || []} rowKey={(r) => r.id} isLoading={logs.isLoading} />
      </div>
    </Card>
  );
}
