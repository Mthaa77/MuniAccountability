"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui";

type RecoveryMilestone = typeof import("@/lib/pilot-data").recoveryMilestones[number];

const statusTone: Record<string, string> = {
  on_track: "good",
  pending_validation: "watch",
  blocked: "risk",
  off_track: "risk",
  review: "watch",
  passed: "good",
  failed: "risk",
  missing: "watch"
};

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function RecoveryCommandCharts({ milestones }: { milestones: RecoveryMilestone[] }) {
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const milestone of milestones) {
      counts.set(milestone.status, (counts.get(milestone.status) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([status, count]) => ({ status, count, share: percent(count, milestones.length) }));
  }, [milestones]);
  const filtered = activeStatus === "all" ? milestones : milestones.filter((milestone) => milestone.status === activeStatus);
  const completeCount = milestones.filter((milestone) => milestone.status === "on_track").length;
  const circumference = 2 * Math.PI * 44;
  const completion = percent(completeCount, milestones.length);

  return (
    <section className="advanced-chart-grid">
      <article className="chart-card chart-card-radial">
        <div className="chart-card-header">
          <div>
            <p className="eyeless">Recovery control</p>
            <h2>Milestone readiness</h2>
          </div>
          <Badge tone={completion > 50 ? "healthy" : "under_review"}>{completion}% ready</Badge>
        </div>
        <div className="radial-stage" aria-label={`Recovery readiness ${completion}%`}>
          <svg viewBox="0 0 120 120" role="img">
            <circle className="radial-track" cx="60" cy="60" r="44" />
            <circle
              className="radial-value"
              cx="60"
              cy="60"
              r="44"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (completion / 100) * circumference}
            />
          </svg>
          <div>
            <strong>{completion}%</strong>
            <span>{completeCount}/{milestones.length} on track</span>
          </div>
        </div>
      </article>

      <article className="chart-card">
        <div className="chart-card-header">
          <div>
            <p className="eyeless">Status mix</p>
            <h2>Recovery stack</h2>
          </div>
          <button className="mini-chart-action" onClick={() => setActiveStatus("all")}>Reset</button>
        </div>
        <div className="bar-3d-chart">
          {statusCounts.map((item) => (
            <button
              className={activeStatus === item.status ? "bar-3d active" : "bar-3d"}
              key={item.status}
              onClick={() => setActiveStatus(item.status)}
              style={{ "--bar-height": `${Math.max(22, item.share)}%` } as CSSProperties}
            >
              <span />
              <strong>{item.count}</strong>
              <em>{item.status.replaceAll("_", " ")}</em>
            </button>
          ))}
        </div>
      </article>

      <article className="chart-card chart-card-wide">
        <div className="chart-card-header">
          <div>
            <p className="eyeless">Interactive timeline</p>
            <h2>{activeStatus === "all" ? "All recovery milestones" : activeStatus.replaceAll("_", " ")}</h2>
          </div>
          <Badge tone={statusTone[activeStatus] ?? "neutral"}>{filtered.length} visible</Badge>
        </div>
        <div className="timeline-rail">
          {filtered.map((milestone, index) => (
            <article key={milestone.id}>
              <span className={`rail-dot tone-${statusTone[milestone.status] ?? "neutral"}`} />
              <div>
                <strong>{milestone.title}</strong>
                <span>{milestone.owner} / due {milestone.dueDate}</span>
              </div>
              <em>{String(index + 1).padStart(2, "0")}</em>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

export function ValidationGateMatrix({
  gates,
  formulaReady,
  formulaTotal
}: {
  gates: Array<{ id: string; label: string; status: string; evidence: string }>;
  formulaReady: number;
  formulaTotal: number;
}) {
  const [activeGateId, setActiveGateId] = useState(gates[0]?.id ?? "");
  const activeGate = gates.find((gate) => gate.id === activeGateId) ?? gates[0];
  const readiness = percent(formulaReady, formulaTotal);

  return (
    <section className="validation-matrix">
      <article className="chart-card">
        <div className="chart-card-header">
          <div>
            <p className="eyeless">Gate matrix</p>
            <h2>Validation pressure</h2>
          </div>
          <Badge tone={readiness === 100 ? "healthy" : "under_review"}>{readiness}% formulas</Badge>
        </div>
        <div className="matrix-grid">
          {gates.map((gate) => (
            <button
              className={activeGate?.id === gate.id ? "matrix-cell active" : "matrix-cell"}
              key={gate.id}
              onClick={() => setActiveGateId(gate.id)}
            >
              <span className={`matrix-led tone-${statusTone[gate.status] ?? "watch"}`} />
              <strong>{gate.label}</strong>
              <em>{gate.status.replaceAll("_", " ")}</em>
            </button>
          ))}
        </div>
      </article>

      <article className="chart-card chart-card-focus">
        <div className="chart-card-header">
          <div>
            <p className="eyeless">Selected gate</p>
            <h2>{activeGate?.label ?? "No gate selected"}</h2>
          </div>
          <Badge tone={statusTone[activeGate?.status ?? "missing"] ?? "watch"}>{activeGate?.status ?? "missing"}</Badge>
        </div>
        <p>{activeGate?.evidence}</p>
        <div className="formula-meter">
          <span style={{ width: `${readiness}%` }} />
        </div>
        <small>{formulaReady}/{formulaTotal} formulas validated. Treasury telemetry stays locked until every gate is cleared.</small>
      </article>
    </section>
  );
}
