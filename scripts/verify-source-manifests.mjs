import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const annexureManifest = JSON.parse(
  fs.readFileSync(path.join(root, "data", "agsa", "generated", "annexure-import-manifest.json"), "utf8")
);
const treasuryManifest = JSON.parse(
  fs.readFileSync(path.join(root, "data", "treasury", "validation", "municipal-money-validation-manifest.json"), "utf8")
);
const annexureImporter = fs.readFileSync(path.join(root, "tools", "import-mfma-annexures.py"), "utf8");
const sourceValidation = fs.readFileSync(path.join(root, "lib", "source-validation.ts"), "utf8");

const requiredAnnexureColumns = [
  "municipality_code",
  "municipality_name",
  "financial_year",
  "audit_outcome",
  "movement",
  "source_document",
  "source_page"
];

assert.equal(annexureManifest.schemaVersion, "mfma-annexure-import-v0.1", "Unexpected annexure manifest schema.");
assert(Array.isArray(annexureManifest.expectedInputs), "Annexure manifest should declare expected inputs.");
assert.deepEqual(
  annexureManifest.expectedInputs[0].requiredColumns,
  requiredAnnexureColumns,
  "Annexure required columns should be stable."
);
assert.equal(annexureManifest.status, "blocked", "Annexure manifest should remain blocked until official rows are imported.");
assert.equal(annexureManifest.importedRows, 0, "Committed annexure manifest should not fake imported rows.");
assert(annexureImporter.includes("Supported annexure import formats are CSV and JSON"), "Importer should document accepted formats.");

assert.equal(treasuryManifest.schemaVersion, "municipal-money-validation-v0.1", "Unexpected Treasury validation schema.");
assert.equal(treasuryManifest.unlockDecision.status, "locked", "Treasury manifest must keep Financial Pulse locked.");
assert.equal(treasuryManifest.connector.status, "not_configured", "Treasury connector should not be marked configured.");
assert(treasuryManifest.schemaFingerprint.requiredFields.includes("municipality_code"), "Treasury schema should require municipality code.");
assert.equal(treasuryManifest.formulaVersions.length, 0, "Committed Treasury manifest should not invent formula versions.");

assert(sourceValidation.includes("annexureManifestJson"), "Source validation should read the annexure manifest.");
assert(sourceValidation.includes("treasuryManifestJson"), "Source validation should read the Treasury manifest.");

console.log("Source manifests verified: annexure blocked, Treasury locked, import contracts present.");
