import { AlertTriangle, CheckCircle2, Clock3, FileCheck2 } from "lucide-react";
import { ActionKanban } from "@/components/interactive";
import { Badge } from "@/components/ui";
import { AtlasEvidenceChip, AtlasHero, AtlasMetricTile, AtlasStatusPill } from "@/components/atlas/foundation";
import { actions, evidenceChecklist } from "@/lib/pilot-data";

export default function ActionsPage() {
  const overdueActions = actions.filter((action) => action.status === "overdue").length;
  const underReviewActions = actions.filter((action) => action.status === "under_review").length;
  const approvedActions = actions.filter((action) => action.status === "approved").length;

  return (
    <div className="atlas-workflow-console">
      <AtlasHero
        kicker="Finding to action engine"
        title="Own, evidence and review corrective work"
        emphasis="without losing the source thread."
        description="A workflow board for moving AGSA-backed findings through assignment, evidence capture, reviewer decisioning, escalation and closure with residual-risk context."
        side={
          <>
            <AtlasEvidenceChip source="Draft lifecycle local store" state="pending" />
            <AtlasEvidenceChip source="Evidence attachment required" state="locked" />
            <AtlasEvidenceChip source="Reviewer sign-off visible" />
          </>
        }
      >
        <AtlasStatusPill>Action lifecycle</AtlasStatusPill>
        <AtlasStatusPill tone="gold">Evidence acceptance</AtlasStatusPill>
        <AtlasStatusPill tone={overdueActions ? "risk" : "default"}>{overdueActions} overdue</AtlasStatusPill>
      </AtlasHero>

      <section className="atlas-workflow-metrics" aria-label="Action board summary">
        <AtlasMetricTile title="Actions" value={String(actions.length)} note="Corrective workflow items seeded from AGSA recommendations" icon={FileCheck2} />
        <AtlasMetricTile title="Overdue" value={String(overdueActions)} note="Items requiring escalation or evidence movement" tone={overdueActions ? "risk" : "good"} icon={AlertTriangle} />
        <AtlasMetricTile title="Under review" value={String(underReviewActions)} note="Actions waiting for reviewer decision or source checks" tone="gold" icon={Clock3} />
        <AtlasMetricTile title="Approved" value={String(approvedActions)} note="Actions accepted for closure or next-stage reporting" tone="good" icon={CheckCircle2} />
      </section>

      <section className="workflow-principle-grid">
        <article className="workflow-principle-card">
          <span>01</span>
          <h2>Evidence before movement</h2>
          <p>No action should advance without an attached evidence reference, owner context and source-aware reviewer decision.</p>
        </article>
        <article className="workflow-principle-card">
          <span>02</span>
          <h2>Reviewer-controlled closure</h2>
          <p>Closure must preserve residual-risk notes and keep the original AGSA finding traceable.</p>
        </article>
        <article className="workflow-principle-card">
          <span>03</span>
          <h2>Public boundary</h2>
          <p>Internal action comments stay out of MuniCheck while public audit context remains plain-language and source-backed.</p>
        </article>
      </section>

      <section className="atlas-workflow-grid">
        <section className="workflow-command-card">
          <div className="municheck-section-header">
            <div>
              <p className="eyeless">Action board</p>
              <h2>Corrective workflow lanes</h2>
            </div>
            <Badge tone="overdue">Evidence risk</Badge>
          </div>
          <ActionKanban />
        </section>
        <section className="workflow-checklist-card">
          <div className="municheck-section-header">
            <div>
              <p className="eyeless">Reviewer checklist</p>
              <h2>Evidence acceptance</h2>
            </div>
            <Badge tone="under_review">review</Badge>
          </div>
          <p>Use this checklist before an action is marked ready for executive briefing or closure.</p>
          <div className="municheck-method-list">
            {evidenceChecklist.map((item) => <span key={item}>{item}</span>)}
          </div>
        </section>
      </section>
    </div>
  );
}
