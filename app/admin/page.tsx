import { AdminConsole, SourceHealthTabs } from "@/components/interactive";
import { Badge, PageHeader } from "@/components/ui";
import Link from "next/link";

export default function AdminPage() {
  return (
    <>
      <PageHeader
        kicker="Tenant administration"
        title="Publication controls, quality exceptions and audit logs."
        description="Admin surfaces are institutional-only and should never leak restricted workflow data into public MuniCheck views."
        actions={<Badge tone="watch">tenant scoped</Badge>}
      />
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <p className="eyeless">Human-in-the-loop control</p>
            <h2>AGSA extraction review</h2>
          </div>
          <Link className="primary-action" href="/admin/agsa-review">
            Open review queue
          </Link>
        </div>
        <p className="lead">Inspect low-confidence pages, citation mapping and publication decisions before using extracted records in public or institutional outputs.</p>
        <Link className="primary-link" href="/admin/data-quality">Open data quality dashboard</Link>
      </section>
      <AdminConsole />
      <SourceHealthTabs />
    </>
  );
}
