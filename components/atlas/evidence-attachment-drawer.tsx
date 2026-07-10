"use client";

import { CheckCircle2, ClipboardCheck, FilePlus2, Link2, Paperclip, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/client-api";
import { municipalities } from "@/lib/pilot-data";
import type { DraftAction, SourceReference } from "@/lib/types";
import { Badge, actionLabel } from "@/components/ui";

type EvidenceForm = {
  label: string;
  url: string;
  submittedBy: string;
  note: string;
  sourceRefId: string;
};

type IntakeFilter = "all" | "needs_proof" | "with_evidence" | "under_review";

type EvidenceTemplate = {
  label: string;
  note: string;
  sourceHint?: string;
};

const evidenceTemplates: EvidenceTemplate[] = [
  {
    label: "Signed management response",
    note: "Management response received. Reviewer should confirm whether the response directly addresses the audit finding and includes a named accountable owner.",
    sourceHint: "management"
  },
  {
    label: "AGSA citation confirmation",
    note: "AGSA source reference checked. Reviewer should confirm that the cited source supports the action and that wording remains publish-safe.",
    sourceHint: "agsa"
  },
  {
    label: "Owner assignment proof",
    note: "Responsible owner identified. Reviewer should confirm the owner, escalation path and due date before moving this action to review.",
    sourceHint: "owner"
  },
  {
    label: "Remedial action plan",
    note: "Remedial plan submitted. Reviewer should check milestones, timeframes, evidence requirements and remaining residual risk.",
    sourceHint: "plan"
  }
];

function municipalityName(id: string) {
  return municipalities.find((municipality) => municipality.id === id)?.commonName ?? id;
}

function evidenceGap(action: DraftAction) {
  const attached = action.evidenceAttachments?.length ?? 0;
  const required = action.requiredEvidence.length;
  return Math.max(0, required - attached);
}

function readinessLabel(action?: DraftAction) {
  if (!action) return "Select an action";
  const attached = action.evidenceAttachments?.length ?? 0;
  if (!attached) return "Proof needed";
  if (action.status === "under_review") return "Ready for reviewer";
  if (["approved", "closed_with_residual_risk"].includes(action.status)) return "Accepted";
  return "Evidence captured";
}

function attachmentText(action?: DraftAction) {
  return `${action?.evidenceAttachments?.map((attachment) => `${attachment.label} ${attachment.note ?? ""}`).join(" ") ?? ""} ${action?.sourceRefs.map((source) => `${source.label} ${source.source} ${source.location}`).join(" ") ?? ""}`.toLowerCase();
}

function requirementCovered(requirement: string, action?: DraftAction) {
  const haystack = attachmentText(action);
  const keywords = requirement.toLowerCase().split(/\s+/).filter((word) => word.length > 4);
  return keywords.length ? keywords.some((word) => haystack.includes(word)) : (action?.evidenceAttachments?.length ?? 0) > 0;
}

function sourceQualityLabel(source?: SourceReference) {
  return source?.qualityState?.replaceAll("_", " ") ?? "No source selected";
}

function qualityTone(source?: SourceReference) {
  if (!source) return "watch";
  if (source.qualityState === "verified" || source.qualityState === "source_published") return "healthy";
  return "watch";
}

export function EvidenceAttachmentDrawer() {
  const [actions, setActions] = useState<DraftAction[]>([]);
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<IntakeFilter>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("Loading draft actions...");
  const [form, setForm] = useState<EvidenceForm>({
    label: "",
    url: "",
    submittedBy: "Oversight reviewer",
    note: "",
    sourceRefId: ""
  });

  const selectedAction = useMemo(
    () => actions.find((action) => action.id === selectedActionId) ?? actions[0],
    [actions, selectedActionId]
  );
  const selectedSource = selectedAction?.sourceRefs.find((source) => source.id === form.sourceRefId);
  const coveredRequirements = selectedAction?.requiredEvidence.filter((requirement) => requirementCovered(requirement, selectedAction)).length ?? 0;
  const coverageScore = selectedAction?.requiredEvidence.length ? Math.round((coveredRequirements / selectedAction.requiredEvidence.length) * 100) : 0;

  const filteredActions = actions.filter((action) => {
    const searchable = `${action.title} ${municipalityName(action.municipalityId)} ${action.owner} ${action.reviewer} ${action.status}`.toLowerCase();
    const matchesQuery = searchable.includes(query.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "needs_proof" && evidenceGap(action) > 0) ||
      (filter === "with_evidence" && (action.evidenceAttachments?.length ?? 0) > 0) ||
      (filter === "under_review" && action.status === "under_review");
    return matchesQuery && matchesFilter;
  });
  const sortedActions = [...filteredActions].sort((a, b) => evidenceGap(b) - evidenceGap(a));
  const stats = {
    drafts: actions.length,
    needingProof: actions.filter((action) => evidenceGap(action) > 0).length,
    withEvidence: actions.filter((action) => (action.evidenceAttachments?.length ?? 0) > 0).length,
    underReview: actions.filter((action) => action.status === "under_review").length
  };
  const canSubmit = Boolean(selectedAction && form.label.trim());

  useEffect(() => {
    let cancelled = false;

    async function loadActions() {
      try {
        const payload = await apiGet<{ actions?: DraftAction[] }>("/v1/actions/drafts");
        if (cancelled) return;
        const loaded = payload.data.actions ?? [];
        setActions(loaded);
        setSelectedActionId((current) => current ?? loaded[0]?.id ?? null);
        setMessage(loaded.length ? `${loaded.length} draft action(s) ready for evidence intake.` : "Create a draft action in Action Studio first.");
      } catch {
        if (!cancelled) setMessage("Could not load draft actions from the workflow store.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadActions();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      sourceRefId: selectedAction?.sourceRefs[0]?.id ?? ""
    }));
  }, [selectedAction?.id]);

  function updateForm<K extends keyof EvidenceForm>(key: K, value: EvidenceForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openForAction(action: DraftAction) {
    setSelectedActionId(action.id);
    setOpen(true);
  }

  function applyTemplate(template: EvidenceTemplate) {
    const matchedSource = selectedAction?.sourceRefs.find((source) => {
      const haystack = `${source.label} ${source.source} ${source.location}`.toLowerCase();
      return template.sourceHint ? haystack.includes(template.sourceHint) : false;
    });
    setForm((current) => ({
      ...current,
      label: template.label,
      note: template.note,
      sourceRefId: matchedSource?.id ?? current.sourceRefId
    }));
  }

  async function attachEvidence() {
    if (!selectedAction) {
      setMessage("Select a draft action before attaching proof.");
      return;
    }

    const label = form.label.trim();
    if (!label) {
      setMessage("Add an evidence label before submitting.");
      return;
    }

    setSaving(true);
    setMessage("Attaching evidence to the selected action...");

    try {
      const payload = await apiPost<{ action?: DraftAction }>(`/v1/actions/drafts/${selectedAction.id}/evidence`, {
        label,
        url: form.url || undefined,
        submittedBy: form.submittedBy || "Oversight reviewer",
        note: form.note || undefined,
        sourceRefId: form.sourceRefId || undefined
      });
      const saved = payload.data.action;
      if (saved) {
        setActions((current) => current.map((action) => action.id === saved.id ? saved : action));
        setSelectedActionId(saved.id);
        setForm((current) => ({ ...current, label: "", url: "", note: "", sourceRefId: saved.sourceRefs[0]?.id ?? current.sourceRefId }));
        setMessage("Evidence attached. The action has moved forward for review.");
      }
    } catch {
      setMessage("Could not attach evidence. Check the action and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="evidence-intake-console">
      <div className="evidence-intake-hero">
        <div>
          <p className="eyeless">Step 3</p>
          <h2>Evidence Intake Desk</h2>
          <p>Submit proof quickly, link it to the right action, connect it to the source chain and move the item closer to reviewer sign-off.</p>
        </div>
        <div className="evidence-intake-status">
          <Badge tone={loading ? "watch" : actions.length ? "healthy" : "watch"}>{loading ? "loading" : readinessLabel(selectedAction)}</Badge>
          <span>{message}</span>
        </div>
      </div>

      <section className="evidence-intake-stats" aria-label="Evidence intake summary">
        <article><span>Drafts</span><strong>{stats.drafts}</strong><small>Available for evidence</small></article>
        <article><span>Need proof</span><strong>{stats.needingProof}</strong><small>Required evidence still missing</small></article>
        <article><span>With evidence</span><strong>{stats.withEvidence}</strong><small>Proof already attached</small></article>
        <article><span>Under review</span><strong>{stats.underReview}</strong><small>Waiting for reviewer sign-off</small></article>
      </section>

      <div className="evidence-intake-toolbar">
        <div>
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search draft actions by municipality, owner, reviewer or status..." />
        </div>
        <select value={filter} onChange={(event) => setFilter(event.target.value as IntakeFilter)}>
          <option value="all">All intake items</option>
          <option value="needs_proof">Need proof</option>
          <option value="with_evidence">With evidence</option>
          <option value="under_review">Under review</option>
        </select>
        <button className="primary-action" onClick={() => selectedAction ? openForAction(selectedAction) : setOpen(true)} disabled={!selectedAction}>
          <Paperclip size={16} /> Submit evidence
        </button>
      </div>

      <div className="evidence-action-grid">
        {sortedActions.length ? sortedActions.slice(0, 8).map((action) => {
          const gap = evidenceGap(action);
          const attached = action.evidenceAttachments?.length ?? 0;
          return (
            <article className="evidence-action-card" key={action.id}>
              <div>
                <span>{municipalityName(action.municipalityId)} · due {action.dueDate}</span>
                <strong>{action.title}</strong>
                <small>{gap ? `${gap} required item(s) still need proof` : "Required evidence has an attachment path"}</small>
              </div>
              <div className="evidence-card-proof-meter">
                <span>Proof packet</span>
                <strong>{attached}/{action.requiredEvidence.length}</strong>
              </div>
              <div className="evidence-action-card-footer">
                <Badge tone={action.status}>{actionLabel[action.status]}</Badge>
                <button className="secondary-action" onClick={() => openForAction(action)}>Attach proof</button>
              </div>
            </article>
          );
        }) : (
          <div className="evidence-empty-state">
            <ShieldCheck size={20} />
            <p>No matching draft actions yet. Create an action in Action Studio, then return here to attach proof.</p>
          </div>
        )}
      </div>

      {open ? (
        <aside className="evidence-drawer-backdrop" aria-label="Evidence attachment drawer">
          <div className="evidence-drawer-card">
            <header>
              <div>
                <p className="eyeless">Submit proof</p>
                <h2>{selectedAction?.title ?? "Evidence intake"}</h2>
                <span>{selectedAction ? `${municipalityName(selectedAction.municipalityId)} · ${readinessLabel(selectedAction)}` : "Select an action before submission"}</span>
              </div>
              <button className="assistant-close" aria-label="Close evidence drawer" onClick={() => setOpen(false)}><X size={18} /></button>
            </header>

            <section className="evidence-drawer-body">
              <div className="evidence-drawer-form">
                <section className="evidence-packet-score">
                  <div>
                    <p className="eyeless">Proof packet coverage</p>
                    <h3>{coverageScore}% covered</h3>
                  </div>
                  <div className="ui-progress"><span style={{ width: `${coverageScore}%` }} /></div>
                  <p>{coveredRequirements} of {selectedAction?.requiredEvidence.length ?? 0} required evidence item(s) appear covered by attachments or source references.</p>
                </section>

                <section className="evidence-template-grid" aria-label="Evidence templates">
                  <div>
                    <Sparkles size={16} />
                    <span>Quick proof templates</span>
                  </div>
                  {evidenceTemplates.map((template) => (
                    <button type="button" key={template.label} onClick={() => applyTemplate(template)}>{template.label}</button>
                  ))}
                </section>

                <label>Evidence label<input value={form.label} onChange={(event) => updateForm("label", event.target.value)} placeholder="Example: Signed management response" /></label>
                <label>Evidence URL<input value={form.url} onChange={(event) => updateForm("url", event.target.value)} placeholder="Optional link to document, folder or source" /></label>
                <label>Submitted by<input value={form.submittedBy} onChange={(event) => updateForm("submittedBy", event.target.value)} /></label>
                <label>Source reference<select value={form.sourceRefId} onChange={(event) => updateForm("sourceRefId", event.target.value)}>
                  <option value="">No source reference</option>
                  {selectedAction?.sourceRefs.map((source) => <option key={source.id} value={source.id}>{source.label}</option>)}
                </select></label>
                {selectedSource ? (
                  <section className="selected-source-preview">
                    <div><Badge tone={qualityTone(selectedSource)}>{sourceQualityLabel(selectedSource)}</Badge><strong>{selectedSource.label}</strong></div>
                    <p>{selectedSource.source} · {selectedSource.period} · {selectedSource.location}</p>
                  </section>
                ) : null}
                <label>Reviewer note<textarea value={form.note} onChange={(event) => updateForm("note", event.target.value)} rows={4} placeholder="Explain what the proof shows and what should be checked next." /></label>
                <button className="primary-action" onClick={attachEvidence} disabled={saving || !canSubmit}>
                  <FilePlus2 size={16} /> {saving ? "Submitting..." : canSubmit ? "Attach evidence" : "Add label first"}
                </button>
              </div>

              <aside className="evidence-drawer-sidecar">
                <section>
                  <h3>Required evidence</h3>
                  {selectedAction?.requiredEvidence.map((requirement) => {
                    const covered = requirementCovered(requirement, selectedAction);
                    return <article className={covered ? "covered" : ""} key={requirement}><CheckCircle2 size={15} /><span>{requirement}</span></article>;
                  })}
                </section>

                <section>
                  <h3>Source chain</h3>
                  {selectedAction?.sourceRefs.map((source) => (
                    <Link href={source.url ?? "/sources"} key={source.id}><Link2 size={15} /><span>{source.label}</span></Link>
                  ))}
                </section>

                {selectedAction?.evidenceAttachments?.length ? (
                  <section>
                    <h3>Existing attachments</h3>
                    {selectedAction.evidenceAttachments.map((attachment) => (
                      <article key={attachment.id}><Paperclip size={15} /><span>{attachment.label}</span></article>
                    ))}
                  </section>
                ) : (
                  <section>
                    <h3>No attachments yet</h3>
                    <article><ClipboardCheck size={15} /><span>Use the form to submit the first proof item for this action.</span></article>
                  </section>
                )}
              </aside>
            </section>
          </div>
        </aside>
      ) : null}
    </section>
  );
}
