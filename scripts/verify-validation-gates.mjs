import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const extract = JSON.parse(fs.readFileSync(path.join(root, "data", "agsa", "generated", "agsa-report-extract.json"), "utf8"));
const sourceValidation = fs.readFileSync(path.join(root, "lib", "source-validation.ts"), "utf8");
const apiRoute = fs.readFileSync(path.join(root, "app", "api", "v1", "[...resource]", "route.ts"), "utf8");
const financialPulse = fs.readFileSync(path.join(root, "components", "interactive.tsx"), "utf8");
const dataQuality = fs.readFileSync(path.join(root, "app", "admin", "data-quality", "page.tsx"), "utf8");

const unresolved = extract.auditOutcomes.filter((outcome) => {
  const text = `${outcome.opinion} ${outcome.notes}`.toLowerCase();
  return text.includes("cohort") || text.includes("annexure validation") || text.includes("support case");
});

assert(unresolved.length > 0, "Fixture should retain unresolved exact-annexure mappings until official annexures are imported.");
assert(sourceValidation.includes("No separate machine-readable MFMA annexure workbook is present in docs/"), "Annexure gate should state missing machine-readable workbook evidence.");
assert(sourceValidation.includes("Financial Pulse remains locked"), "Treasury validation should keep Financial Pulse locked.");
assert(sourceValidation.includes("source_access"), "Treasury validation should include source access gate.");
assert(sourceValidation.includes("reuse_permission"), "Treasury validation should include reuse gate.");
assert(sourceValidation.includes("schema_fingerprint"), "Treasury validation should include schema gate.");
assert(sourceValidation.includes("formula_version"), "Treasury validation should include formula gate.");
assert(sourceValidation.includes("freshness_sla"), "Treasury validation should include freshness gate.");
assert(sourceValidation.includes("formulaReadiness"), "Treasury validation should expose formula readiness.");
assert(apiRoute.includes('family === "validation"'), "API route should expose validation endpoints.");
assert(financialPulse.includes("treasuryValidation.gates"), "Financial Pulse UI should render Treasury validation gates.");
assert(financialPulse.includes("Missing schema fields"), "Financial Pulse UI should render missing schema fields.");
assert(dataQuality.includes("annexureValidation.gates"), "Data Quality UI should render annexure validation gates.");

console.log(`Validation gates verified: ${unresolved.length} unresolved annexure mapping(s), Treasury locked.`);
