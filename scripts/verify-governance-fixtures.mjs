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
    citationIds: []
  }
];
const stats = governanceStats(extract.extractionIssues.length, sampleDecisions);
const excludedCitationIds = new Set(sampleDecisions.filter((decision) => decision.status !== "accepted").flatMap((decision) => decision.citationIds));
const cptOutcome = extract.auditOutcomes.find((outcome) => outcome.auditeeId === "ZA_WC_CPT");
const publicSafe = !excludedCitationIds.has(cptOutcome.citationId);
const finding = extract.findings[0];
const draftAction = {
  id: `draft_qi_finding_${finding.findingId}`,
  sourceFindingId: finding.findingId,
  sourceQueueItemId: `qi_finding_${finding.findingId}`,
  municipalityId: "ZA_GP_EKU",
  title: `Resolve: ${finding.subtheme}`
};

assert(reviewStore.schemaVersion === "agsa-review-decisions-v0.1", "Unexpected review-decision store schema.");
assert(draftStore.schemaVersion === "draft-actions-v0.1", "Unexpected draft-action store schema.");
assert(stats.open === extract.extractionIssues.length - 3, "Review decisions should reduce open exception counts.");
assert(stats.blockers === 1, "Correction decisions should count as blockers.");
assert(publicSafe === false, "Excluded citation should not be public safe.");
assert(draftAction.sourceFindingId === finding.findingId, "Draft action should preserve source finding id.");
assert(finding.citationId, "Finding detail fixture should include citation id.");

console.log(
  `Governance fixtures verified: ${stats.open} open after sample decisions, ${stats.blockers} blocker, ` +
    `draft ${draftAction.id}.`
);
