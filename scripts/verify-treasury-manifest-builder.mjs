import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const committedManifestPath = path.join(root, "data", "treasury", "validation", "municipal-money-validation-manifest.json");
const committedBefore = fs.readFileSync(committedManifestPath, "utf8");
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "treasury-manifest-builder-"));

function runBuilder(args) {
  return execFileSync(process.execPath, ["tools/build-treasury-validation-manifest.mjs", ...args], {
    cwd: root,
    encoding: "utf8"
  });
}

try {
  const schemaPath = path.join(tmpDir, "schema.json");
  const outPath = path.join(tmpDir, "treasury-manifest.json");
  const formulasPath = path.join(tmpDir, "formulas.json");
  const requiredFields = [
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
  ];
  fs.writeFileSync(schemaPath, JSON.stringify({ fields: requiredFields }, null, 2), "utf8");

  const dryRun = runBuilder(["--schema-snapshot", schemaPath, "--connector-status", "validated", "--dry-run"]);
  const dryRunManifest = JSON.parse(dryRun);
  assert.equal(dryRunManifest.status, "blocked", "Dry-run should stay blocked without reuse, formulas and freshness.");
  assert.equal(dryRunManifest.schemaFingerprint.status, "validated", "Dry-run should validate complete schema snapshot.");
  assert.equal(dryRunManifest.unlockDecision.status, "locked", "Dry-run should not unlock without every gate.");

  const formulaRegistry = JSON.parse(
    fs.readFileSync(path.join(root, "data", "treasury", "validation", "financial-pulse-formulas.json"), "utf8")
  );
  const validatedFormulaRegistry = {
    ...formulaRegistry,
    status: "validated",
    formulas: formulaRegistry.formulas.map((formula) => ({
      ...formula,
      status: "validated",
      displayGate: "publishable"
    }))
  };
  fs.writeFileSync(formulasPath, JSON.stringify(validatedFormulaRegistry, null, 2), "utf8");

  runBuilder([
    "--formulas",
    formulasPath,
    "--schema-snapshot",
    schemaPath,
    "--connector-status",
    "validated",
    "--connector-url",
    "https://municipal-money.example.test",
    "--reuse-status",
    "approved",
    "--reuse-evidence",
    "https://evidence.example.test/reuse",
    "--validate-formulas",
    "--freshness-status",
    "validated",
    "--expected-cadence",
    "monthly",
    "--stale-after-days",
    "45",
    "--unlock-by",
    "fixture-reviewer",
    "--out",
    outPath
  ]);
  const written = JSON.parse(fs.readFileSync(outPath, "utf8"));
  assert.equal(written.status, "unlocked", "Fully validated fixture should unlock output manifest.");
  assert.equal(written.unlockDecision.status, "unlocked", "Unlock decision should be recorded for fully validated fixture.");
  assert.equal(written.formulaVersions.length, validatedFormulaRegistry.formulas.length, "Validated formula versions should be recorded.");
  assert.deepEqual(written.schemaFingerprint.validatedFields, requiredFields.sort(), "Validated schema fields should be recorded.");

  const committedAfter = fs.readFileSync(committedManifestPath, "utf8");
  assert.equal(committedAfter, committedBefore, "Builder dry-run and --out fixture runs must not mutate committed manifest.");
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log("Treasury manifest builder verified: dry-run stays locked, validated fixture can write an unlocked review artifact.");
