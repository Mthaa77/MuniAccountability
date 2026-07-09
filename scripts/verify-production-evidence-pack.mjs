import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const toolPath = path.join(root, "tools", "build-production-evidence-pack.mjs");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");
const workflow = fs.readFileSync(path.join(root, ".github", "workflows", "verify.yml"), "utf8");
const gitignore = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
const docs = fs.readFileSync(path.join(root, "docs", "PRODUCTION_READINESS_PREFLIGHT.md"), "utf8");
const policy = fs.readFileSync(path.join(root, "docs", "AGSA_GENERATED_DATA_POLICY.md"), "utf8");
const ledger = fs.readFileSync(path.join(root, "lib", "agsa-readiness-ledger.ts"), "utf8");

const stdout = execFileSync(process.execPath, [toolPath], {
  cwd: root,
  encoding: "utf8"
});
const pack = JSON.parse(stdout);

assert.equal(pack.schemaVersion, "production-evidence-pack-v0.1", "Evidence pack schema version should be stable.");
assert.equal(pack.productionReady, false, "Committed baseline evidence pack should remain locked without external evidence.");
assert.equal(pack.preflight.schemaVersion, "production-readiness-preflight-v0.1", "Evidence pack should embed the preflight report.");
assert.equal(pack.intakeRequirements.length, 3, "Evidence pack should include the three remaining intake gates.");

const gateIds = pack.intakeRequirements.map((requirement) => requirement.gateId);
assert.deepEqual(gateIds, [
  "mfma_annexure_mapping",
  "treasury_financial_pulse_unlock",
  "durable_workflow_store"
]);

for (const requirement of pack.intakeRequirements) {
  assert(requirement.requiredEvidence.length >= 4, `${requirement.gateId} should list concrete required evidence.`);
  assert(requirement.safeValidationCommands.length >= 2, `${requirement.gateId} should list safe validation commands.`);
  assert(requirement.promotionCommand, `${requirement.gateId} should include a promotion command.`);
  assert(requirement.promotionGuardrail, `${requirement.gateId} should include a promotion guardrail.`);
}

assert(
  pack.intakeRequirements
    .find((requirement) => requirement.gateId === "treasury_financial_pulse_unlock")
    ?.promotionGuardrail.includes("Financial Pulse must remain gated"),
  "Treasury intake should preserve the Financial Pulse gate."
);
assert(
  pack.releaseChecklist.some((item) => item.includes("npm run verify")),
  "Release checklist should include full verification."
);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "muni-evidence-pack-"));
const outMessage = execFileSync(process.execPath, [toolPath, "--out-dir", tempDir], {
  cwd: root,
  encoding: "utf8"
});
assert(outMessage.includes("Production evidence pack written"), "--out-dir should write a local evidence pack.");

const expectedFiles = [
  "production-readiness-preflight.json",
  "production-evidence-pack.json",
  "production-evidence-checklist.md"
];
for (const filename of expectedFiles) {
  assert(fs.existsSync(path.join(tempDir, filename)), `${filename} should be written to the evidence pack directory.`);
}

const writtenPack = JSON.parse(fs.readFileSync(path.join(tempDir, "production-evidence-pack.json"), "utf8"));
assert.deepEqual(writtenPack.intakeRequirements.map((requirement) => requirement.gateId), gateIds);
assert(
  fs.readFileSync(path.join(tempDir, "production-evidence-checklist.md"), "utf8").includes("Production evidence pack"),
  "Markdown checklist should be reader-friendly."
);

assert(gitignore.includes("data/agsa/generated/production-evidence-pack.local/"), "Local evidence pack directory should be ignored.");
assert(packageJson.includes('"test:production-evidence"'), "package.json should expose the evidence pack verifier.");
assert(packageJson.includes("test:production-readiness && npm run test:production-evidence"), "npm run verify should run the evidence pack after preflight.");
assert(workflow.includes("Verify production evidence pack"), "CI should run the evidence pack verifier.");
assert(docs.includes("node tools/build-production-evidence-pack.mjs"), "Preflight docs should explain the evidence pack command.");
assert(policy.includes("build-production-evidence-pack"), "Generated data policy should mention evidence pack generation.");
assert(ledger.includes("tools/build-production-evidence-pack.mjs"), "Readiness ledger should cite the evidence pack generator.");

console.log("Production evidence pack verified: operator intake requirements and local artifacts are generated safely.");
