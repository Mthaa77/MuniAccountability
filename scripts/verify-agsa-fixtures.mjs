import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const extractPath = path.join(root, "data", "agsa", "generated", "agsa-report-extract.json");
const extract = JSON.parse(fs.readFileSync(extractPath, "utf8"));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const citationIds = new Set(extract.pageCitations.map((citation) => citation.citationId));
const cleanOutcome = extract.auditOutcomes.find((outcome) => outcome.auditeeId === "ZA_WC_CPT" && outcome.cleanAuditFlag);
const regressedOutcome = extract.auditOutcomes.find(
  (outcome) => outcome.auditeeId === "ZA_GP_EKU" && outcome.movement === "regressed"
);
const unresolvedMi = extract.materialIrregularities.find((mi) => !mi.status.toLowerCase().includes("resolved"));
const waterInitiative = extract.initiatives.find((initiative) => initiative.initiativeType === "water");
const disasterInitiative = extract.initiatives.find((initiative) => initiative.initiativeType === "disaster_relief");

assert(extract.schemaVersion === "agsa-extract-v0.1", "Unexpected AGSA extract schema version.");
assert(extract.documents.length >= 14, "Expected at least 14 AGSA source documents.");
assert(extract.pageCitations.length >= 100, "Expected page-level citations from the PDF corpus.");
assert(citationIds.has("cit_mfma_2024_25_p7"), "Missing latest MFMA baseline citation.");
assert(citationIds.has("cit_water_p10"), "Missing water value chain special-report citation.");
assert(citationIds.has("cit_flood_p7"), "Missing flood relief special-report citation.");
assert(citationIds.has("cit_mi_status_p5"), "Missing material irregularity status citation.");
assert(cleanOutcome, "Expected one clean-audit fixture outcome.");
assert(regressedOutcome, "Expected one regressed municipality fixture outcome.");
assert(unresolvedMi, "Expected one unresolved or active material irregularity fixture.");
assert(waterInitiative, "Expected a water initiative fixture.");
assert(disasterInitiative, "Expected a disaster relief initiative fixture.");

const publicUnsafeKeys = ["internalNotes", "restrictedEvidence", "workflowNotes"];
for (const profile of extract.auditees) {
  for (const key of publicUnsafeKeys) {
    assert(!(key in profile), `Auditee fixture leaks public-unsafe key: ${key}`);
  }
}

console.log(
  `AGSA fixtures verified: ${extract.documents.length} documents, ${extract.pageCitations.length} citations, ` +
    `${extract.findings.length} findings, ${extract.materialIrregularities.length} MIs.`
);
