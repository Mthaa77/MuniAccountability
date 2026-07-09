import { AdminConsole, SourceHealthTabs } from "@/components/interactive";
import { Badge, PageHeader } from "@/components/ui";
import { agsaReadinessSummary } from "@/lib/agsa-readiness-ledger";
import { buildProductionEvidencePack } from "@/lib/production-evidence";
import Link from "next/link";

export default function AdminPage() {
  const productionEvidencePack = buildProductionEvidencePack();

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
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <p className="eyeless">Production evidence intake</p>
            <h2>Remaining unlock gates</h2>
          </div>
          <Badge tone={productionEvidencePack.productionReady ? "healthy" : "pending_validation"}>
            {productionEvidencePack.productionReady ? "ready" : "evidence required"}
          </Badge>
        </div>
        <p className="lead">
          These gates are deliberately read-only until official files, validation proof or hosted infrastructure evidence is supplied.
        </p>
        <div className="breakdown-list">
          {productionEvidencePack.intakeRequirements.map((requirement) => (
            <article key={requirement.gateId}>
              <div>
                <strong>{requirement.title}</strong>
                <span>{requirement.status.replaceAll("_", " ")}</span>
              </div>
              <p>{requirement.requiredEvidence[0]}</p>
              <small>{requirement.promotionGuardrail}</small>
            </article>
          ))}
        </div>
        <Link className="primary-link" href="/v1/production-evidence">
          Open production evidence API
        </Link>
      </section>
      <SourceHealthTabs />
    </>
  );
}
