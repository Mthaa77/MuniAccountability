import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const helperPath = path.join(root, "lib", "treasury-validation.ts");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data", "treasury", "validation", "municipal-money-validation-manifest.json"), "utf8"));
const formulas = JSON.parse(fs.readFileSync(path.join(root, "data", "treasury", "validation", "financial-pulse-formulas.json"), "utf8"));
const sourceValidation = fs.readFileSync(path.join(root, "lib", "source-validation.ts"), "utf8");
const financialPulseUi = fs.readFileSync(path.join(root, "components", "interactive.tsx"), "utf8");

assert.equal(formulas.schemaVersion, "financial-pulse-formulas-v0.1", "Unexpected formula registry schema.");
assert.equal(formulas.status, "draft", "Committed formula registry should remain draft until validated.");
assert(formulas.formulas.length >= 4, "Expected candidate Financial Pulse formulas.");
assert(formulas.formulas.every((formula) => formula.displayGate === "blocked_until_validated"), "Candidate formulas must stay display-blocked.");
assert.equal(manifest.unlockDecision.status, "locked", "Treasury validation manifest should remain locked.");
assert(sourceValidation.includes("financialPulseFormulaRegistry"), "Source validation should import formula registry.");
assert(financialPulseUi.includes("Formula readiness"), "Financial Pulse UI should show formula readiness.");

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "treasury-validation-"));
try {
  execFileSync(
    process.execPath,
    [
      path.join(root, "node_modules", "typescript", "bin", "tsc"),
      helperPath,
      "--target",
      "es2020",
      "--module",
      "es2020",
      "--moduleResolution",
      "bundler",
      "--skipLibCheck",
      "--outDir",
      tmpDir
    ],
    { cwd: root, stdio: "pipe" }
  );
  fs.writeFileSync(path.join(tmpDir, "package.json"), JSON.stringify({ type: "module" }), "utf8");
  const { canUnlockFinancialPulse } = await import(pathToFileURL(path.join(tmpDir, "treasury-validation.js")).href);

  const locked = canUnlockFinancialPulse(manifest, formulas);
  assert.equal(locked.unlocked, false, "Committed manifest and draft formulas must not unlock Financial Pulse.");
  assert.equal(locked.formulaReadiness.publishable, false, "Draft formulas must not be publishable.");
  assert(locked.formulaReadiness.missingFormulaMetrics.length >= 4, "Draft registry should report missing validated formula metrics.");

  const validatedFormulas = {
    ...formulas,
    status: "validated",
    formulas: formulas.formulas.map((formula) => ({ ...formula, status: "validated", displayGate: "publishable" }))
  };
  const requiredFields = Array.from(new Set(validatedFormulas.formulas.flatMap((formula) => formula.requiredFields)));
  const unlockedManifest = {
    ...manifest,
    status: "unlocked",
    connector: { ...manifest.connector, status: "validated", lastProbeStatus: "200 OK" },
    reuseReview: { ...manifest.reuseReview, status: "approved" },
    schemaFingerprint: {
      ...manifest.schemaFingerprint,
      status: "validated",
      fingerprint: "fixture",
      validatedFields: requiredFields
    },
    formulaVersions: validatedFormulas.formulas.map((formula) => ({
      id: formula.id,
      metric: formula.metric,
      version: formula.version,
      expression: formula.expression
    })),
    freshness: { ...manifest.freshness, status: "validated", expectedCadence: "monthly", staleAfterDays: 45 },
    unlockDecision: { ...manifest.unlockDecision, status: "unlocked", decidedBy: "fixture", decidedAt: "2026-07-08T00:00:00.000Z" }
  };
  const unlocked = canUnlockFinancialPulse(unlockedManifest, validatedFormulas);
  assert.equal(unlocked.unlocked, true, "Fully validated manifest and formula registry should unlock Financial Pulse.");
  assert.equal(unlocked.formulaReadiness.missingSchemaFields.length, 0, "Validated fixture should have no missing schema fields.");
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log("Treasury validation verified: draft formulas stay locked; fully validated fixture can unlock.");
