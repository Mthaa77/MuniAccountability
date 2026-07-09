import { AlertTriangle, ClipboardCheck, FileText, Gauge } from "lucide-react";
import { QueueWorkspace } from "@/components/interactive";
import { AtlasEvidenceChip, AtlasHero, AtlasMetricTile, AtlasStatusPill } from "@/components/atlas/foundation";
import { actions, queueItems } from "@/lib/pilot-data";

export default function InterventionQueuePage() {
  const criticalCount = queueItems.filter((item) => item.severity === "critical").length;
  const highCount = queueItems.filter((item) => item.severity === "high").length;
  const overdueActions = actions.filter((action) => action.status === "overdue").length;

  return (
    <div className="atlas-page-stack">
      <AtlasHero
        kicker="Priority cockpit"
        title="Ranked intervention queue for audit-backed recovery"
        emphasis="decisions."
        description="A refined worklist for triaging municipality risks, opening source trails, assigning owners, creating draft actions and moving only evidence-backed items into executive briefings."
        side={
          <>
            <AtlasEvidenceChip source="AGSA-ranked risks" />
            <AtlasEvidenceChip source="Draft actions local store" state="pending" />
            <AtlasEvidenceChip source="Reviewer sign-off required" state="locked" />
          </>
        }
      >
        <AtlasStatusPill>Executive view</AtlasStatusPill>
        <AtlasStatusPill tone="gold">Analyst filters</AtlasStatusPill>
        <AtlasStatusPill tone="risk">Evidence drawer</AtlasStatusPill>
      </AtlasHero>

      <section className="atlas-queue-brief" aria-label="Queue intelligence summary">
        <AtlasMetricTile title="Ranked items" value={String(queueItems.length)} note="Source-backed intervention signals in the current worklist" icon={Gauge} />
        <AtlasMetricTile title="Critical" value={String(criticalCount)} note="Items requiring immediate institutional attention" tone="risk" icon={AlertTriangle} />
        <AtlasMetricTile title="High priority" value={String(highCount)} note="Material risks that should be assigned into workflow" tone="gold" icon={ClipboardCheck} />
        <AtlasMetricTile title="Overdue actions" value={String(overdueActions)} note="Action board items with evidence movement risk" tone="blue" icon={FileText} />
      </section>

      <QueueWorkspace />
    </div>
  );
}
