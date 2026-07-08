import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const helperPath = path.join(root, "lib", "annexure-overlays.ts");
const agsaData = fs.readFileSync(path.join(root, "lib", "agsa-data.ts"), "utf8");
const helperSource = fs.readFileSync(helperPath, "utf8");
const route = fs.readFileSync(path.join(root, "app", "api", "v1", "[...resource]", "route.ts"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data", "agsa", "generated", "annexure-import-manifest.json"), "utf8"));
const treasuryManifest = JSON.parse(
  fs.readFileSync(path.join(root, "data", "treasury", "validation", "municipal-money-validation-manifest.json"), "utf8")
);

assert.equal(manifest.schemaVersion, "mfma-annexure-import-v0.1", "Annexure manifest schema should remain stable.");
assert(Array.isArray(manifest.matchedOutcomes), "Annexure manifest should expose matchedOutcomes.");
assert(agsaData.includes("annexureImportManifestJson"), "AGSA data projection should import the annexure manifest.");
assert(agsaData.includes("mapAuditOutcomeWithAnnexure"), "AGSA data projection should use the pure annexure overlay helper.");
assert(helperSource.includes("findAnnexureOutcome"), "Annexure helper should match annexure rows to outcomes.");
assert(helperSource.includes('mappingConfidence: "exact"'), "Annexure-backed outcomes should be promoted to exact.");
assert(helperSource.includes("official MFMA annexure import manifest"), "Annexure-backed mappings should explain provenance.");
assert(helperSource.includes("candidate.documentId === row.sourceDocument"), "Annexure source documents should resolve by document id.");
assert(helperSource.includes("candidate.fileName === row.sourceDocument"), "Annexure source documents should resolve by filename.");

assert.equal(treasuryManifest.unlockDecision.status, "locked", "Treasury manifest should remain locked.");
assert(route.includes("validation: treasuryValidation"), "Financial Pulse endpoint should include Treasury validation details.");
assert(route.includes("Financial Pulse remains unavailable"), "Financial Pulse endpoint should keep unlock rule explicit.");

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "annexure-overlay-"));
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
  const { mapAuditOutcomeWithAnnexure } = await import(pathToFileURL(path.join(tmpDir, "annexure-overlays.js")).href);
  const outcome = {
    auditeeId: "ZA_GP_EKU",
    financialYear: "2024-25",
    opinion: "metro_cohort_under_review",
    movement: "watch",
    budgetAmount: null,
    cleanAuditFlag: false,
    correctedMisstatements: null,
    notes: "Kept in the critical lane until municipality-specific 2024-25 annexure validation is loaded.",
    citationId: "cit_fallback"
  };
  const mapped = mapAuditOutcomeWithAnnexure(outcome, {
    auditee: {
      auditeeId: "ZA_GP_EKU",
      canonicalName: "City of Ekurhuleni Metropolitan Municipality",
      commonName: "Ekurhuleni",
      sphere: "local",
      province: "Gauteng",
      category: "metro",
      sector: "local_government",
      highImpact: true,
      canonicalCode: "EKU"
    },
    annexureRows: [
      {
        municipalityCode: "EKU",
        municipalityName: "City of Ekurhuleni Metropolitan Municipality",
        financialYear: "2024-25",
        auditOutcome: "qualified_with_findings",
        movement: "regressed",
        sourceDocument: "doc_mfma",
        sourcePage: 42
      }
    ],
    documents: [
      {
        documentId: "doc_mfma",
        reportFamily: "MFMA",
        reportYear: "2024-25",
        tabledDate: null,
        title: "MFMA annexure",
        issuer: "AGSA",
        fileName: "annexure.csv",
        filePath: "docs/annexure.csv",
        pageCount: 1,
        scope: "local_government",
        theme: "outcomes",
        priority: "P0",
        qualityState: "verified",
        sha256: "fixture",
        pdfTitle: "MFMA annexure"
      }
    ],
    citations: [
      {
        citationId: "cit_annexure",
        documentId: "doc_mfma",
        pageNumber: 42,
        sectionTitle: "Annexure outcomes",
        quoteSnippet: "Ekurhuleni qualified with findings",
        extractionConfidence: "high"
      }
    ],
    citationToSource: (citationId) => ({
      id: citationId,
      label: citationId,
      source: "fixture",
      period: "2024-25",
      location: "fixture",
      qualityState: "verified"
    })
  });

  assert.equal(mapped.opinion, "qualified_with_findings", "Synthetic annexure row should override cohort outcome.");
  assert.equal(mapped.movement, "regressed", "Synthetic annexure row should override movement.");
  assert.equal(mapped.mappingConfidence, "exact", "Synthetic annexure row should promote mapping confidence to exact.");
  assert.equal(mapped.citationId, "cit_annexure", "Synthetic annexure row should resolve the exact source citation.");
  assert(mapped.mappingRationale.includes("official MFMA annexure"), "Synthetic annexure overlay should preserve provenance rationale.");
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log("Annexure overlay contract verified: synthetic imported row promotes exact outcome; Financial Pulse stays locked.");
