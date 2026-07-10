import { CalendarClock, CheckCircle2, Flag, ShieldAlert } from "lucide-react";
import { RecoveryMilestoneList } from "@/components/interactive";
import { RecoveryCommandCharts } from "@/components/advanced-charts";
import { Badge } from "@/components/ui";
import { AtlasEvidenceChip, AtlasHero, AtlasMetricTile, AtlasStatusPill } from "@/components/atlas/foundation";
import { recoveryMilestones } from "@/lib/pilot-data";

export default function RecoveryPage() {
  const overdue = recoveryMilestones.filter((milestone) => milestone.status === "overdue" || milestone.status === "off_track").length;
  const onTrack = recoveryMilestones.filter((milestone) => milestone.status === "on_track" || milestone.status === "approved").length;

  return (
    <div className="atlas-page-stack">
      <AtlasHero
        kicker="Recovery War Room"
        title="Run the weekly recovery rhythm"
        emphasis="with evidence discipline."
        description="Milestones, blockers, evidence requirements and next decisions stay visible without claiming recovery before formal sign-off."
        side={
          <>
            <AtlasEvidenceChip source="Controlled narrative" state="pending" />
            <AtlasEvidenceChip source="Milestone evidence required" state="locked" />
            <AtlasEvidenceChip source="Weekly review cadence" />
          </>
        }
      >
        <AtlasStatusPill>Recovery rhythm</AtlasStatusPill>
        <AtlasStatusPill tone="gold">Decision agenda</AtlasStatusPill>
        <AtlasStatusPill tone={overdue ? "risk" : "default"}>{overdue} overdue</AtlasStatusPill>
      </AtlasHero>

      <section className="atlas-queue-brief" aria-label="Recovery summary">
        <AtlasMetricTile title="Milestones" value={String(recoveryMilestones.length)} note="Recovery milestones tracked in the war room" icon={Flag} />
        <AtlasMetricTile title="Overdue" value={String(overdue)} note="Milestones requiring escalation or fresh evidence" tone={overdue ? "risk" : "good"} icon={ShieldAlert} />
        <AtlasMetricTile title="On track" value={String(onTrack)} note="Milestones progressing with current evidence" tone="good" icon={CheckCircle2} />
        <AtlasMetricTile title="Agenda" value="Weekly" note="Structured recovery review rhythm" tone="blue" icon={CalendarClock} />
      </section>

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
    </div>
  );
}
