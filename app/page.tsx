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
        kicker="Daily oversight view"
        title="See what needs attention, why it matters and what proof supports it"
        emphasis="before decisions are made."
        description="Use this workspace to review municipal risks, open the source evidence, assign follow-up actions and prepare briefings that are easy to understand and safe to share. Treasury financial numbers stay locked until they are verified."
        side={
          <div className="command-posture">
            <div className="command-posture-heading">
              <span>Command posture</span>
              <strong>Evidence review</strong>
            </div>
            <p>Start with the critical queue, verify the source trail, then assign the next accountable action.</p>
            <div className="command-posture-list">
              <AtlasEvidenceChip source="Audit evidence loaded" />
              <AtlasEvidenceChip source="Treasury numbers locked" state="pending" />
              <AtlasEvidenceChip source="Prototype storage" state="locked" />
            </div>
          </div>
        }
      >
        <AtlasStatusPill>Evidence first</AtlasStatusPill>
        <AtlasStatusPill tone="gold">Review before publishing</AtlasStatusPill>
        <AtlasStatusPill tone="risk">Priority queue open</AtlasStatusPill>
      </AtlasHero>

      <section className="metrics-grid" aria-label="Executive intelligence tiles">
        <AtlasMetricTile title="Municipalities watched" value="4" note="Pilot municipalities currently in the oversight workspace" tone="risk" icon={AlertTriangle} />
        <AtlasMetricTile title="Critical risks" value={String(criticalCount)} note="Items that need the fastest review and next action" tone="risk" icon={Gauge} />
        <AtlasMetricTile title="Overdue actions" value={String(overdueCount)} note="Follow-ups that need evidence, escalation or closure" tone="gold" icon={Clock3} />
        <AtlasMetricTile title="Briefings in review" value="1" note="Decision pack waiting for final source checks" tone="blue" icon={FileText} />
        <AtlasMetricTile title="Source coverage" value="95%" note="MVP target for fields that should have citations" tone="good" icon={CheckCircle2} />
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
              <p className="eyeless">Follow-up work</p>
              <h2>Action Board</h2>
            </div>
            <Badge tone="overdue">Needs evidence review</Badge>
          </div>
          <ActionKanban />
        </section>
        <SourceHealthTabs />
      </section>
    </>
  );
}
