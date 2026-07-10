import { AlertTriangle, CheckCircle2, Clock3, FileCheck2 } from "lucide-react";
import { ActionKanban } from "@/components/interactive";
import { Badge } from "@/components/ui";
import { ActionStudio } from "@/components/atlas/action-studio";
import { EvidenceAttachmentDrawer } from "@/components/atlas/evidence-attachment-drawer";
import { AtlasEvidenceChip, AtlasHero, AtlasMetricTile, AtlasStatusPill } from "@/components/atlas/foundation";
import { actions, evidenceChecklist } from "@/lib/pilot-data";

export default function ActionsPage() {
  const overdueActions = actions.filter((action) => action.status === "overdue").length;
  const underReviewActions = actions.filter((action) => action.status === "under_review").length;
  const approvedActions = actions.filter((action) => action.status === "approved").length;

  return (
    <div className="atlas-workflow-console">
      <AtlasHero
        kicker="Action Board"
        title="Turn audit findings into clear follow-up work"
        emphasis="with evidence at every step."
        description="Use this board to see who owns each action, what evidence is needed, what is overdue and what is ready for review. Nothing should be closed until the proof is attached and checked."
        side={
          <>
            <AtlasEvidenceChip source="Owners visible" state="pending" />
            <AtlasEvidenceChip source="Evidence required" state="locked" />
            <AtlasEvidenceChip source="Reviewer sign-off shown" />
          </>
        }
      >
        <AtlasStatusPill>Track work</AtlasStatusPill>
        <AtlasStatusPill tone="gold">Check proof</AtlasStatusPill>
        <AtlasStatusPill tone={overdueActions ? "risk" : "default"}>{overdueActions} overdue</AtlasStatusPill>
      </AtlasHero>

      <section className="atlas-workflow-metrics" aria-label="Action board summary">
        <AtlasMetricTile title="Total actions" value={String(actions.length)} note="Follow-up items created from audit findings" icon={FileCheck2} />
        <AtlasMetricTile title="Overdue" value={String(overdueActions)} note="Items that need attention now" tone={overdueActions ? "risk" : "good"} icon={AlertTriangle} />
        <AtlasMetricTile title="Under review" value={String(underReviewActions)} note="Actions waiting for a reviewer decision" tone="gold" icon={Clock3} />
        <AtlasMetricTile title="Approved" value={String(approvedActions)} note="Actions accepted for the next report or closure step" tone="good" icon={CheckCircle2} />
      </section>

      <ActionStudio />
      <EvidenceAttachmentDrawer />

      <section className="workflow-principle-grid">
        <article className="workflow-principle-card">
          <span>01</span>
          <h2>Attach proof first</h2>
          <p>Do not move an action forward unless the supporting evidence is linked and easy to review.</p>
        </article>
        <article className="workflow-principle-card">
          <span>02</span>
          <h2>Let reviewers close the loop</h2>
          <p>A reviewer should confirm the evidence, note any remaining risk and then approve closure.</p>
        </article>
        <article className="workflow-principle-card">
          <span>03</span>
          <h2>Keep public pages safe</h2>
          <p>Internal action notes stay private. Public pages should only show reviewed, source-backed context.</p>
        </article>
      </section>

      <section className="atlas-workflow-grid">
        <section className="workflow-command-card">
          <div className="municheck-section-header">
            <div>
              <p className="eyeless">Work lanes</p>
              <h2>Move actions from open to reviewed</h2>
            </div>
            <Badge tone="overdue">Needs proof</Badge>
          </div>
          <ActionKanban />
        </section>
        <section className="workflow-checklist-card">
          <div className="municheck-section-header">
            <div>
              <p className="eyeless">Review checklist</p>
              <h2>Before an action is accepted</h2>
            </div>
            <Badge tone="under_review">review</Badge>
          </div>
          <p>Use this checklist before an action is included in an executive briefing or marked ready for closure.</p>
          <div className="municheck-method-list">
            {evidenceChecklist.map((item) => <span key={item}>{item}</span>)}
          </div>
        </section>
      </section>
    </div>
  );
}
