import { AdminConsole, SourceHealthTabs } from "@/components/interactive";
import { Badge, PageHeader } from "@/components/ui";

export default function AdminPage() {
  return (
    <>
      <PageHeader
        kicker="Tenant administration"
        title="Publication controls, quality exceptions and audit logs."
        description="Admin surfaces are institutional-only and should never leak restricted workflow data into public MuniCheck views."
        actions={<Badge tone="watch">tenant scoped</Badge>}
      />
      <AdminConsole />
      <SourceHealthTabs />
    </>
  );
}
