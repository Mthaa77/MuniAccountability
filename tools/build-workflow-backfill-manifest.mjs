import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const generatedDir = path.join(root, "data", "agsa", "generated");
const reviewPath = path.join(generatedDir, "agsa-review-decisions.json");
const draftPath = path.join(generatedDir, "draft-actions.json");
const outPath = path.join(generatedDir, "workflow-backfill-manifest.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function normalizeDraftAction(action) {
  const createdAt = action.createdAt ?? new Date(0).toISOString();
  const statusHistory = Array.isArray(action.statusHistory) && action.statusHistory.length
    ? action.statusHistory
    : [{ status: action.status ?? "not_started", changedAt: createdAt, changedBy: "system", reason: "Backfilled from local JSON store" }];

  return {
    id: action.id,
    tenantId: "prototype",
    municipalityId: action.municipalityId,
    title: action.title,
    linkedFinding: action.linkedFinding ?? "",
    owner: action.owner ?? "Oversight analyst",
    reviewer: action.reviewer ?? "Oversight reviewer",
    assignedTo: action.assignedTo ?? action.owner ?? "Oversight analyst",
    dueDate: action.dueDate ?? null,
    status: action.status ?? "not_started",
    requiredEvidence: action.requiredEvidence ?? [],
    escalationRule: action.escalationRule ?? "",
    sourceRefs: action.sourceRefs ?? [],
    sourceQueueItemId: action.sourceQueueItemId ?? null,
    sourceFindingId: action.sourceFindingId ?? null,
    evidenceAttachments: action.evidenceAttachments ?? [],
    statusHistory,
    closureNote: action.closureNote ?? null,
    residualRisk: action.residualRisk ?? null,
    sourceStoreSchema: "draft-actions-v0.1",
    createdAt,
    updatedAt: action.updatedAt ?? createdAt
  };
}

function normalizeReviewDecision(decision) {
  return {
    decisionKey: decision.decisionKey,
    tenantId: "prototype",
    documentId: decision.documentId,
    pageNumber: decision.pageNumber,
    issue: decision.issue,
    status: decision.status,
    reviewer: decision.reviewer,
    decidedAt: decision.decidedAt,
    citationIds: decision.citationIds ?? [],
    rationale: decision.rationale ?? null,
    replacementText: decision.replacementText ?? null,
    replacementField: decision.replacementField ?? null,
    replacementValue: decision.replacementValue ?? null,
    sourceStoreSchema: "agsa-review-decisions-v0.1"
  };
}

const reviewStore = readJson(reviewPath);
const draftStore = readJson(draftPath);
const reviewRows = (reviewStore.decisions ?? []).map(normalizeReviewDecision);
const draftRows = (draftStore.actions ?? []).map(normalizeDraftAction);

const manifest = {
  schemaVersion: "workflow-backfill-manifest-v0.1",
  generatedAt: new Date().toISOString(),
  sourceProvider: "local_json",
  targetProvider: "database",
  sourceSnapshot: {
    reviewDecisions: {
      path: "data/agsa/generated/agsa-review-decisions.json",
      schemaVersion: reviewStore.schemaVersion,
      sha256: sha256(reviewPath)
    },
    draftActions: {
      path: "data/agsa/generated/draft-actions.json",
      schemaVersion: draftStore.schemaVersion,
      sha256: sha256(draftPath)
    }
  },
  rowCounts: {
    reviewDecisions: reviewRows.length,
    draftActions: draftRows.length
  },
  parityChecks: [
    "GET /api/v1/agsa/review-decisions returns the same decision count before and after migration.",
    "GET /api/v1/actions/drafts returns the same draft action count before and after migration.",
    "POST /api/v1/actions/drafts/{id}/transition appends exactly one status history entry.",
    "POST /api/v1/actions/drafts/{id}/evidence preserves source references and moves not_started/in_progress drafts to evidence_submitted."
  ],
  reviewDecisionRows: reviewRows,
  draftActionRows: draftRows
};

fs.writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Wrote ${path.relative(root, outPath)} with ${reviewRows.length} review row(s) and ${draftRows.length} draft row(s).`);
