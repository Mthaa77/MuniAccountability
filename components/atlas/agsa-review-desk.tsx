"use client";

import Link from "next/link";
import { CheckCircle2, ClipboardCheck, FileSearch, Filter, Gauge, LockKeyhole, Scale, Search, ShieldAlert, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/client-api";
import { agsaDocuments, agsaExtract, agsaPageCitations, extractionIssues } from "@/lib/pilot-data";
import type { AgsaPageCitation, AgsaReviewDecision, AgsaReviewDecisionStatus } from "@/lib/types";
import { Badge } from "@/components/ui";

type ReviewState = "loading" | "ready" | "saving" | "error";
type ReviewFilter = "all" | "open" | AgsaReviewDecisionStatus;
type ConfidenceFilter = "all" | "needs_review" | "low" | "medium" | "high";

type ReviewItem = {
  key: string;
  documentId: string;
  pageNumber: number;
  issue: string;
  sectionTitle: string;
  textSample: string;
  confidence: Exclude<ConfidenceFilter, "all">;
  citations: AgsaPageCitation[];
};

type CorrectionDraft = {
  replacementField: string;
  replacementValue: string;
  rationale: string;
};

type ReviewerGate = {
  label: string;
  detail: string;
  passed: boolean;
};

const rationaleTemplates = [
  "Accepted after checking citation, page context and source document metadata.",
  "Correction required because the extracted wording does not fully match the source page context.",
  "Excluded from publishable output because the current evidence is incomplete or unsupported.",
  "Reviewer confirmed source citation, but public wording must remain conservative."
];

const correctionFieldPresets = ["auditOutcome", "findingDescription", "citationSnippet", "materialIrregularity", "recommendation", "publicSummary"];

function decisionKey(documentId: string, pageNumber: number, issue: string) {
  return `${documentId}:p${pageNumber}:${issue}`;
}

function confidenceTone(confidence: string) {
  if (confidence === "high") return "healthy";
  if (confidence === "medium") return "watch";
  return "risk";
}

function decisionTone(status: ReviewFilter) {
  if (status === "accepted") return "healthy";
  if (status === "correction") return "watch";
  if (status === "excluded") return "risk";
  return "watch";
}

function confidenceScore(confidence: string) {
  if (confidence === "high") return 30;
  if (confidence === "medium") return 22;
  if (confidence === "low") return 10;
  return 0;
}

function buildReviewItems(): ReviewItem[] {
  return extractionIssues.map((issue) => {
    const page = agsaExtract.pagesByDocument[issue.documentId]?.find((sample) => sample.pageNumber === issue.pageNumber);
    const citations = agsaPageCitations.filter((citation) => citation.documentId === issue.documentId && citation.pageNumber === issue.pageNumber);
    return {
      key: decisionKey(issue.documentId, issue.pageNumber, issue.issue),
      documentId: issue.documentId,
      pageNumber: issue.pageNumber,
      issue: issue.issue,
      sectionTitle: page?.sectionTitle ?? "Unlabelled source page",
      textSample: page?.textSample ?? "No parsed text sample is available for this page yet.",
      confidence: page?.extractionConfidence ?? "needs_review",
      citations
    };
  });
}

function buildReviewerGates(item: ReviewItem | undefined, decision: AgsaReviewDecision | undefined, draft: CorrectionDraft): ReviewerGate[] {
  const hasText = Boolean(item?.textSample && !item.textSample.startsWith("No parsed"));
  const hasCitation = Boolean(item?.citations.length);
  const hasRationale = draft.rationale.trim().length > 18 || Boolean(decision?.rationale);
  const hasCorrectionPath = Boolean(draft.replacementField.trim() && draft.replacementValue.trim()) || decision?.status !== "correction";

  return [
    { label: "Source page inspected", detail: "A reviewer can see the extracted page sample.", passed: hasText },
    { label: "Citation trail present", detail: "The issue has at least one citation ID attached.", passed: hasCitation },
    { label: "Reviewer rationale captured", detail: "A decision should explain why the claim is safe, corrected or excluded.", passed: hasRationale },
    { label: "Correction path ready", detail: "Correction decisions should name the field and replacement value.", passed: Boolean(hasCorrectionPath) }
  ];
}

function publishSafetyScore(item: ReviewItem | undefined, decision: AgsaReviewDecision | undefined, gates: ReviewerGate[]) {
  if (!item) return 0;
  const gatePoints = gates.filter((gate) => gate.passed).length * 12;
  const citationPoints = Math.min(18, item.citations.length * 9);
  const decisionPoints = decision?.status === "accepted" ? 18 : decision?.status === "correction" ? 14 : decision?.status === "excluded" ? 4 : 0;
  return Math.min(100, confidenceScore(item.confidence) + gatePoints + citationPoints + decisionPoints);
}

function decisionPreview(status: AgsaReviewDecisionStatus | "open" | undefined, score: number) {
  if (status === "accepted") return score >= 70 ? "Can support a publish-safe claim with citation." : "Accepted, but reviewer gates still need strengthening.";
  if (status === "correction") return "Can support output only through a correction overlay and conservative wording.";
  if (status === "excluded") return "Blocked from public output. Keep internally for audit trail only.";
  return "Not publish-safe yet. Save a decision after checking source, citation and rationale.";
}

export function AgsaReviewDesk() {
  const reviewItems = useMemo(() => buildReviewItems(), []);
  const documentsById = useMemo(() => new Map(agsaDocuments.map((document) => [document.documentId, document])), []);
  const [state, setState] = useState<ReviewState>("loading");
  const [message, setMessage] = useState("Loading persisted AGSA review decisions...");
  const [decisionsByKey, setDecisionsByKey] = useState<Record<string, AgsaReviewDecision>>({});
  const [selectedKey, setSelectedKey] = useState(reviewItems[0]?.key ?? "");
  const [query, setQuery] = useState("");
  const [documentId, setDocumentId] = useState("all");
  const [decisionFilter, setDecisionFilter] = useState<ReviewFilter>("all");
  const [confidence, setConfidence] = useState<ConfidenceFilter>("all");
  const [draft, setDraft] = useState<CorrectionDraft>({ replacementField: "", replacementValue: "", rationale: "" });

  const selectedItem = reviewItems.find((item) => item.key === selectedKey) ?? reviewItems[0];
  const selectedDocument = selectedItem ? documentsById.get(selectedItem.documentId) : undefined;
  const selectedDecision = selectedItem ? decisionsByKey[selectedItem.key] : undefined;
  const reviewerGates = useMemo(() => buildReviewerGates(selectedItem, selectedDecision, draft), [selectedItem, selectedDecision, draft]);
  const safetyScore = publishSafetyScore(selectedItem, selectedDecision, reviewerGates);
  const blockers = reviewerGates.filter((gate) => !gate.passed);
  const currentDecisionStatus = selectedDecision?.status ?? "open";
  const filteredItems = reviewItems.filter((item) => {
    const document = documentsById.get(item.documentId);
    const status = decisionsByKey[item.key]?.status ?? "open";
    const searchable = `${item.issue} ${item.textSample} ${item.sectionTitle} ${document?.title ?? ""} ${document?.reportYear ?? ""}`.toLowerCase();
    const matchesQuery = searchable.includes(query.toLowerCase());
    const matchesDocument = documentId === "all" || item.documentId === documentId;
    const matchesDecision = decisionFilter === "all" || status === decisionFilter;
    const matchesConfidence = confidence === "all" || item.confidence === confidence;
    return matchesQuery && matchesDocument && matchesDecision && matchesConfidence;
  });
  const stats = {
    total: reviewItems.length,
    accepted: Object.values(decisionsByKey).filter((decision) => decision.status === "accepted").length,
    correction: Object.values(decisionsByKey).filter((decision) => decision.status === "correction").length,
    excluded: Object.values(decisionsByKey).filter((decision) => decision.status === "excluded").length
  };
  const openCount = Math.max(0, stats.total - stats.accepted - stats.correction - stats.excluded);
  const publishSafeCount = stats.accepted + stats.correction;

  useEffect(() => {
    let cancelled = false;

    async function loadDecisions() {
      try {
        const payload = await apiGet<{ decisions?: AgsaReviewDecision[] }>("/v1/agsa/review-decisions");
        if (cancelled) return;
        const decisions = payload.data.decisions ?? [];
        setDecisionsByKey(Object.fromEntries(decisions.map((decision) => [decision.decisionKey, decision])));
        setState("ready");
        setMessage(`${decisions.length} persisted decision(s) loaded from the governance store.`);
      } catch {
        if (cancelled) return;
        setState("error");
        setMessage("Could not load AGSA review decisions.");
      }
    }

    loadDecisions();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedItem) return;
    const decision = decisionsByKey[selectedItem.key];
    setDraft({
      replacementField: decision?.replacementField ?? "",
      replacementValue: decision?.replacementValue ?? "",
      rationale: decision?.rationale ?? ""
    });
  }, [selectedItem?.key, decisionsByKey]);

  useEffect(() => {
    if (!filteredItems.some((item) => item.key === selectedKey)) {
      setSelectedKey(filteredItems[0]?.key ?? reviewItems[0]?.key ?? "");
    }
  }, [filteredItems, reviewItems, selectedKey]);

  function applyTemplate(template: string) {
    setDraft((current) => ({ ...current, rationale: template }));
  }

  function applyFieldPreset(field: string) {
    setDraft((current) => ({ ...current, replacementField: field }));
  }

  async function saveDecision(status: AgsaReviewDecisionStatus) {
    if (!selectedItem) return;

    setState("saving");
    setMessage(`Saving ${status.replaceAll("_", " ")} decision...`);

    try {
      await apiPost("/v1/agsa/review-decisions", {
        decisionKey: selectedItem.key,
        documentId: selectedItem.documentId,
        pageNumber: selectedItem.pageNumber,
        issue: selectedItem.issue,
        status,
        reviewer: "prototype-reviewer",
        citationIds: selectedItem.citations.map((citation) => citation.citationId),
        replacementField: draft.replacementField || undefined,
        replacementValue: draft.replacementValue || undefined,
        rationale: draft.rationale || undefined
      });

      const savedDecision: AgsaReviewDecision = {
        decisionKey: selectedItem.key,
        documentId: selectedItem.documentId,
        pageNumber: selectedItem.pageNumber,
        issue: selectedItem.issue,
        status,
        reviewer: "prototype-reviewer",
        citationIds: selectedItem.citations.map((citation) => citation.citationId),
        decidedAt: new Date().toISOString(),
        replacementField: draft.replacementField || undefined,
        replacementValue: draft.replacementValue || undefined,
        rationale: draft.rationale || undefined
      };

      setDecisionsByKey((current) => ({ ...current, [selectedItem.key]: savedDecision }));
      setState("ready");
      setMessage(`Saved ${status.replaceAll("_", " ")} decision for page ${selectedItem.pageNumber}.`);
    } catch {
      setState("error");
      setMessage("Could not persist this review decision.");
    }
  }

  return (
    <section className="agsa-review-desk">
      <div className="agsa-review-hero ultra">
        <div>
          <p className="eyeless">Step 4</p>
          <h2>AGSA Review Cockpit</h2>
          <p>Inspect low-confidence source pages, confirm citations, write reviewer rationale and save accept, correct or exclude decisions before public claims are allowed.</p>
        </div>
        <div className="agsa-review-state">
          <Badge tone={state === "error" ? "risk" : state === "saving" || state === "loading" ? "watch" : "healthy"}>{state}</Badge>
          <span>{message}</span>
        </div>
      </div>

      <section className="agsa-review-stats" aria-label="AGSA review decision summary">
        <article><span>Open</span><strong>{openCount}</strong><small>Still need human review</small></article>
        <article><span>Accepted</span><strong>{stats.accepted}</strong><small>Can support derived claims</small></article>
        <article><span>Corrections</span><strong>{stats.correction}</strong><small>Need overlay wording</small></article>
        <article><span>Excluded</span><strong>{stats.excluded}</strong><small>Blocked from public output</small></article>
        <article><span>Publish-safe</span><strong>{publishSafeCount}</strong><small>Accepted or corrected</small></article>
      </section>

      <section className="agsa-governance-strip" aria-label="Selected issue governance summary">
        <article>
          <div><Gauge size={18} /><span>Publish safety</span></div>
          <strong>{safetyScore}%</strong>
          <div className="ui-progress"><span style={{ width: `${safetyScore}%` }} /></div>
        </article>
        <article>
          <div><ClipboardCheck size={18} /><span>Reviewer gates</span></div>
          <strong>{reviewerGates.filter((gate) => gate.passed).length}/{reviewerGates.length}</strong>
          <small>{blockers.length ? `${blockers.length} blocker(s) remain` : "All gates passed"}</small>
        </article>
        <article>
          <div><Scale size={18} /><span>Decision preview</span></div>
          <strong>{currentDecisionStatus.replaceAll("_", " ")}</strong>
          <small>{decisionPreview(currentDecisionStatus, safetyScore)}</small>
        </article>
      </section>

      <div className="agsa-review-toolbar">
        <div className="agsa-review-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search issue, source text, report title or year..." /></div>
        <select value={documentId} onChange={(event) => setDocumentId(event.target.value)}>
          <option value="all">All AGSA reports</option>
          {agsaDocuments.map((document) => <option key={document.documentId} value={document.documentId}>{document.reportYear} · {document.title}</option>)}
        </select>
        <select value={decisionFilter} onChange={(event) => setDecisionFilter(event.target.value as ReviewFilter)}>
          <option value="all">All decisions</option>
          <option value="open">Open only</option>
          <option value="accepted">Accepted</option>
          <option value="correction">Corrections</option>
          <option value="excluded">Excluded</option>
        </select>
        <select value={confidence} onChange={(event) => setConfidence(event.target.value as ConfidenceFilter)}>
          <option value="all">All confidence</option>
          <option value="needs_review">Needs review</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div className="agsa-review-layout">
        <aside className="agsa-review-queue">
          <div className="agsa-review-panel-header">
            <div><p className="eyeless">Review queue</p><h3>{filteredItems.length} issue(s)</h3></div>
            <Badge tone="watch"><Filter size={13} /> filtered</Badge>
          </div>
          <div className="agsa-review-list">
            {filteredItems.map((item) => {
              const document = documentsById.get(item.documentId);
              const status = decisionsByKey[item.key]?.status ?? "open";
              return (
                <button className={item.key === selectedItem?.key ? "active" : ""} key={item.key} onClick={() => setSelectedKey(item.key)}>
                  <span>{document?.reportYear ?? "AGSA"} · page {item.pageNumber}</span>
                  <strong>{item.issue}</strong>
                  <small>{document?.title ?? item.documentId}</small>
                  <div><Badge tone={confidenceTone(item.confidence)}>{item.confidence.replaceAll("_", " ")}</Badge><Badge tone={decisionTone(status as ReviewFilter)}>{status}</Badge></div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="agsa-source-viewer ultra-viewer">
          {selectedItem ? (
            <>
              <header>
                <div>
                  <p className="eyeless">Source page viewer</p>
                  <h2>{selectedDocument?.title ?? selectedItem.documentId}</h2>
                  <span>{selectedDocument?.fileName ?? selectedItem.documentId} · page {selectedItem.pageNumber} · {selectedItem.sectionTitle}</span>
                </div>
                <div className="agsa-viewer-badges">
                  <Badge tone={confidenceTone(selectedItem.confidence)}>{selectedItem.confidence.replaceAll("_", " ")}</Badge>
                  <Badge tone={decisionTone((selectedDecision?.status ?? "open") as ReviewFilter)}>{selectedDecision?.status ?? "open"}</Badge>
                </div>
              </header>

              <section className="agsa-review-gates" aria-label="Reviewer gates">
                {reviewerGates.map((gate) => (
                  <article className={gate.passed ? "passed" : "blocked"} key={gate.label}>
                    {gate.passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    <div><strong>{gate.label}</strong><span>{gate.detail}</span></div>
                  </article>
                ))}
              </section>

              <div className="agsa-source-grid">
                <article className="agsa-source-card text-sample">
                  <div><FileSearch size={18} /><strong>Extracted page sample</strong></div>
                  <blockquote>{selectedItem.textSample}</blockquote>
                </article>
                <article className="agsa-source-card issue-card">
                  <div><ShieldAlert size={18} /><strong>Review issue</strong></div>
                  <p>{selectedItem.issue}</p>
                  <small>Review the page context and citations before saving a decision.</small>
                </article>
              </div>

              <section className="agsa-citation-strip ultra-citations">
                <h3>Citations on this page</h3>
                {selectedItem.citations.length ? selectedItem.citations.map((citation) => (
                  <article key={citation.citationId}>
                    <CheckCircle2 size={15} />
                    <div><strong>{citation.citationId}</strong><span>{citation.quoteSnippet ?? "Citation generated without a quote snippet."}</span></div>
                  </article>
                )) : <article><XCircle size={15} /><div><strong>No citation generated</strong><span>This page should stay blocked until a citation is reviewed or created.</span></div></article>}
              </section>

              <section className="agsa-decision-panel ultra-decision">
                <div className="agsa-review-panel-header">
                  <div><p className="eyeless">Decision controls</p><h3>Save review decision</h3></div>
                  <Badge tone={selectedDecision ? decisionTone(selectedDecision.status) : "watch"}>{selectedDecision ? "saved" : "not saved"}</Badge>
                </div>

                <div className="agsa-rationale-templates">
                  <div><Sparkles size={15} /><span>Rationale templates</span></div>
                  {rationaleTemplates.map((template) => <button key={template} onClick={() => applyTemplate(template)}>{template}</button>)}
                </div>

                <div className="agsa-field-presets" aria-label="Correction field presets">
                  <span>Correction field presets</span>
                  <div>{correctionFieldPresets.map((field) => <button key={field} onClick={() => applyFieldPreset(field)}>{field}</button>)}</div>
                </div>

                <div className="agsa-correction-grid">
                  <label>Replacement field<input value={draft.replacementField} onChange={(event) => setDraft((current) => ({ ...current, replacementField: event.target.value }))} placeholder="Example: auditOutcome" /></label>
                  <label>Replacement value<input value={draft.replacementValue} onChange={(event) => setDraft((current) => ({ ...current, replacementValue: event.target.value }))} placeholder="Corrected value" /></label>
                  <label>Reviewer rationale<textarea value={draft.rationale} onChange={(event) => setDraft((current) => ({ ...current, rationale: event.target.value }))} rows={4} placeholder="Explain why this decision is safe." /></label>
                </div>

                <section className="agsa-decision-preview">
                  <div><Scale size={16} /><strong>Public output preview</strong></div>
                  <p>{decisionPreview(currentDecisionStatus, safetyScore)}</p>
                  {blockers.length ? <small>Remaining blockers: {blockers.map((gate) => gate.label).join(", ")}.</small> : <small>All reviewer gates are currently satisfied.</small>}
                </section>

                <div className="agsa-decision-actions">
                  <button className="secondary-action" onClick={() => saveDecision("accepted")}><ShieldCheck size={16} /> Accept</button>
                  <button className="secondary-action" onClick={() => saveDecision("correction")}><Sparkles size={16} /> Needs correction</button>
                  <button className="secondary-action danger" onClick={() => saveDecision("excluded")}><LockKeyhole size={16} /> Exclude</button>
                </div>
              </section>

              <section className="agsa-document-profile">
                <article><span>Report family</span><strong>{selectedDocument?.reportFamily ?? "AGSA"}</strong></article>
                <article><span>Year</span><strong>{selectedDocument?.reportYear ?? "Unknown"}</strong></article>
                <article><span>Quality state</span><strong>{selectedDocument?.qualityState?.replaceAll("_", " ") ?? "Unknown"}</strong></article>
                <article><span>Scope</span><strong>{selectedDocument?.scope ?? "Unknown"}</strong></article>
              </section>

              <Link className="primary-link" href={`/sources/${selectedItem.documentId}`}>Open source document</Link>
            </>
          ) : null}
        </section>
      </div>
    </section>
  );
}
