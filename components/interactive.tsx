"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { actions, briefingTemplates, municipalities, queueItems, sourceFreshnessEvents, sourceHealth } from "@/lib/pilot-data";
import type { Action, QueueItem, Severity, SourceHealth } from "@/lib/types";
import { Badge, actionLabel, severityLabel } from "./ui";

function municipalityName(id: string) {
  return municipalities.find((municipality) => municipality.id === id)?.commonName ?? id;
}

export function MunicipalityDirectory() {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const filtered = municipalities.filter((municipality) => {
    const matchesQuery = `${municipality.name} ${municipality.province} ${municipality.auditOutcome}`.toLowerCase().includes(query.toLowerCase());
    const matchesSeverity = severity === "all" || municipality.interventionPriority === severity;
    return matchesQuery && matchesSeverity;
  });

  return (
    <section className="panel wide">
      <div className="toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search municipality, province or audit outcome" />
        <select value={severity} onChange={(event) => setSeverity(event.target.value as Severity | "all")}>
          <option value="all">All risk levels</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="watch">Watch</option>
        </select>
      </div>
      <div className="directory-grid">
        {filtered.map((municipality) => (
          <Link href={`/municipalities/${municipality.id}`} className="directory-card" key={municipality.id}>
            <div>
              <span>{municipality.category}</span>
              <Badge tone={municipality.interventionPriority}>{severityLabel[municipality.interventionPriority]}</Badge>
            </div>
            <strong>{municipality.name}</strong>
            <p>{municipality.situationSummary}</p>
            <div className="card-footer">
              <span>IPI {municipality.ipi}</span>
              <span>{municipality.auditOutcome}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function QueueWorkspace() {
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const filtered = severity === "all" ? queueItems : queueItems.filter((item) => item.severity === severity);
  const [selectedId, setSelectedId] = useState(filtered[0]?.id ?? queueItems[0].id);
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? queueItems[0];

  return (
    <section className="workspace-split">
      <div className="panel wide">
        <div className="toolbar">
          <select value={severity} onChange={(event) => setSeverity(event.target.value as Severity | "all")}>
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="watch">Watch</option>
          </select>
          <button className="secondary-action">Assign selected</button>
          <button className="secondary-action">Add to briefing</button>
          <button className="primary-action">Request update</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Municipality</th>
                <th>Why it is here</th>
                <th>Severity</th>
                <th>Next action</th>
                <th>Owner</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr className={selected.id === item.id ? "selected-row" : ""} key={item.id} onClick={() => setSelectedId(item.id)}>
                  <td><strong>#{item.rank}</strong><span className="score">{item.priorityScore}</span></td>
                  <td>{municipalityName(item.municipalityId)}</td>
                  <td><strong>{item.title}</strong><span>{item.reasonSummary}</span></td>
                  <td><Badge tone={item.severity}>{severityLabel[item.severity]}</Badge></td>
                  <td>{item.requiredNextStep}</td>
                  <td>{item.owner}</td>
                  <td>{item.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <EvidenceDrawer item={selected} />
    </section>
  );
}

export function EvidenceDrawer({ item }: { item: QueueItem }) {
  return (
    <aside className="panel evidence-drawer">
      <div className="panel-header">
        <div>
          <p className="eyeless">Evidence drawer</p>
          <h2>Why ranked #{item.rank}</h2>
        </div>
        <Badge tone={item.severity}>{severityLabel[item.severity]}</Badge>
      </div>
      <p className="lead">{item.reasonSummary}</p>
      <dl className="evidence-list">
        <div><dt>Municipality</dt><dd>{municipalityName(item.municipalityId)}</dd></div>
        <div><dt>Risk signal</dt><dd>{item.riskType.replaceAll("_", " ")}</dd></div>
        <div><dt>What changed</dt><dd>{item.whatChanged}</dd></div>
        <div><dt>Required action</dt><dd>{item.requiredNextStep}</dd></div>
        <div><dt>Source</dt><dd>{item.evidenceRefs[0].label}</dd></div>
      </dl>
      <button className="primary-action drawer-action">Add to briefing</button>
    </aside>
  );
}

export function ActionKanban({ scopedActions = actions }: { scopedActions?: Action[] }) {
  const columns = [
    { id: "overdue", label: "Overdue" },
    { id: "in_progress", label: "In progress" },
    { id: "under_review", label: "Under review" },
    { id: "approved", label: "Approved" }
  ] as const;

  return (
    <section className="kanban">
      {columns.map((column) => (
        <div className="kanban-column" key={column.id}>
          <div className="kanban-header">
            <strong>{column.label}</strong>
            <span>{scopedActions.filter((action) => action.status === column.id).length}</span>
          </div>
          {scopedActions.filter((action) => action.status === column.id).map((action) => (
            <article className="kanban-card" key={action.id}>
              <strong>{action.title}</strong>
              <span>{municipalityName(action.municipalityId)}</span>
              <p>{action.linkedFinding}</p>
              <Badge tone={action.status}>{actionLabel[action.status]}</Badge>
            </article>
          ))}
        </div>
      ))}
    </section>
  );
}

export function BriefingWorkspace() {
  const [templateId, setTemplateId] = useState(briefingTemplates[0].id);
  const template = briefingTemplates.find((candidate) => candidate.id === templateId) ?? briefingTemplates[0];

  return (
    <section className="workspace-split">
      <div className="panel">
        <div className="panel-header">
          <div>
            <p className="eyeless">Template selector</p>
            <h2>Briefing Builder</h2>
          </div>
          <Badge tone="review">Review</Badge>
        </div>
        <div className="template-list">
          {briefingTemplates.map((item) => (
            <button className={item.id === templateId ? "active" : ""} key={item.id} onClick={() => setTemplateId(item.id)}>
              <strong>{item.name}</strong>
              <span>{item.audience}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="panel briefing-preview">
        <p className="eyeless">Export-ready preview</p>
        <h2>{template.name}</h2>
        <p className="lead">Audience: {template.audience}. Draft text must remain source-cited and reviewer-approved.</p>
        {template.sections.map((section, index) => (
          <article key={section}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{section}</strong>
            <p>Uses AGSA verified source references and workflow state. Treasury-derived values remain excluded.</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SourceHealthTabs() {
  const [status, setStatus] = useState<SourceHealth["status"] | "all">("all");
  const filtered = status === "all" ? sourceHealth : sourceHealth.filter((source) => source.status === status);

  return (
    <section className="workspace-split">
      <div className="panel">
        <div className="toolbar segmented">
          {(["all", "healthy", "degraded", "unknown"] as const).map((item) => (
            <button className={status === item ? "active" : ""} key={item} onClick={() => setStatus(item)}>
              {item}
            </button>
          ))}
        </div>
        <div className="source-stack">
          {filtered.map((source) => (
            <article key={source.sourceId}>
              <div>
                <strong>{source.sourceName}</strong>
                <span>{source.treatment}</span>
              </div>
              <Badge tone={source.status}>{source.status}</Badge>
            </article>
          ))}
        </div>
      </div>
      <div className="panel">
        <p className="eyeless">Freshness events</p>
        <h2>Source timeline</h2>
        <div className="timeline">
          {sourceFreshnessEvents.map((event) => (
            <article key={`${event.sourceId}-${event.event}`}>
              <span>{event.date}</span>
              <strong>{event.event}</strong>
              <Badge tone={event.status}>{event.status}</Badge>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RecoveryMilestoneList({ milestones }: { milestones: typeof import("@/lib/pilot-data").recoveryMilestones }) {
  return (
    <div className="milestone-list">
      {milestones.map((milestone) => (
        <article key={milestone.id}>
          <div>
            <strong>{milestone.title}</strong>
            <span>{milestone.owner} - due {milestone.dueDate}</span>
          </div>
          <Badge tone={milestone.status}>{milestone.status.replaceAll("_", " ")}</Badge>
          <p>Blocker: {milestone.blocker}</p>
          <p>Evidence: {milestone.evidence}</p>
        </article>
      ))}
    </div>
  );
}

export function FinancialValidationPanel() {
  const gates = ["Source health", "Reuse review", "Schema fingerprint", "Formula version", "Freshness SLA"];
  const completed = new Set(["Source health"]);

  return (
    <section className="panel validation-panel">
      <div className="panel-header">
        <div>
          <p className="eyeless">Phase 2 gate</p>
          <h2>Treasury telemetry validation</h2>
        </div>
        <Badge tone="under_review">Pending validation</Badge>
      </div>
      <p className="lead">Financial pulse values are intentionally disabled until Municipal Money connector and reuse checks pass.</p>
      <div className="gate-list">
        {gates.map((gate) => (
          <article key={gate}>
            <span className={completed.has(gate) ? "complete" : ""} />
            <strong>{gate}</strong>
            <em>{completed.has(gate) ? "Started" : "Required before live display"}</em>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AdminConsole() {
  const stats = useMemo(
    () => [
      ["Open quality exceptions", "3"],
      ["Publication approvals", "2"],
      ["Audit-log events", "128"],
      ["Restricted fields hidden", "100%"]
    ],
    []
  );

  return (
    <section className="admin-grid">
      {stats.map(([label, value]) => (
        <article className="metric-card tone-neutral" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
          <p>Tenant-scoped prototype control.</p>
        </article>
      ))}
    </section>
  );
}
