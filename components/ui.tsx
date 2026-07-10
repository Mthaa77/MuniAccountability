import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { RiskAtlas } from "@/components/risk-atlas";
import { municipalities } from "@/lib/pilot-data";
import type { ActionStatus, Municipality, QueueItem, Severity } from "@/lib/types";

export const severityLabel: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  watch: "Watch",
  resolved: "Resolved"
};

export const actionLabel: Record<ActionStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  evidence_submitted: "Evidence added",
  under_review: "Being reviewed",
  approved: "Approved",
  rejected: "Needs changes",
  overdue: "Overdue",
  escalated: "Escalated",
  closed_with_residual_risk: "Closed with risk note"
};

export function tone(value: string) {
  if (["critical", "overdue", "blocked", "degraded", "off_track", "risk"].includes(value)) return "risk";
  if (["high", "under_review", "decision_required", "unknown", "pending_validation", "watch", "review"].includes(value)) return "watch";
  if (["healthy", "approved", "resolved", "on_track", "good"].includes(value)) return "good";
  return "neutral";
}

export function Badge({ children, tone: toneValue }: { children: React.ReactNode; tone: string }) {
  return <span className={`badge tone-${tone(toneValue)}`}>{children}</span>;
}

export function PageHeader({
  kicker,
  title,
  description,
  actions
}: {
  kicker: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="page-header">
      <div>
        <p className="eyeless">{kicker}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </section>
  );
}

export function MetricCard({
  title,
  value,
  note,
  tone: toneValue,
  icon: Icon
}: {
  title: string;
  value: string;
  note: string;
  tone: "risk" | "watch" | "good" | "neutral";
  icon: LucideIcon;
}) {
  return (
    <section className={`metric-card tone-${toneValue}`}>
      <div className="metric-icon">
        <Icon size={20} />
      </div>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </section>
  );
}

export function RiskMap() {
  return (
    <section className="panel map-panel">
      <div className="panel-header">
        <div>
          <p className="eyeless">Risk map</p>
          <h2>Where attention is needed</h2>
        </div>
        <Badge tone="under_review">Audit-backed view</Badge>
      </div>
      <p className="panel-intro">Click a municipality to open the full case file. Larger markers mean a higher intervention priority score.</p>
      <RiskAtlas municipalities={municipalities} />
      <div className="map-list">
        {municipalities.map((municipality) => (
          <Link href={`/municipalities/${municipality.id}`} key={municipality.id}>
            <span>{municipality.commonName}</span>
            <Badge tone={municipality.interventionPriority}>{severityLabel[municipality.interventionPriority]}</Badge>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function MunicipalityPreview({ municipality }: { municipality: Municipality }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyeless">Case file</p>
          <h2>{municipality.commonName}</h2>
        </div>
        <Badge tone={municipality.interventionPriority}>{severityLabel[municipality.interventionPriority]}</Badge>
      </div>
      <p className="lead">{municipality.situationSummary}</p>
      <div className="case-meta">
        <span>{municipality.auditOutcome}</span>
        <span>{municipality.householdImpact}</span>
        <span>{municipality.posture}</span>
      </div>
      <div className="ipi-block">
        <div>
          <span>Priority score</span>
          <strong>{municipality.ipi}</strong>
        </div>
        <div className="ipi-bar" aria-label={`Priority score ${municipality.ipi} out of 100`}>
          <span style={{ width: `${municipality.ipi}%` }} />
        </div>
      </div>
      <Link className="primary-link" href={`/municipalities/${municipality.id}`}>
        Open case file
      </Link>
    </section>
  );
}

export function QueuePreview({ items }: { items: QueueItem[] }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyeless">Needs a decision</p>
          <h2>Priority Queue</h2>
        </div>
        <Link className="text-action" href="/intervention-queue">
          View all
        </Link>
      </div>
      <p className="panel-intro">These are the highest-ranked issues that need review, action or escalation.</p>
      <div className="compact-list">
        {items.slice(0, 4).map((item) => {
          const municipality = municipalities.find((candidate) => candidate.id === item.municipalityId);
          return (
            <article key={item.id}>
              <div>
                <strong>#{item.rank} {municipality?.commonName}</strong>
                <span>{item.title}</span>
              </div>
              <Badge tone={item.severity}>{severityLabel[item.severity]}</Badge>
            </article>
          );
        })}
      </div>
    </section>
  );
}
