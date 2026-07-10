"use client";

import Link from "next/link";
import { CheckCircle2, ClipboardCheck, FilePlus2, Link2, RotateCcw, Save, Search, Send, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch, apiPost } from "@/lib/client-api";
import { municipalities, queueItems } from "@/lib/pilot-data";
import type { ActionStatus, DraftAction, QueueItem, Severity } from "@/lib/types";
import { Badge, actionLabel, severityLabel } from "@/components/ui";

const firstQueueItem = queueItems[0] as QueueItem;

const statusOptions: ActionStatus[] = [
  "not_started",
  "in_progress",
  "evidence_submitted",
  "under_review",
  "approved",
  "rejected",
  "escalated",
  "closed_with_residual_risk"
];

type ActionDraftForm = {
  title: string;
  owner: string;
  assignedTo: string;
  reviewer: string;
  dueDate: string;
  status: ActionStatus;
  requiredEvidenceText: string;
  escalationRule: string;
  closureNote: string;
  residualRisk: string;
};

type EvidenceForm = {
  label: string;
  url: string;
  submittedBy: string;
  note: string;
  sourceRefId: string;
};

function municipalityName(id: string) {
  return municipalities.find((municipality) => municipality.id === id)?.commonName ?? id;
}

function defaultForm(item: QueueItem): ActionDraftForm {
  return {
    title: `Resolve: ${item.title}`,
    owner: item.owner,
    assignedTo: item.owner,
    reviewer: "Oversight reviewer",
    dueDate: item.dueDate,
    status: "not_started",
    requiredEvidenceText: ["Management response", "Owner assignment", "AGSA source citation", "Reviewer sign-off"].join("\n"),
    escalationRule: "Escalate if evidence is not submitted by the queue due date.",
    closureNote: "",
    residualRisk: ""
  };
}

function formFromDraft(action: DraftAction): ActionDraftForm {
  return {
    title: action.title,
    owner: action.owner,
    assignedTo: action.assignedTo ?? action.owner,
    reviewer: action.reviewer,
    dueDate: action.dueDate,
    status: action.status,
    requiredEvidenceText: action.requiredEvidence.join("\n"),
    escalationRule: action.escalationRule,
    closureNote: action.closureNote ?? "",
    residualRisk: action.residualRisk ?? ""
  };
}

function sourceOptions(item: QueueItem, draft?: DraftAction) {
  const byId = new Map<string, QueueItem["evidenceRefs"][number]>();
  item.evidenceRefs.forEach((source) => byId.set(source.id, source));
  draft?.sourceRefs.forEach((source) => byId.set(source.id, source));
  return Array.from(byId.values());
}

function upsertDraft(current: DraftAction[], saved: DraftAction) {
  const exists = current.some((action) => action.id === saved.id);
  return exists ? current.map((action) => action.id === saved.id ? saved : action) : [saved, ...current];
}

function requirementLines(text: string) {
  return text.split("\n").map((line) => line.trim()).filter(Boolean);
}

function requirementCovered(requirement: string, draft?: DraftAction) {
  const haystack = `${draft?.evidenceAttachments?.map((item) => `${item.label} ${item.note ?? ""}`).join(" ") ?? ""} ${draft?.sourceRefs.map((source) => source.label).join(" ") ?? ""}`.toLowerCase();
  return requirement.toLowerCase().split(/\s+/).filter((word) => word.length > 4).some((word) => haystack.includes(word));
}

export function ActionStudio() {
  const [draftActions, setDraftActions] = useState<DraftAction[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("Loading draft actions from the workflow store...");
  const [selectedQueueId, setSelectedQueueId] = useState(firstQueueItem.id);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [studioOpen, setStudioOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [form, setForm] = useState<ActionDraftForm>(() => defaultForm(firstQueueItem));
  const [evidenceForm, setEvidenceForm] = useState<EvidenceForm>({
    label: "",
    url: "",
    submittedBy: "Oversight reviewer",
    note: "",
    sourceRefId: firstQueueItem.evidenceRefs[0]?.id ?? ""
  });

  const selectedQueue = queueItems.find((item) => item.id === selectedQueueId) ?? firstQueueItem;
  const selectedDraft = useMemo(() => {
    if (selectedDraftId) return draftActions.find((action) => action.id === selectedDraftId);
    return draftActions.find((action) => action.sourceQueueItemId === selectedQueue.id);
  }, [draftActions, selectedDraftId, selectedQueue.id]);
  const sources = sourceOptions(selectedQueue, selectedDraft);
  const requirements = requirementLines(form.requiredEvidenceText);
  const evidenceCount = selectedDraft?.evidenceAttachments?.length ?? 0;
  const coveredRequirements = requirements.filter((requirement) => requirementCovered(requirement, selectedDraft)).length;
  const readinessScore = Math.min(
    100,
    26 + evidenceCount * 18 + coveredRequirements * 9 + (selectedDraft?.status === "under_review" ? 16 : 0) + (["approved", "closed_with_residual_risk"].includes(selectedDraft?.status ?? "") ? 32 : 0)
  );
  const studioStats = {
    drafts: draftActions.length,
    withEvidence: draftActions.filter((action) => (action.evidenceAttachments?.length ?? 0) > 0).length,
    underReview: draftActions.filter((action) => action.status === "under_review").length,
    approved: draftActions.filter((action) => ["approved", "closed_with_residual_risk"].includes(action.status)).length
  };
  const filteredQueue = queueItems.filter((item) => {
    const searchable = `${municipalityName(item.municipalityId)} ${item.title} ${item.requiredNextStep} ${item.reasonSummary} ${item.owner}`.toLowerCase();
    const matchesQuery = searchable.includes(query.toLowerCase());
    const matchesSeverity = severityFilter === "all" || item.severity === severityFilter;
    return matchesQuery && matchesSeverity;
  });

  useEffect(() => {
    let cancelled = false;

    async function loadDrafts() {
      try {
        const payload = await apiGet<{ actions?: DraftAction[] }>("/v1/actions/drafts");
        if (cancelled) return;
        setDraftActions(payload.data.actions ?? []);
        setLoadState("ready");
        setMessage(`${payload.data.actions?.length ?? 0} draft action(s) loaded.`);
      } catch {
        if (!cancelled) {
          setLoadState("error");
          setMessage("Draft action store is unavailable.");
        }
      }
    }

    loadDrafts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setForm(selectedDraft ? formFromDraft(selectedDraft) : defaultForm(selectedQueue));
    setEvidenceForm((current) => ({
      ...current,
      sourceRefId: selectedDraft?.sourceRefs[0]?.id ?? selectedQueue.evidenceRefs[0]?.id ?? ""
    }));
  }, [selectedDraft?.id, selectedQueue]);

  function openFromQueue(item: QueueItem) {
    setSelectedQueueId(item.id);
    setSelectedDraftId(null);
    setStudioOpen(true);
  }

  function openDraft(action: DraftAction) {
    setSelectedQueueId(action.sourceQueueItemId ?? queueItems.find((item) => item.municipalityId === action.municipalityId)?.id ?? firstQueueItem.id);
    setSelectedDraftId(action.id);
    setStudioOpen(true);
  }

  function updateForm<K extends keyof ActionDraftForm>(key: K, value: ActionDraftForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateEvidence<K extends keyof EvidenceForm>(key: K, value: EvidenceForm[K]) {
    setEvidenceForm((current) => ({ ...current, [key]: value }));
  }

  function draftPayload(item: QueueItem, existing?: DraftAction) {
    return {
      id: existing?.id ?? `draft_${item.id}`,
      sourceQueueItemId: item.id,
      sourceFindingId: item.id.startsWith("qi_finding_") ? item.id.replace("qi_finding_", "") : existing?.sourceFindingId,
      municipalityId: item.municipalityId,
      title: form.title,
      linkedFinding: item.reasonSummary,
      owner: form.owner,
      assignedTo: form.assignedTo || form.owner,
      reviewer: form.reviewer,
      dueDate: form.dueDate,
      status: form.status,
      requiredEvidence: requirements,
      escalationRule: form.escalationRule,
      closureNote: form.closureNote || undefined,
      residualRisk: form.residualRisk || undefined,
      sourceRefs: item.evidenceRefs
    };
  }

  async function saveAction(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setSaving(true);
    setMessage(selectedDraft ? "Updating action studio record..." : "Creating action from evidence...");

    try {
      const payload = selectedDraft
        ? await apiPatch<{ action?: DraftAction }>(`/v1/actions/drafts/${selectedDraft.id}`, draftPayload(selectedQueue, selectedDraft))
        : await apiPost<{ action?: DraftAction }>("/v1/actions/drafts", draftPayload(selectedQueue));
      const saved = payload.data.action;
      if (saved) {
        setDraftActions((current) => upsertDraft(current, saved));
        setSelectedDraftId(saved.id);
        setMessage(selectedDraft ? "Action updated." : "Draft action created from evidence.");
      }
    } catch {
      setMessage("Could not save action. Check required fields and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function transitionStatus(status: ActionStatus) {
    if (!selectedDraft) {
      updateForm("status", status);
      return;
    }

    setSaving(true);
    setMessage(`Moving action to ${actionLabel[status].toLowerCase()}...`);
    try {
      const payload = await apiPost<{ action?: DraftAction }>(`/v1/actions/drafts/${selectedDraft.id}/transition`, {
        status,
        changedBy: "action-studio",
        reason: "Updated from Action Studio"
      });
      const saved = payload.data.action;
      if (saved) {
        setDraftActions((current) => current.map((action) => action.id === selectedDraft.id ? saved : action));
        updateForm("status", saved.status);
        setMessage("Workflow status saved.");
      }
    } catch {
      setMessage("Could not transition this action.");
    } finally {
      setSaving(false);
    }
  }

  async function attachEvidence() {
    if (!selectedDraft) {
      setMessage("Create or save the action before attaching evidence.");
      return;
    }

    const label = evidenceForm.label.trim();
    if (!label) {
      setMessage("Add an evidence label before attaching proof.");
      return;
    }

    setSaving(true);
    setMessage("Attaching evidence...");
    try {
      const payload = await apiPost<{ action?: DraftAction }>(`/v1/actions/drafts/${selectedDraft.id}/evidence`, {
        label,
        url: evidenceForm.url || undefined,
        submittedBy: evidenceForm.submittedBy || "Oversight reviewer",
        note: evidenceForm.note || undefined,
        sourceRefId: evidenceForm.sourceRefId || undefined
      });
      const saved = payload.data.action;
      if (saved) {
        setDraftActions((current) => current.map((action) => action.id === selectedDraft.id ? saved : action));
        setEvidenceForm((current) => ({ ...current, label: "", url: "", note: "" }));
        setMessage("Evidence attached and action moved forward.");
      }
    } catch {
      setMessage("Could not attach evidence.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="action-studio-console">
      <div className="action-studio-hero">
        <div>
          <p className="eyeless">Step 2</p>
          <h2>Action Studio</h2>
          <p>Create follow-up actions from evidence, assign owners, attach proof, move status and prepare reviewer sign-off.</p>
        </div>
        <div className="action-studio-state">
          <Badge tone={loadState === "error" ? "risk" : "under_review"}>{loadState}</Badge>
          <span>{message}</span>
        </div>
      </div>

      <section className="action-studio-command-strip" aria-label="Action Studio workflow summary">
        <article><span>Drafts</span><strong>{studioStats.drafts}</strong><small>Saved in workflow store</small></article>
        <article><span>With evidence</span><strong>{studioStats.withEvidence}</strong><small>Proof has been attached</small></article>
        <article><span>Under review</span><strong>{studioStats.underReview}</strong><small>Waiting for reviewer sign-off</small></article>
        <article><span>Accepted</span><strong>{studioStats.approved}</strong><small>Ready for closure or reporting</small></article>
      </section>

      <div className="action-studio-toolbar">
        <div className="action-studio-search">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search queue by municipality, risk, owner or next step..." />
        </div>
        <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value as Severity | "all")}>
          <option value="all">All severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="watch">Watch</option>
        </select>
      </div>

      <div className="action-studio-grid">
        <section className="action-studio-panel">
          <div className="action-studio-panel-header">
            <div>
              <p className="eyeless">Start from evidence</p>
              <h3>Queue items needing action</h3>
            </div>
            <Badge tone="watch">{filteredQueue.length} signal(s)</Badge>
          </div>
          <div className="action-studio-list">
            {filteredQueue.slice(0, 6).map((item) => {
              const existing = draftActions.find((action) => action.sourceQueueItemId === item.id);
              return (
                <article key={item.id}>
                  <div>
                    <span>#{item.rank} · {municipalityName(item.municipalityId)}</span>
                    <strong>{item.title}</strong>
                    <small>{item.requiredNextStep}</small>
                  </div>
                  <div>
                    <Badge tone={item.severity}>{severityLabel[item.severity]}</Badge>
                    <button className="secondary-action" onClick={() => openFromQueue(item)}>{existing ? "Open" : "Create"}</button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="action-studio-panel">
          <div className="action-studio-panel-header">
            <div>
              <p className="eyeless">Workflow store</p>
              <h3>Draft actions</h3>
            </div>
            <Badge tone={draftActions.length ? "healthy" : "watch"}>{draftActions.length} draft</Badge>
          </div>
          <div className="action-studio-list">
            {draftActions.length ? draftActions.slice(0, 6).map((action) => (
              <article key={action.id}>
                <div>
                  <span>{municipalityName(action.municipalityId)} · due {action.dueDate}</span>
                  <strong>{action.title}</strong>
                  <small>Evidence {action.evidenceAttachments?.length ?? 0} · reviewer {action.reviewer}</small>
                </div>
                <div>
                  <Badge tone={action.status}>{actionLabel[action.status]}</Badge>
                  <button className="secondary-action" onClick={() => openDraft(action)}>Studio</button>
                </div>
              </article>
            )) : (
              <div className="action-studio-empty">
                <ClipboardCheck size={18} />
                <p>No draft actions yet. Create one from a queue item to start the workflow.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {studioOpen ? (
        <aside className="action-studio-modal" aria-label="Action Studio modal">
          <form className="action-studio-card" onSubmit={saveAction}>
            <header>
              <div>
                <p className="eyeless">{selectedDraft ? "Edit draft action" : "Create from evidence"}</p>
                <h2>{selectedDraft ? selectedDraft.title : selectedQueue.title}</h2>
                <span>{municipalityName(selectedQueue.municipalityId)} · source-backed workflow</span>
              </div>
              <button type="button" className="assistant-close" aria-label="Close Action Studio" onClick={() => setStudioOpen(false)}><X size={18} /></button>
            </header>

            <section className="action-studio-body">
              <div className="action-studio-main-form">
                <label>Action title<input value={form.title} onChange={(event) => updateForm("title", event.target.value)} /></label>
                <div className="action-studio-form-row">
                  <label>Owner<input value={form.owner} onChange={(event) => updateForm("owner", event.target.value)} /></label>
                  <label>Assigned to<input value={form.assignedTo} onChange={(event) => updateForm("assignedTo", event.target.value)} /></label>
                </div>
                <div className="action-studio-form-row">
                  <label>Reviewer<input value={form.reviewer} onChange={(event) => updateForm("reviewer", event.target.value)} /></label>
                  <label>Due date<input value={form.dueDate} onChange={(event) => updateForm("dueDate", event.target.value)} /></label>
                </div>
                <label>Required evidence, one per line<textarea value={form.requiredEvidenceText} onChange={(event) => updateForm("requiredEvidenceText", event.target.value)} rows={4} /></label>
                <label>Escalation rule<textarea value={form.escalationRule} onChange={(event) => updateForm("escalationRule", event.target.value)} rows={3} /></label>
                <div className="action-studio-form-row">
                  <label>Closure note<textarea value={form.closureNote} onChange={(event) => updateForm("closureNote", event.target.value)} rows={3} /></label>
                  <label>Residual risk<textarea value={form.residualRisk} onChange={(event) => updateForm("residualRisk", event.target.value)} rows={3} /></label>
                </div>

                <section className="action-studio-requirements">
                  <div><p className="eyeless">Evidence checklist</p><h3>What still needs proof</h3></div>
                  {requirements.map((requirement) => {
                    const covered = requirementCovered(requirement, selectedDraft);
                    return (
                      <article className={covered ? "covered" : ""} key={requirement}>
                        <CheckCircle2 size={16} />
                        <span>{requirement}</span>
                      </article>
                    );
                  })}
                </section>
              </div>

              <aside className="action-studio-sidecar">
                <div className="action-studio-score-card">
                  <span>Review readiness</span>
                  <strong>{readinessScore}%</strong>
                  <div className="ui-progress"><span style={{ width: `${readinessScore}%` }} /></div>
                  <p>{selectedDraft ? "Evidence and status changes are saved to the draft workflow store." : "Create the action before evidence can be attached."}</p>
                </div>

                <div className="action-studio-status-grid">
                  {statusOptions.map((status) => (
                    <button key={status} type="button" className={form.status === status ? "active" : ""} onClick={() => transitionStatus(status)} disabled={saving}>{actionLabel[status]}</button>
                  ))}
                </div>

                {selectedDraft?.statusHistory?.length ? (
                  <section className="action-studio-timeline">
                    <h3>Status timeline</h3>
                    {selectedDraft.statusHistory.slice().reverse().slice(0, 5).map((entry) => (
                      <article key={`${entry.status}-${entry.changedAt}`}>
                        <span>{entry.changedAt}</span>
                        <strong>{actionLabel[entry.status]}</strong>
                        <small>{entry.changedBy}{entry.reason ? ` · ${entry.reason}` : ""}</small>
                      </article>
                    ))}
                  </section>
                ) : null}

                <section className="action-studio-proof-box">
                  <div><p className="eyeless">Evidence attachment</p><h3>Submit proof</h3></div>
                  <input value={evidenceForm.label} onChange={(event) => updateEvidence("label", event.target.value)} placeholder="Evidence label or reference" />
                  <input value={evidenceForm.url} onChange={(event) => updateEvidence("url", event.target.value)} placeholder="Optional evidence URL" />
                  <input value={evidenceForm.submittedBy} onChange={(event) => updateEvidence("submittedBy", event.target.value)} placeholder="Submitted by" />
                  <select value={evidenceForm.sourceRefId} onChange={(event) => updateEvidence("sourceRefId", event.target.value)}>
                    <option value="">No source reference</option>
                    {sources.map((source) => <option key={source.id} value={source.id}>{source.label}</option>)}
                  </select>
                  <textarea value={evidenceForm.note} onChange={(event) => updateEvidence("note", event.target.value)} placeholder="Optional reviewer note" rows={3} />
                  <button type="button" className="secondary-action" onClick={attachEvidence} disabled={saving || !selectedDraft}><FilePlus2 size={16} /> Attach evidence</button>
                </section>

                {selectedDraft?.evidenceAttachments?.length ? (
                  <section className="action-studio-proof-list">
                    <h3>Attached evidence</h3>
                    {selectedDraft.evidenceAttachments.map((attachment) => (
                      <article key={attachment.id}>
                        <CheckCircle2 size={15} />
                        <div><strong>{attachment.label}</strong><span>{attachment.submittedBy} · {attachment.submittedAt}</span></div>
                      </article>
                    ))}
                  </section>
                ) : null}

                <section className="action-studio-source-card">
                  <h3>Source chain</h3>
                  {sources.map((source) => (
                    <Link href={source.url ?? "/sources"} key={source.id}><Link2 size={15} /><span>{source.label}</span></Link>
                  ))}
                </section>
              </aside>
            </section>

            <footer>
              <div><Badge tone={form.status}>{actionLabel[form.status]}</Badge><span>{saving ? "Saving..." : message}</span></div>
              <div>
                <button type="button" className="secondary-action" onClick={() => setForm(selectedDraft ? formFromDraft(selectedDraft) : defaultForm(selectedQueue))}><RotateCcw size={16} /> Reset</button>
                <button type="submit" className="primary-action" disabled={saving}>{selectedDraft ? <Save size={16} /> : <Send size={16} />}{selectedDraft ? "Save action" : "Create action"}</button>
              </div>
            </footer>
          </form>
        </aside>
      ) : null}
    </section>
  );
}
