import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const toolPath = path.join(root, "tools", "prepare-production-gate-inputs.mjs");
const mfmaTemplate = fs.readFileSync(path.join(root, "docs", "templates", "mfma-annexure-template.csv"), "utf8");
const treasuryTemplate = JSON.parse(fs.readFileSync(path.join(root, "docs", "templates", "treasury-schema-snapshot-template.json"), "utf8"));
const workflowTemplate = fs.readFileSync(path.join(root, "docs", "templates", "workflow-migration-evidence-template.md"), "utf8");
const workflowTemplateLower = workflowTemplate.toLowerCase();
const gitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");
const workflow = fs.readFileSync(path.join(root, ".github", "workflows", "verify.yml"), "utf8");
const evidenceModel = fs.readFileSync(path.join(root, "lib", "production-evidence.ts"), "utf8");

assert(
  mfmaTemplate.startsWith("municipality_code,municipality_name,financial_year,audit_outcome,movement,source_document,source_page"),
  "MFMA annexure template should expose the required importer columns."
);
assert.equal(treasuryTemplate.schemaVersion, "municipal-money-schema-snapshot-v0.1", "Treasury schema template should have a stable schema version.");
const treasuryFields = treasuryTemplate.fields.map((field) => field.name);
for (const requiredField of [
  "municipality_code",
  "period",
  "cash_balance",
  "average_monthly_operating_expenditure",
  "creditors",
  "operating_revenue",
  "capital_spend",
  "capital_budget",
  "cash_collected",
  "billed_revenue"
]) {
  assert(treasuryFields.includes(requiredField), `Treasury schema template should include ${requiredField}.`);
}
assert(workflowTemplate.includes("API Parity Smoke"), "Workflow migration evidence template should include API parity smoke checks.");
assert(workflowTemplateLower.includes("credentials location: configured outside repository"), "Workflow template should keep credentials outside the repository.");
assert(workflowTemplateLower.includes("do not paste credentials"), "Workflow template should warn against committing secrets.");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "muni-gate-inputs-"));
const message = execFileSync(process.execPath, [toolPath, "--out-dir", tempDir], {
  cwd: root,
  encoding: "utf8"
});
assert(message.includes("Production gate input templates written"), "Input prep tool should write templates.");

const expectedFiles = [
  "mfma-annexure-input.csv",
  "treasury-schema-snapshot.json",
  "workflow-migration-evidence.md",
  "production-gate-inputs-manifest.json"
];
for (const file of expectedFiles) {
  assert(fs.existsSync(path.join(tempDir, file)), `${file} should be copied into the local input directory.`);
}
const manifest = JSON.parse(fs.readFileSync(path.join(tempDir, "production-gate-inputs-manifest.json"), "utf8"));
assert.equal(manifest.schemaVersion, "production-gate-inputs-v0.1", "Input manifest should have a stable schema version.");
assert.equal(manifest.status, "local_templates_only", "Input manifest should not claim production evidence is validated.");
assert.equal(manifest.copiedFiles.length, 3, "Input manifest should track all three gate templates.");
assert(manifest.warning.includes("do not unlock production readiness"), "Input manifest should warn that templates do not unlock gates.");

assert(gitignore.includes("data/agsa/generated/production-gate-inputs.local/"), "Default local gate input directory should be ignored.");
assert(packageJson.includes('"test:production-gate-inputs"'), "package.json should expose the input template verifier.");
assert(packageJson.includes("test:production-gate-inputs && npm run test:production-readiness"), "npm run verify should run input template verification before readiness checks.");
assert(workflow.includes("Verify production gate input templates"), "CI should run input template verification.");
assert(evidenceModel.includes("docs/templates/mfma-annexure-template.csv"), "Evidence model should point operators to MFMA template.");
assert(evidenceModel.includes("tools/prepare-production-gate-inputs.mjs"), "Evidence model should include the local input prep command.");

console.log("Production gate inputs verified: templates and local prep workflow are present without unlocking external gates.");
