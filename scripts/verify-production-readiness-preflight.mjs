import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const toolPath = path.join(root, "tools", "run-production-readiness-preflight.mjs");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");
const workflow = fs.readFileSync(path.join(root, ".github", "workflows", "verify.yml"), "utf8");
const ledger = fs.readFileSync(path.join(root, "lib", "agsa-readiness-ledger.ts"), "utf8");
const docs = fs.readFileSync(path.join(root, "docs", "PRODUCTION_READINESS_PREFLIGHT.md"), "utf8");

const stdout = execFileSync(process.execPath, [toolPath], {
  cwd: root,
  encoding: "utf8"
});
const report = JSON.parse(stdout);

assert.equal(report.schemaVersion, "production-readiness-preflight-v0.1", "Preflight schema version should be stable.");
assert.equal(report.productionReady, false, "Current repo state should not be production-ready without external evidence.");
assert.equal(report.gates.length, 3, "Preflight should summarize the three remaining external gates.");

const gateIds = report.gates.map((gate) => gate.id);
assert.deepEqual(gateIds, [
  "mfma_annexure_mapping",
  "treasury_financial_pulse_unlock",
  "durable_workflow_store"
]);

for (const gate of report.gates) {
  assert.equal(gate.readyForProduction, false, `${gate.id} should remain locked in the committed baseline.`);
  assert(gate.externalDependency, `${gate.id} should name its external dependency.`);
  assert(gate.checks.length > 0, `${gate.id} should include check-level evidence.`);
  assert(
    gate.checks.every((check) => check.evidence && check.nextStep),
    `${gate.id} should include evidence and next steps for every check.`
  );
}

assert.equal(report.externalDependencies.length, 3, "Each incomplete gate should appear in externalDependencies.");
assert(
  report.externalDependencies.some((dependency) => dependency.dependency.includes("AGSA MFMA")),
  "Preflight should name the official MFMA annexure dependency."
);
assert(
  report.externalDependencies.some((dependency) => dependency.dependency.includes("Validated connector")),
  "Preflight should name the Treasury validation dependency."
);
assert(
  report.externalDependencies.some((dependency) => dependency.dependency.includes("Hosted database provider")),
  "Preflight should name the durable workflow database dependency."
);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "muni-preflight-"));
const outPath = path.join(tempDir, "preflight.json");
const outMessage = execFileSync(process.execPath, [toolPath, "--out", outPath], {
  cwd: root,
  encoding: "utf8"
});
assert(outMessage.includes("Production readiness preflight written"), "--out should write a review artifact.");
assert.deepEqual(JSON.parse(fs.readFileSync(outPath, "utf8")).gates.map((gate) => gate.id), gateIds);

assert(packageJson.includes('"test:production-readiness"'), "package.json should expose the preflight verifier.");
assert(packageJson.includes("test:production-readiness && npm run typecheck"), "npm run verify should include the preflight before typecheck.");
assert(workflow.includes("Verify production readiness preflight"), "CI should run the preflight verifier.");
assert(ledger.includes("tools/run-production-readiness-preflight.mjs"), "Readiness ledger should cite the preflight tool.");
assert(docs.includes("node tools/run-production-readiness-preflight.mjs"), "Docs should show the preflight command.");
assert(docs.includes("productionReady: false"), "Docs should explain the current locked baseline.");

console.log("Production readiness preflight verified: external gates are consolidated and remain locked without evidence.");
