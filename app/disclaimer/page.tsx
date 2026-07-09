import Link from "next/link";
import { Badge, PageHeader } from "@/components/ui";
import { annexureValidation, treasuryValidation } from "@/lib/source-validation";
import { workflowPersistence } from "@/lib/workflow-persistence";

export default function DisclaimerPage() {
  return (
    <>
      <PageHeader
        kicker="Prototype notice"
        title="What this platform can and cannot claim yet."
        description="MuniAccountability Command is an AGSA-backed prototype workspace. It separates source-backed statements, review-required mappings, gated Treasury telemetry and production unlock evidence."
        actions={<Badge tone="watch">demo mode</Badge>}
      />

      <section className="main-grid">
        <section className="panel wide">
          <div className="panel-header">
            <div>
              <p className="eyeless">Public trust boundary</p>
              <h2>Data-use statement</h2>
            </div>
            <Badge tone="under_review">review required</Badge>
          </div>
          <p className="lead">
            This release uses structured AGSA report extracts, page citations and review overlays. It is designed to support oversight workflows, not to publish legal findings, corruption findings or final institutional conclusions.
          </p>
          <div className="check-list">
            <span>Risk scores are prioritisation aids, not legal determinations.</span>
            <span>Treasury and Municipal Money telemetry remains locked until validation gates pass.</span>
            <span>Exact municipality-level audit outcomes require official annexure mapping where marked unresolved.</span>
            <span>Public MuniCheck profiles must not expose internal workflow notes or restricted evidence.</span>
            <span>Every publishable statement should be tied to a source reference and review state.</span>
          </div>
        </section>

        <section className="panel">
          <p className="eyeless">Annexure gate</p>
          <h2>MFMA exact mapping</h2>
          <p className="lead">{annexureValidation.summary}</p>
          <div className="case-meta">
            <span>{annexureValidation.status}</span>
            <span>{annexureValidation.unresolvedCount} unresolved mapping(s)</span>
          </div>
        </section>

        <section className="panel">
          <p className="eyeless">Financial Pulse gate</p>
          <h2>Treasury validation</h2>
          <p className="lead">{treasuryValidation.summary}</p>
          <div className="case-meta">
            <span>{treasuryValidation.status}</span>
            <span>{treasuryValidation.sourceStatus}</span>
          </div>
        </section>

        <section className="panel wide">
          <div className="panel-header">
            <div>
              <p className="eyeless">Workflow durability</p>
              <h2>Current persistence boundary</h2>
            </div>
            <Badge tone={workflowPersistence.productionReady ? "healthy" : "watch"}>
              {workflowPersistence.activeProvider}
            </Badge>
          </div>
          <p className="lead">
            The active workflow store remains local JSON until a hosted database provider, migrations, backfill and parity smoke tests are supplied.
          </p>
          <Link className="primary-link" href="/admin">
            Open admin readiness ledger
          </Link>
        </section>
      </section>
    </>
  );
}
