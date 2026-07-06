import { AlertTriangle, CheckCircle2, Clock3, FileText, Gauge } from "lucide-react";
import { MunicipalityPreview, PageHeader, QueuePreview, RiskMap, MetricCard, Badge } from "@/components/ui";
import { ActionKanban, EvidenceDrawer, SourceHealthTabs } from "@/components/interactive";
import { actions, municipalities, queueItems } from "@/lib/pilot-data";

export default function CommandCentrePage() {
  const selectedMunicipality = municipalities[0];
  const criticalCount = queueItems.filter((item) => item.severity === "critical").length;
  const overdueCount = actions.filter((action) => action.status === "overdue").length;

  return (
    <>
      <PageHeader
        kicker="Municipal Oversight, Intervention and Recovery Operating System"
        title="Find the risk. Assign the action. Prove the recovery."
        description="Phase 1 is AGSA-first: evidence-backed case files, intervention queue, actions, decision logs and cited briefings before live Treasury telemetry is enabled."
        actions={
          <>
            <Badge tone="healthy">AGSA verified</Badge>
            <Badge tone="under_review">Treasury pending validation</Badge>
            <Badge tone="decision_required">Decision required</Badge>
          </>
        }
      />

      <section className="metrics-grid" aria-label="Executive decision cards">
        <MetricCard title="Municipalities requiring attention" value="4" note="One-province pilot cohort" tone="risk" icon={AlertTriangle} />
        <MetricCard title="New critical risks" value={String(criticalCount)} note="Since latest AGSA review" tone="risk" icon={Gauge} />
        <MetricCard title="Overdue corrective actions" value={String(overdueCount)} note="Evidence not accepted" tone="watch" icon={Clock3} />
        <MetricCard title="Briefings in review" value="1" note="Weekly intervention brief" tone="neutral" icon={FileText} />
        <MetricCard title="Published source coverage" value="95%" note="MVP target for audit fields" tone="good" icon={CheckCircle2} />
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
