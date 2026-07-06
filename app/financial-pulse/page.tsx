import { FinancialValidationPanel } from "@/components/interactive";
import { Badge, PageHeader } from "@/components/ui";

export default function FinancialPulsePage() {
  return (
    <>
      <PageHeader
        kicker="Financial Pulse"
        title="Treasury telemetry is intentionally gated."
        description="This page shows the Phase 2 validation model and disabled financial monitors without implying live Municipal Money integration."
        actions={<Badge tone="under_review">Pending validation</Badge>}
      />
      <section className="main-grid">
        <FinancialValidationPanel />
        <section className="panel">
          <p className="eyeless">Disabled monitors</p>
          <h2>Reserved for Phase 2</h2>
          <div className="compact-list">
            {["Cash runway", "Grant drawdown", "Capital delivery", "Revenue collection", "Creditor pressure"].map((item) => (
              <article key={item}>
                <div>
                  <strong>{item}</strong>
                  <span>Requires source health, formula version and freshness object.</span>
                </div>
                <Badge tone="under_review">pending</Badge>
              </article>
            ))}
          </div>
        </section>
      </section>
    </>
  );
}
