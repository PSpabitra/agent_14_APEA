import { useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { FtpConnectionForm } from "./FtpConnectionForm";
import { FtpAnalysisPanel } from "./FtpAnalysisPanel";
import { FtpSyncLogsPanel } from "./FtpSyncLogsPanel";
import { Button } from "@/components/ui/Button";
import { Plus, Server } from "lucide-react";

export function FTPConnectorPage() {
  const [connections, setConnections] = useState<string[]>(["default"]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    const name = newName.trim().toLowerCase().replace(/\s+/g, "_");
    if (name && !connections.includes(name)) setConnections((p) => [...p, name]);
    setNewName(""); setAdding(false);
  };

  return (
    <PageWrapper
      title="FTP Connector"
      description="Connect to FileZilla FTP server, auto-sync telemetry every 60 seconds, and get Mistral AI root cause analysis on anomalies."
    >
      <div className="space-y-8">
        {connections.map((name) => (
          <FtpConnectionForm
            key={name}
            configName={name}
            onDelete={
              connections.length > 1
                ? () => setConnections((p) => p.filter((c) => c !== name))
                : undefined
            }
          />
        ))}

        {adding ? (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4">
            <Server className="h-4 w-4 text-subtext shrink-0" />
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Connection name (e.g. plant_b)"
              className="flex-1 bg-transparent text-sm outline-none text-text placeholder-subtext"
            />
            <Button size="sm" onClick={handleAdd} disabled={!newName.trim()}>Add</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        ) : (
          <Button variant="ghost" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>
            Add another FTP connection
          </Button>
        )}

        <FtpAnalysisPanel />
        <FtpSyncLogsPanel />
      </div>
    </PageWrapper>
  );
}
