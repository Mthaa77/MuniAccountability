import { AlertTriangle, CheckCircle2, Clock3, FileText, Gauge } from "lucide-react";
import { MunicipalityPreview, QueuePreview, RiskMap, Badge } from "@/components/ui";
import { AtlasEvidenceChip, AtlasHero, AtlasMetricTile, AtlasStatusPill } from "@/components/atlas/foundation";
import { ActionKanban, EvidenceDrawer, SourceHealthTabs } from "@/components/interactive";
import { actions, municipalities, queueItems } from "@/lib/pilot-data";

export default function CommandCentrePage() {
  const selectedMunicipality = municipalities[0];
  const criticalCount = queueItems.filter((item) => item.severity === "critical").length;
  const overdueCount = actions.filter((action) => action.status === "overdue").length;

  return (
    <>
      <AtlasHero
        kicker="Municipal accountability intelligence"
        title="Audit risk, recovery evidence and civic oversight"
        emphasis="in one command room."
        description="A premium AGSA-first workspace for turning municipal findings into source-backed intervention priorities, action workflows and review-ready briefings before live Treasury telemetry is unlocked."
        side={
          <>
            <AtlasEvidenceChip source="AGSA-backed corpus" />
            <AtlasEvidenceChip source="Treasury gate locked" state="pending" />
            <AtlasEvidenceChip source="Prototype persistence" state="locked" />
          </>
        }
      >
        <AtlasStatusPill>Source thread active</AtlasStatusPill>
        <AtlasStatusPill tone="gold">Validation gates visible</AtlasStatusPill>
        <AtlasStatusPill tone="risk">Decision queue open</AtlasStatusPill>
      </AtlasHero>

      <section className="metrics-grid" aria-label="Executive intelligence tiles">
        <AtlasMetricTile title="Attention cohort" value="4" note="One-province pilot municipalities in the oversight lens" tone="risk" icon={AlertTriangle} />
        <AtlasMetricTile title="Critical risks" value={String(criticalCount)} note="Highest-priority AGSA-backed intervention items" tone="risk" icon={Gauge} />
        <AtlasMetricTile title="Overdue actions" value={String(overdueCount)} note="Corrective actions requiring evidence movement" tone="gold" icon={Clock3} />
        <AtlasMetricTile title="Briefings in review" value="1" note="Executive narrative awaiting final source checks" tone="blue" icon={FileText} />
        <AtlasMetricTile title="Source coverage" value="95%" note="MVP target for audit-backed fields and citations" tone="good" icon={CheckCircle2} />
      </section>

      <section className="command-layout">
        <QueuePreview items={queueItems} />
        <RiskMap />
        <MunicipalityPreview municipality={selectedMunicipality} />
        <EvidenceDrawer item={queueItems[0]} />
      </section>

      <section className="main-grid">
        <section className="panel wide">
          <div className="panel-header">
            <div>
              <p className="eyeless">Finding to action engine</p>
              <h2>Action Board</h2>
            </div>
            <Badge tone="overdue">Evidence review risks</Badge>
          </div>
          <ActionKanban />
        </section>
        <SourceHealthTabs />
      </section>
    </>
  );
}
