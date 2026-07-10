import { AlertTriangle, BarChart3, LockKeyhole, ShieldCheck } from "lucide-react";
import { FinancialValidationPanel } from "@/components/interactive";
import { Badge } from "@/components/ui";
import { AtlasEvidenceChip, AtlasHero, AtlasMetricTile, AtlasStatusPill } from "@/components/atlas/foundation";

const disabledMonitors = ["Cash runway", "Grant drawdown", "Capital delivery", "Revenue collection", "Creditor pressure"];

export default function FinancialPulsePage() {
  return (
    <div className="atlas-page-stack">
      <AtlasHero
        kicker="Financial Pulse"
        title="Treasury telemetry is intentionally gated"
        emphasis="until proof lands."
        description="This page shows the Phase 2 validation model and disabled financial monitors without implying live Municipal Money integration."
        side={
          <>
            <AtlasEvidenceChip source="Connector validation pending" state="locked" />
            <AtlasEvidenceChip source="Formula versions required" state="pending" />
            <AtlasEvidenceChip source="No live Treasury claim" state="locked" />
          </>
        }
      >
        <AtlasStatusPill tone="risk">Pending validation</AtlasStatusPill>
        <AtlasStatusPill tone="gold">Formula gate</AtlasStatusPill>
        <AtlasStatusPill>Source health model</AtlasStatusPill>
      </AtlasHero>

      <section className="atlas-queue-brief" aria-label="Financial Pulse validation summary">
        <AtlasMetricTile title="Monitors" value={String(disabledMonitors.length)} note="Financial monitors reserved for Phase 2" tone="blue" icon={BarChart3} />
        <AtlasMetricTile title="Live values" value="0" note="No live Municipal Money values shown in MVP" tone="risk" icon={LockKeyhole} />
        <AtlasMetricTile title="Required gates" value="4" note="Connector, schema, formula and freshness checks" tone="gold" icon={AlertTriangle} />
        <AtlasMetricTile title="Guardrail" value="On" note="Financial claims remain locked until validation passes" tone="good" icon={ShieldCheck} />
      </section>

      <section className="main-grid">
        <FinancialValidationPanel />
        <section className="panel">
          <p className="eyeless">Disabled monitors</p>
          <h2>Reserved for Phase 2</h2>
          <div className="compact-list">
            {disabledMonitors.map((item) => (
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
    </div>
  );
}
