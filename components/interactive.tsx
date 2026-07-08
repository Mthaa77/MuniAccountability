"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  actions,
  agsaDocuments,
  agsaExtract,
  agsaPageCitations,
  briefingTemplates,
  extractionIssues,
  municipalities,
  queueItems,
  sourceFreshnessEvents,
  sourceHealth
} from "@/lib/pilot-data";
import type { Action, AgsaReviewDecision, AgsaReviewDecisionStatus, DraftAction, QueueItem, Severity, SourceHealth } from "@/lib/types";
import { Badge, actionLabel, severityLabel } from "./ui";

type QueueRiskType = QueueItem["riskType"];
type GovernedSource = SourceHealth & {
  reviewStats?: {
    totalIssues: number;
    open: number;
    accepted: number;
    correction: number;
    excluded: number;
    blockers: number;
  };
};

function municipalityName(id: string) {
  return municipalities.find((municipality) => municipality.id === id)?.commonName ?? id;
}

function findingPathFromQueueItem(item: QueueItem) {
  return item.id.startsWith("qi_finding_") ? `/findings/${item.id.replace("qi_finding_", "")}` : null;
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
          <option value="resolved">Resolved</option>
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
  const [riskType, setRiskType] = useState<QueueRiskType | "all">("all");
  const [draftActions, setDraftActions] = useState<DraftAction[]>([]);
  const [draftMessage, setDraftMessage] = useState("Draft actions persist to the local workflow store.");
  const riskTypes = Array.from(new Set(queueItems.map((item) => item.riskType)));
  const filtered = queueItems.filter((item) => {
    const matchesSeverity = severity === "all" || item.severity === severity;
    const matchesRiskType = riskType === "all" || item.riskType === riskType;
    return matchesSeverity && matchesRiskType;
  });
  const [selectedId, setSelectedId] = useState(filtered[0]?.id ?? queueItems[0].id);
  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? queueItems[0];

  useEffect(() => {
    let cancelled = false;

    async function loadDrafts() {
      try {
        const response = await fetch("/api/v1/actions/drafts", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load draft actions.");
        const payload = (await response.json()) as { data?: { actions?: DraftAction[] } };
        if (!cancelled) setDraftActions(payload.data?.actions ?? []);
      } catch {
        if (!cancelled) setDraftMessage("Draft action store is unavailable.");
      }
    }

    loadDrafts();

    return () => {
      cancelled = true;
    };
  }, []);

  async function createActionFromFinding(item: QueueItem) {
    const exists = draftActions.some((action) => action.id === `draft_${item.id}`);
    if (exists) return;

    const draft = {
      id: `draft_${item.id}`,
      sourceQueueItemId: item.id,
      sourceFindingId: item.id.startsWith("qi_finding_") ? item.id.replace("qi_finding_", "") : undefined,
      municipalityId: item.municipalityId,
      title: `Resolve: ${item.title}`,
      linkedFinding: item.reasonSummary,
      owner: item.owner,
      reviewer: "Oversight reviewer",
      dueDate: item.dueDate,
      status: "not_started",
      requiredEvidence: ["Management response", "Owner assignment", "AGSA source citation", "Reviewer sign-off"],
      escalationRule: "Escalate if evidence is not submitted by the queue due date.",
      sourceRefs: item.evidenceRefs
    };

    setDraftMessage("Saving draft action...");
    const response = await fetch("/api/v1/actions/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft)
    });

    if (!response.ok) {
      setDraftMessage("Could not persist draft action.");
      return;
    }

    const payload = (await response.json()) as { data?: { action?: DraftAction } };
    setDraftActions((current) => [payload.data?.action, ...current].filter(Boolean) as DraftAction[]);
    setDraftMessage(`Saved draft action for ${municipalityName(item.municipalityId)}.`);
  }

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
          <select value={riskType} onChange={(event) => setRiskType(event.target.value as QueueRiskType | "all")}>
            <option value="all">All risk types</option>
            {riskTypes.map((type) => (
              <option key={type} value={type}>{type.replaceAll("_", " ")}</option>
            ))}
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
                  <td>
                    {findingPathFromQueueItem(item) ? (
                      <Link href={findingPathFromQueueItem(item) ?? "#"}><strong>{item.title}</strong></Link>
                    ) : (
                      <strong>{item.title}</strong>
                    )}
                    <span>{item.reasonSummary}</span>
                  </td>
                  <td><Badge tone={item.severity}>{severityLabel[item.severity]}</Badge></td>
                  <td>{item.requiredNextStep}</td>
                  <td>{item.owner}</td>
                  <td>{item.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {draftActions.length ? (
          <section className="draft-action-panel">
            <div className="panel-header">
              <div>
                <p className="eyeless">Created from findings</p>
                <h2>Draft action queue</h2>
              </div>
              <Badge tone="watch">{draftActions.length} draft</Badge>
            </div>
            <div className="compact-list">
              {draftActions.map((action) => (
                <article key={action.id}>
                  <div>
                    <strong>{action.title}</strong>
                    <span>{municipalityName(action.municipalityId)} - due {action.dueDate}</span>
                  </div>
                  <Badge tone={action.status}>{actionLabel[action.status]}</Badge>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <p className="lead">{draftMessage}</p>
        )}
      </div>
      <EvidenceDrawer item={selected} onCreateAction={createActionFromFinding} />
    </section>
  );
}

export function EvidenceDrawer({ item, onCreateAction }: { item: QueueItem; onCreateAction?: (item: QueueItem) => void }) {
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
        <div>
          <dt>Source</dt>
          <dd>
            <Link href={item.evidenceRefs[0].url ?? "/sources"}>{item.evidenceRefs[0].label}</Link>
          </dd>
        </div>
        <div><dt>Page/section</dt><dd>{item.evidenceRefs[0].location}</dd></div>
      </dl>
      <button className="secondary-action drawer-action">Add to briefing</button>
      <button className="primary-action drawer-action" onClick={() => onCreateAction?.(item)}>Create action from finding</button>
    </aside>
  );
}

export function ActionKanban({ scopedActions = actions }: { scopedActions?: Action[] }) {
  const [draftActions, setDraftActions] = useState<DraftAction[]>([]);
  const boardActions = [...scopedActions, ...draftActions.filter((draft) => scopedActions === actions || scopedActions.some((action) => action.municipalityId === draft.municipalityId))];
  const columns = [
    { id: "overdue", label: "Overdue" },
    { id: "in_progress", label: "In progress" },
    { id: "under_review", label: "Under review" },
    { id: "approved", label: "Approved" }
  ] as const;

  useEffect(() => {
    let cancelled = false;

    async function loadDrafts() {
      try {
        const response = await fetch("/api/v1/actions/drafts", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { data?: { actions?: DraftAction[] } };
        if (!cancelled) setDraftActions(payload.data?.actions ?? []);
      } catch {
        if (!cancelled) setDraftActions([]);
      }
    }

    loadDrafts();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="kanban">
      {columns.map((column) => (
        <div className="kanban-column" key={column.id}>
          <div className="kanban-header">
            <strong>{column.label}</strong>
            <span>{boardActions.filter((action) => action.status === column.id).length}</span>
          </div>
          {boardActions.filter((action) => action.status === column.id).map((action) => (
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
  const [governedSources, setGovernedSources] = useState<GovernedSource[]>(sourceHealth);
  const [governedEvents, setGovernedEvents] = useState(sourceFreshnessEvents);
  const filtered = status === "all" ? governedSources : governedSources.filter((source) => source.status === status);

  useEffect(() => {
    let cancelled = false;

    async function loadSources() {
      try {
        const response = await fetch("/api/v1/sources", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          data?: {
            sources?: GovernedSource[];
            events?: typeof sourceFreshnessEvents;
          };
        };
        if (cancelled) return;
        setGovernedSources(payload.data?.sources ?? sourceHealth);
        setGovernedEvents(payload.data?.events ?? sourceFreshnessEvents);
      } catch {
        if (!cancelled) setGovernedSources(sourceHealth);
      }
    }

    loadSources();

    return () => {
      cancelled = true;
    };
  }, []);

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
                {source.reviewStats ? (
                  <span>
                    Review: {source.reviewStats.open} open / {source.reviewStats.accepted} accepted / {source.reviewStats.correction} correction / {source.reviewStats.excluded} excluded
                  </span>
                ) : null}
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
          {governedEvents.map((event) => (
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

export function AgsaExtractionReview() {
  const [statusByKey, setStatusByKey] = useState<Record<string, AgsaReviewDecisionStatus | "open">>({});
  const [confidence, setConfidence] = useState<"all" | "needs_review" | "low" | "medium" | "high">("all");
  const [documentId, setDocumentId] = useState("all");
  const [reviewState, setReviewState] = useState<"loading" | "ready" | "saving" | "error">("loading");
  const [reviewMessage, setReviewMessage] = useState("Loading persisted review decisions.");
  const [correctionDrafts, setCorrectionDrafts] = useState<Record<string, { replacementField: string; replacementValue: string; rationale: string }>>({});

  const documentsById = useMemo(() => new Map(agsaDocuments.map((document) => [document.documentId, document])), []);
  const citationsByPage = useMemo(() => {
    const map = new Map<string, typeof agsaPageCitations>();
    for (const citation of agsaPageCitations) {
      const key = `${citation.documentId}:${citation.pageNumber}`;
      map.set(key, [...(map.get(key) ?? []), citation]);
    }
    return map;
  }, []);

  const reviewItems = useMemo(() => {
    const issueItems = extractionIssues.map((issue) => {
      const page = agsaExtract.pagesByDocument[issue.documentId]?.find((candidate) => candidate.pageNumber === issue.pageNumber);
      const citations = citationsByPage.get(`${issue.documentId}:${issue.pageNumber}`) ?? [];
      return {
        key: `${issue.documentId}:${issue.pageNumber}:${issue.issue}`,
        documentId: issue.documentId,
        pageNumber: issue.pageNumber,
        issue: issue.issue,
        sectionTitle: page?.sectionTitle ?? citations[0]?.sectionTitle ?? "Unsectioned page",
        confidence: page?.extractionConfidence ?? citations[0]?.extractionConfidence ?? "needs_review",
        textSample: page?.textSample ?? citations[0]?.quoteSnippet ?? "No text sample available.",
        citations
      };
    });

    return issueItems.filter((item) => {
      const matchesConfidence = confidence === "all" || item.confidence === confidence;
      const matchesDocument = documentId === "all" || item.documentId === documentId;
      return matchesConfidence && matchesDocument;
    });
  }, [citationsByPage, confidence, documentId]);

  useEffect(() => {
    let cancelled = false;

    async function loadDecisions() {
      try {
        const response = await fetch("/api/v1/agsa/review-decisions", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load review decisions.");
        const payload = (await response.json()) as { data?: { decisions?: AgsaReviewDecision[] } };
        if (cancelled) return;
        setStatusByKey(
          Object.fromEntries((payload.data?.decisions ?? []).map((decision) => [decision.decisionKey, decision.status]))
        );
        setReviewState("ready");
        setReviewMessage(`${payload.data?.decisions?.length ?? 0} persisted review decision(s) loaded.`);
      } catch (error) {
        if (cancelled) return;
        setReviewState("error");
        setReviewMessage(error instanceof Error ? error.message : "Could not load review decisions.");
      }
    }

    loadDecisions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const linkedDocumentId = new URLSearchParams(window.location.search).get("documentId");
    if (linkedDocumentId) setDocumentId(linkedDocumentId);
  }, []);

  const reviewStats = useMemo(() => {
    const total = extractionIssues.length;
    const accepted = Object.values(statusByKey).filter((status) => status === "accepted").length;
    const correction = Object.values(statusByKey).filter((status) => status === "correction").length;
    const excluded = Object.values(statusByKey).filter((status) => status === "excluded").length;
    return [
      ["Open exceptions", String(Math.max(0, total - accepted - correction - excluded))],
      ["Accepted", String(accepted)],
      ["Needs correction", String(correction)],
      ["Excluded", String(excluded)]
    ];
  }, [statusByKey]);

  async function setDecision(
    item: {
      key: string;
      documentId: string;
      pageNumber: number;
      issue: string;
      citations: typeof agsaPageCitations;
    },
    decision: AgsaReviewDecisionStatus
  ) {
    setReviewState("saving");
    setReviewMessage(`Saving ${decision.replaceAll("_", " ")} decision...`);
    setStatusByKey((current) => ({ ...current, [item.key]: decision }));

    try {
      const response = await fetch("/api/v1/agsa/review-decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisionKey: item.key,
          documentId: item.documentId,
          pageNumber: item.pageNumber,
          issue: item.issue,
          status: decision,
          reviewer: "prototype-reviewer",
          citationIds: item.citations.map((citation) => citation.citationId),
          replacementField: correctionDrafts[item.key]?.replacementField,
          replacementValue: correctionDrafts[item.key]?.replacementValue,
          rationale: correctionDrafts[item.key]?.rationale
        })
      });

      if (!response.ok) throw new Error("Could not persist review decision.");
      setReviewState("ready");
      setReviewMessage(`Saved ${decision.replaceAll("_", " ")} decision for page ${item.pageNumber}.`);
    } catch (error) {
      setReviewState("error");
      setReviewMessage(error instanceof Error ? error.message : "Could not persist review decision.");
    }
  }

  function updateCorrectionDraft(key: string, patch: Partial<{ replacementField: string; replacementValue: string; rationale: string }>) {
    setCorrectionDrafts((current) => ({
      ...current,
      [key]: {
        replacementField: current[key]?.replacementField ?? "",
        replacementValue: current[key]?.replacementValue ?? "",
        rationale: current[key]?.rationale ?? "",
        ...patch
      }
    }));
  }

  return (
    <section className="review-workspace">
      <div className="admin-grid">
        {reviewStats.map(([label, value]) => (
          <article className="metric-card tone-neutral" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <p>Persisted to the local AGSA review decision store.</p>
          </article>
        ))}
      </div>

      <section className="panel wide">
        <div className="toolbar">
          <select value={documentId} onChange={(event) => setDocumentId(event.target.value)}>
            <option value="all">All AGSA reports</option>
            {agsaDocuments.map((document) => (
              <option key={document.documentId} value={document.documentId}>
                {document.reportYear} - {document.title}
              </option>
            ))}
          </select>
          <select value={confidence} onChange={(event) => setConfidence(event.target.value as typeof confidence)}>
            <option value="all">All confidence levels</option>
            <option value="needs_review">Needs review</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <Link className="secondary-action" href="/sources">
            Source health
          </Link>
        </div>
        <div className="review-save-state">
          <Badge tone={reviewState === "error" ? "risk" : reviewState === "saving" || reviewState === "loading" ? "watch" : "healthy"}>
            {reviewState}
          </Badge>
          <span>{reviewMessage}</span>
        </div>
        <div className="review-list">
          {reviewItems.map((item) => {
            const document = documentsById.get(item.documentId);
            const status = statusByKey[item.key] ?? "open";
            return (
              <article className="review-card" key={item.key}>
                <div className="review-card-top">
                  <div>
                    <span>{document?.reportFamily ?? "AGSA"} / {document?.reportYear ?? "unknown"}</span>
                    <strong>{document?.title ?? item.documentId}</strong>
                    <p>{document?.fileName}, page {item.pageNumber} - {item.sectionTitle}</p>
                  </div>
                  <div className="review-badges">
                    <Badge tone={item.confidence}>{item.confidence.replaceAll("_", " ")}</Badge>
                    <Badge tone={status === "open" ? "watch" : status}>{status.replaceAll("_", " ")}</Badge>
                  </div>
                </div>
                <p className="review-issue">{item.issue}</p>
                <blockquote>{item.textSample}</blockquote>
                <div className="review-citations">
                  {item.citations.length ? (
                    item.citations.map((citation) => (
                      <span key={citation.citationId}>{citation.citationId}</span>
                    ))
                  ) : (
                    <span>No citation generated for this page yet</span>
                  )}
                </div>
                <div className="correction-grid">
                  <input
                    value={correctionDrafts[item.key]?.replacementField ?? ""}
                    onChange={(event) => updateCorrectionDraft(item.key, { replacementField: event.target.value })}
                    placeholder="Field to correct, e.g. auditOutcome"
                  />
                  <input
                    value={correctionDrafts[item.key]?.replacementValue ?? ""}
                    onChange={(event) => updateCorrectionDraft(item.key, { replacementValue: event.target.value })}
                    placeholder="Corrected value"
                  />
                  <input
                    value={correctionDrafts[item.key]?.rationale ?? ""}
                    onChange={(event) => updateCorrectionDraft(item.key, { rationale: event.target.value })}
                    placeholder="Reviewer rationale"
                  />
                </div>
                <div className="review-actions">
                  <button className="secondary-action" onClick={() => setDecision(item, "accepted")}>Accept</button>
                  <button className="secondary-action" onClick={() => setDecision(item, "correction")}>Needs correction</button>
                  <button className="secondary-action" onClick={() => setDecision(item, "excluded")}>Exclude</button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
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
  const [stats, setStats] = useState([
    ["Open quality exceptions", String(extractionIssues.length)],
    ["Review blockers", "0"],
    ["Accepted reviews", "0"],
    ["Restricted fields hidden", "100%"]
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const response = await fetch("/api/v1/sources", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          data?: {
            review?: {
              open: number;
              blockers: number;
              accepted: number;
            };
          };
        };
        if (cancelled || !payload.data?.review) return;
        setStats([
          ["Open quality exceptions", String(payload.data.review.open)],
          ["Review blockers", String(payload.data.review.blockers)],
          ["Accepted reviews", String(payload.data.review.accepted)],
          ["Restricted fields hidden", "100%"]
        ]);
      } catch {
        if (!cancelled) {
          setStats((current) => current);
        }
      }
    }

    loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

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
