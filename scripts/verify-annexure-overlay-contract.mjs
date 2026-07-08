import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const agsaData = fs.readFileSync(path.join(root, "lib", "agsa-data.ts"), "utf8");
const route = fs.readFileSync(path.join(root, "app", "api", "v1", "[...resource]", "route.ts"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data", "agsa", "generated", "annexure-import-manifest.json"), "utf8"));
const treasuryManifest = JSON.parse(
  fs.readFileSync(path.join(root, "data", "treasury", "validation", "municipal-money-validation-manifest.json"), "utf8")
);

assert.equal(manifest.schemaVersion, "mfma-annexure-import-v0.1", "Annexure manifest schema should remain stable.");
assert(Array.isArray(manifest.matchedOutcomes), "Annexure manifest should expose matchedOutcomes.");
assert(agsaData.includes("annexureImportManifestJson"), "AGSA data projection should import the annexure manifest.");
assert(agsaData.includes("function annexureOutcomeFor"), "AGSA data projection should match annexure rows to outcomes.");
assert(agsaData.includes('mappingConfidence: "exact"'), "Annexure-backed outcomes should be promoted to exact.");
assert(agsaData.includes("official MFMA annexure import manifest"), "Annexure-backed mappings should explain provenance.");
assert(agsaData.includes("candidate.documentId === row.sourceDocument"), "Annexure source documents should resolve by document id.");
assert(agsaData.includes("candidate.fileName === row.sourceDocument"), "Annexure source documents should resolve by filename.");

assert.equal(treasuryManifest.unlockDecision.status, "locked", "Treasury manifest should remain locked.");
assert(route.includes("validation: treasuryValidation"), "Financial Pulse endpoint should include Treasury validation details.");
assert(route.includes("Financial Pulse remains unavailable"), "Financial Pulse endpoint should keep unlock rule explicit.");

console.log("Annexure overlay contract verified: imported rows can promote exact outcomes; Financial Pulse stays locked.");
