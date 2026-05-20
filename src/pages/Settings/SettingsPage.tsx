import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { auditApi, authApi } from "@/services/api/endpoints";
import { formatDate } from "@/utils/formatters";
import { useAuth } from "@/context/AuthContext";
import { useUiStore } from "@/store/slices/ui";
import type { AuditEntry } from "@/types";

interface NewUserForm {
  full_name: string;
  email: string;
  password: string;
  role: "admin" | "engineer" | "viewer";
}

export function SettingsPage() {
  const { user } = useAuth();
  const pushToast = useUiStore((s) => s.pushToast);
  const isAdmin = user?.role === "admin";
  const [showCreate, setShowCreate] = useState(false);

  const audit = useQuery({
    queryKey: ["audit"],
    queryFn: () => auditApi.list(100),
    enabled: isAdmin,
    refetchInterval: 60_000,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NewUserForm>({
    defaultValues: { role: "engineer" },
  });

  const createMut = useMutation({
    mutationFn: (data: NewUserForm) => authApi.register(data),
    onSuccess: () => {
      pushToast({ title: "User created", variant: "success" });
      reset();
      setShowCreate(false);
    },
    onError: (err: Error) => pushToast({ title: "Create failed", description: err.message, variant: "error" }),
  });

  const auditCols: Column<AuditEntry>[] = [
    { key: "when", header: "When", cell: (r) => formatDate(r.created_at) },
    { key: "user", header: "User", cell: (r) => r.user_email || "—" },
    { key: "action", header: "Action", cell: (r) => <Badge>{r.action}</Badge> },
    { key: "entity", header: "Entity", cell: (r) => `${r.entity}${r.entity_id ? `:${r.entity_id}` : ""}` },
    { key: "ip", header: "IP", cell: (r) => <span className="font-mono text-xs">{r.ip || "—"}</span> },
  ];

  return (
    <PageWrapper title="Settings" description="Account, users, and audit log">
      <Card title="Your account">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-subtext">Name</p>
            <p className="font-medium text-text">{user?.full_name}</p>
          </div>
          <div>
            <p className="text-xs text-subtext">Email</p>
            <p className="font-medium text-text">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-subtext">Role</p>
            <Badge tone="primary" className="capitalize">
              {user?.role}
            </Badge>
          </div>
        </div>
      </Card>

      {isAdmin && (
        <Card
          title="User management"
          description="Create or revoke users. Use sparingly — production should use SSO."
          action={
            <Button leftIcon={<UserPlus className="h-4 w-4" />} onClick={() => setShowCreate((v) => !v)}>
              {showCreate ? "Hide form" : "New user"}
            </Button>
          }
        >
          {showCreate && (
            <form
              onSubmit={handleSubmit((d) => createMut.mutate(d))}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <Input
                label="Full name"
                {...register("full_name", { required: "Required" })}
                error={errors.full_name?.message}
              />
              <Input
                label="Email"
                type="email"
                {...register("email", { required: "Required" })}
                error={errors.email?.message}
              />
              <Input
                label="Password"
                type="password"
                {...register("password", { required: "Required", minLength: { value: 8, message: "Min 8 chars" } })}
                error={errors.password?.message}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text">Role</label>
                <select
                  {...register("role")}
                  className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text"
                >
                  <option value="viewer">Viewer</option>
                  <option value="engineer">Engineer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" isLoading={createMut.isPending}>
                  Create user
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {isAdmin && (
        <Card title="Audit log" description="Last 100 actions">
          <DataTable
            columns={auditCols}
            rows={audit.data || []}
            rowKey={(r) => r.id}
            isLoading={audit.isLoading}
            empty="No audit entries yet."
          />
        </Card>
      )}
    </PageWrapper>
  );
}
