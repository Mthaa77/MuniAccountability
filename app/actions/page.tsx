import { ActionKanban } from "@/components/interactive";
import { Badge, PageHeader } from "@/components/ui";
import { evidenceChecklist } from "@/lib/pilot-data";

export default function ActionsPage() {
  return (
    <>
      <PageHeader
        kicker="Finding to action engine"
        title="Own, evidence and review corrective work."
        description="Track actions from assignment through evidence submission, review, escalation and closure with residual-risk rationale."
        actions={<Badge tone="overdue">Evidence risk</Badge>}
      />
      <section className="main-grid">
        <section className="panel wide">
          <ActionKanban />
        </section>
        <section className="panel">
          <p className="eyeless">Reviewer checklist</p>
          <h2>Evidence acceptance</h2>
          <div className="check-list">
            {evidenceChecklist.map((item) => <span key={item}>{item}</span>)}
          </div>
        </section>
      </section>
    </>
  );
}
