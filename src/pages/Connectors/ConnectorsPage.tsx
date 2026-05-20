import { PageWrapper } from "@/components/layout/PageWrapper";
import { ConnectorForm } from "./ConnectorForm";

export function ConnectorsPage() {
  return (
    <PageWrapper
      title="Connectors"
      description="Configure Jira & ServiceNow integrations. Credentials are encrypted at rest and refreshed every sync cycle."
    >
      <div className="space-y-6">
        <ConnectorForm name="jira" />
        <ConnectorForm name="servicenow" />
      </div>
    </PageWrapper>
  );
}
