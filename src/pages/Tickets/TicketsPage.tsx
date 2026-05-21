import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { ticketApi } from "@/services/api/endpoints";
import { formatDate } from "@/utils/formatters";
import { useUiStore } from "@/store/slices/ui";
import type { Ticket } from "@/types";

interface NewTicketForm {
  system: "jira" | "servicenow";
  summary: string;
  description: string;
  priority: string;
}

export function TicketsPage() {
  const qc = useQueryClient();
  const pushToast = useUiStore((s) => s.pushToast);
  const [systemFilter, setSystemFilter] = useState<"" | "jira" | "servicenow">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [ticketPage, setTicketPage] = useState(1);
  const ticketPageSize = 15;

  const list = useQuery({
    queryKey: ["tickets", systemFilter],
    queryFn: () => ticketApi.list({ system: systemFilter || undefined, limit: 200 }),
    refetchInterval: 30_000,
  });

  const totalTicketPages = Math.ceil((list.data?.length || 0) / ticketPageSize);
  const paginatedTickets = useMemo(() => {
    const start = (ticketPage - 1) * ticketPageSize;
    return (list.data || []).slice(start, start + ticketPageSize);
  }, [list.data, ticketPage, ticketPageSize]);

  // Reset page on filter change
  useMemo(() => {
    setTicketPage(1);
  }, [systemFilter]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NewTicketForm>({
    defaultValues: { system: "jira", priority: "Medium", summary: "", description: "" },
  });

  const createMut = useMutation({
    mutationFn: (data: NewTicketForm) => ticketApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      pushToast({ title: "Ticket created", variant: "success" });
      setModalOpen(false);
      reset();
    },
    onError: (err: Error) => pushToast({ title: "Create failed", description: err.message, variant: "error" }),
  });

  const columns: Column<Ticket>[] = [
    {
      key: "ext",
      header: "Ticket",
      cell: (r) => (
        <a
          href={r.url || "#"}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          {r.external_id} <ExternalLink className="h-3 w-3" />
        </a>
      ),
    },
    {
      key: "system",
      header: "System",
      cell: (r) => (
        <Badge tone={r.system === "jira" ? "info" : "primary"} className="uppercase">
          {r.system}
        </Badge>
      ),
    },
    // { key: "summary", header: "Summary", cell: (r) => <span className="truncate">{r.summary}</span> },
    {
      key: "priority",
      header: "Priority",
      cell: (r) => <Badge tone="neutral">{r.priority || "—"}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <Badge tone="warning">{r.status}</Badge>,
    },
    { key: "created", header: "Created", cell: (r) => formatDate(r.created_at) },
    { key: "updated", header: "Updated", cell: (r) => formatDate(r.updated_at) },
  ];

  return (
    <PageWrapper
      title="Tickets"
      description="Synced from Jira & ServiceNow every 60s"
    // actions={
    //   <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
    //     Create ticket
    //   </Button>
    // }
    >
      <Card>
        <div className="mb-3 flex items-center gap-3">
          <label className="text-sm text-subtext">System:</label>
          <div className="flex gap-1">
            {(["", "jira", "servicenow"] as const).map((v) => (
              <Button
                key={v || "all"}
                size="sm"
                variant={systemFilter === v ? "primary" : "ghost"}
                onClick={() => setSystemFilter(v)}
              >
                {v ? v.toUpperCase() : "All"}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-0 border border-border rounded-xl overflow-hidden shadow-sm">
          <DataTable
            columns={columns}
            rows={paginatedTickets}
            rowKey={(r) => `${r.system}-${r.external_id}`}
            isLoading={list.isLoading}
            empty="No tickets yet. Configure a connector and trigger a sync."
          />
          <Pagination
            currentPage={ticketPage}
            totalPages={totalTicketPages}
            onPageChange={setTicketPage}
          />
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create new ticket"
        description="Pushes directly to the selected system using configured credentials."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              isLoading={createMut.isPending}
              onClick={handleSubmit((d) => createMut.mutate(d))}
            >
              Create
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text">System</label>
            <select
              {...register("system", { required: true })}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text"
            >
              <option value="jira">Jira</option>
              <option value="servicenow">ServiceNow</option>
            </select>
          </div>
          <Input
            label="Summary"
            placeholder="Short title"
            error={errors.summary?.message}
            {...register("summary", { required: "Summary is required" })}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text">Description</label>
            <textarea
              rows={5}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
              {...register("description", { required: true })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text">Priority</label>
            <select
              {...register("priority")}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
}
