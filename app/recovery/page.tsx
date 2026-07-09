import { RecoveryMilestoneList } from "@/components/interactive";
import { RecoveryCommandCharts } from "@/components/advanced-charts";
import { Badge, PageHeader } from "@/components/ui";
import { recoveryMilestones } from "@/lib/pilot-data";

export default function RecoveryPage() {
  return (
    <>
      <PageHeader
        kicker="Recovery War Room"
        title="Run the weekly recovery rhythm."
        description="Milestones, blockers, evidence requirements and next decisions stay visible without claiming recovery before formal sign-off."
        actions={<Badge tone="watch">Controlled narrative</Badge>}
      />
      <RecoveryCommandCharts milestones={recoveryMilestones} />
      <section className="main-grid">
        <section className="panel wide">
          <RecoveryMilestoneList milestones={recoveryMilestones} />
        </section>
        <section className="panel">
          <p className="eyeless">Weekly agenda</p>
          <h2>Next war-room review</h2>
          <div className="agenda-list">
            <span>Risks that worsened</span>
            <span>Milestones overdue</span>
            <span>Decisions needed</span>
            <span>Evidence due before next meeting</span>
          </div>
        </section>
      </section>
    </>
  );
}
