import { AdminConsole, SourceHealthTabs } from "@/components/interactive";
import { Badge, PageHeader } from "@/components/ui";
import { agsaReadinessSummary } from "@/lib/agsa-readiness-ledger";
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
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <p className="eyeless">AGSA integration readiness</p>
            <h2>Ten-slice completion ledger</h2>
          </div>
          <Badge tone={agsaReadinessSummary.productionReady ? "healthy" : "watch"}>
            {agsaReadinessSummary.complete}/{agsaReadinessSummary.total} complete
          </Badge>
        </div>
        <p className="lead">
          Remaining ready-for-input slices require official source files, hosted infrastructure or validation evidence before they can honestly move to complete.
        </p>
        <div className="breakdown-list">
          {agsaReadinessSummary.ledger.map((slice) => (
            <article key={slice.id}>
              <div>
                <strong>{slice.title}</strong>
                <span>{slice.status.replaceAll("_", " ")}</span>
              </div>
              <p>{slice.remainingDependency ?? slice.evidence.join(" / ")}</p>
            </article>
          ))}
        </div>
      </section>
      <SourceHealthTabs />
    </>
  );
}
