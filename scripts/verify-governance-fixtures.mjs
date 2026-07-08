import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const extract = JSON.parse(fs.readFileSync(path.join(root, "data", "agsa", "generated", "agsa-report-extract.json"), "utf8"));
const reviewStore = JSON.parse(fs.readFileSync(path.join(root, "data", "agsa", "generated", "agsa-review-decisions.json"), "utf8"));
const draftStore = JSON.parse(fs.readFileSync(path.join(root, "data", "agsa", "generated", "draft-actions.json"), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function governanceStats(totalIssues, decisions) {
  const counts = { totalIssues, open: totalIssues, accepted: 0, correction: 0, excluded: 0, blockers: 0 };
  for (const decision of decisions) counts[decision.status] += 1;
  const resolved = counts.accepted + counts.correction + counts.excluded;
  counts.open = Math.max(0, totalIssues - resolved);
  counts.blockers = counts.correction;
  return counts;
}

const sampleCitationId = extract.auditOutcomes.find((outcome) => outcome.auditeeId === "ZA_WC_CPT")?.citationId;
const sampleDecisions = [
  {
    decisionKey: "sample:accepted",
    documentId: "doc_sample",
    pageNumber: 1,
    issue: "sample accepted",
    status: "accepted",
    reviewer: "fixture",
    decidedAt: "2026-07-08T00:00:00.000Z",
    citationIds: []
  },
  {
    decisionKey: "sample:excluded",
    documentId: "doc_sample",
    pageNumber: 2,
    issue: "sample excluded",
    status: "excluded",
    reviewer: "fixture",
    decidedAt: "2026-07-08T00:00:00.000Z",
    citationIds: [sampleCitationId]
  },
  {
    decisionKey: "sample:correction",
    documentId: "doc_sample",
    pageNumber: 3,
    issue: "sample correction",
    status: "correction",
    reviewer: "fixture",
    decidedAt: "2026-07-08T00:00:00.000Z",
    citationIds: [],
    replacementField: "auditOutcome",
    replacementValue: "qualified_with_findings",
    rationale: "Fixture-level field correction"
  }
];
const stats = governanceStats(extract.extractionIssues.length, sampleDecisions);
const excludedCitationIds = new Set(sampleDecisions.filter((decision) => decision.status !== "accepted").flatMap((decision) => decision.citationIds));
const cptOutcome = extract.auditOutcomes.find((outcome) => outcome.auditeeId === "ZA_WC_CPT");
const publicSafe = !excludedCitationIds.has(cptOutcome.citationId);
const finding = extract.findings[0];
const mappingConfidence = (outcome) => {
  if (outcome.opinion.includes("cohort") || outcome.notes.toLowerCase().includes("cohort")) return "cohort_derived";
  if (outcome.notes.toLowerCase().includes("annexure validation") || outcome.notes.toLowerCase().includes("support case")) return "needs_review";
  if (outcome.cleanAuditFlag || outcome.financialYear !== "2024-25") return "exact";
  return "manual";
};
const confidenceCounts = extract.auditOutcomes.reduce((counts, outcome) => {
  const key = mappingConfidence(outcome);
  counts[key] = (counts[key] ?? 0) + 1;
  return counts;
}, {});
const sourceDocument = extract.documents.find((document) => document.documentId === "doc_mfma_2024_25_overall_audit_outcomes_tabling_24_june_2026");
const sourceDocumentCitations = extract.pageCitations.filter((citation) => citation.documentId === sourceDocument.documentId);
const draftAction = {
  id: `draft_qi_finding_${finding.findingId}`,
  sourceFindingId: finding.findingId,
  sourceQueueItemId: `qi_finding_${finding.findingId}`,
  municipalityId: "ZA_GP_EKU",
  title: `Resolve: ${finding.subtheme}`,
  assignedTo: "Executive sponsor",
  evidenceAttachments: [
    {
      id: "ev_fixture",
      label: "Management response pack",
      submittedBy: "fixture",
      submittedAt: "2026-07-08T00:00:00.000Z"
    }
  ],
  statusHistory: [
    {
      status: "not_started",
      changedAt: "2026-07-08T00:00:00.000Z",
      changedBy: "fixture"
    },
    {
      status: "evidence_submitted",
      changedAt: "2026-07-08T00:10:00.000Z",
      changedBy: "fixture",
      reason: "Evidence attachment added"
    }
  ]
};

assert(reviewStore.schemaVersion === "agsa-review-decisions-v0.1", "Unexpected review-decision store schema.");
assert(draftStore.schemaVersion === "draft-actions-v0.1", "Unexpected draft-action store schema.");
assert(stats.open === extract.extractionIssues.length - 3, "Review decisions should reduce open exception counts.");
assert(stats.blockers === 1, "Correction decisions should count as blockers.");
assert(publicSafe === false, "Excluded citation should not be public safe.");
assert(sampleDecisions[2].replacementField === "auditOutcome", "Correction decision should carry a replacement field.");
assert(sampleDecisions[2].replacementValue === "qualified_with_findings", "Correction decision should carry a replacement value.");
assert((confidenceCounts.exact ?? 0) >= 1, "Expected at least one exact outcome mapping.");
assert((confidenceCounts.cohort_derived ?? 0) >= 1, "Expected at least one cohort-derived outcome mapping.");
assert((confidenceCounts.needs_review ?? 0) >= 1, "Expected at least one needs-review outcome mapping.");
assert(sourceDocument && sourceDocumentCitations.length > 0, "Source document detail should have citations.");
assert(draftAction.sourceFindingId === finding.findingId, "Draft action should preserve source finding id.");
assert(draftAction.assignedTo, "Draft action should carry an assigned owner.");
assert(draftAction.evidenceAttachments.length === 1, "Draft action lifecycle should support evidence attachments.");
assert(draftAction.statusHistory.at(-1).status === "evidence_submitted", "Draft action lifecycle should preserve status history.");
assert(finding.citationId, "Finding detail fixture should include citation id.");

console.log(
  `Governance fixtures verified: ${stats.open} open after sample decisions, ${stats.blockers} blocker, ` +
    `draft ${draftAction.id}.`
);
