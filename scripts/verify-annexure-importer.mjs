import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";

const root = process.cwd();
const committedManifestPath = path.join(root, "data", "agsa", "generated", "annexure-import-manifest.json");
const committedBefore = fs.readFileSync(committedManifestPath, "utf8");
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "mfma-annexure-import-"));

try {
  const csvPath = path.join(tmpDir, "official-annexure.csv");
  const outPath = path.join(tmpDir, "manifest.json");
  fs.writeFileSync(
    csvPath,
    [
      "municipality_code,municipality_name,financial_year,audit_outcome,movement,source_document,source_page",
      "EKU,City of Ekurhuleni Metropolitan Municipality,2024-25,qualified_with_findings,regressed,mfma-2024-25-overall-audit-outcomes-tabling-24-june-2026.pdf,6"
    ].join("\n"),
    "utf8"
  );

  const dryRun = execFileSync(
    "python",
    ["tools/import-mfma-annexures.py", csvPath, "--dry-run"],
    { cwd: root, encoding: "utf8" }
  );
  const dryRunManifest = JSON.parse(dryRun);
  assert.equal(dryRunManifest.status, "imported", "Dry-run manifest should import a valid fixture.");
  assert.equal(dryRunManifest.importedRows, 1, "Dry-run manifest should count the fixture row.");
  assert.equal(dryRunManifest.matchedOutcomes[0].municipalityCode, "EKU", "Dry-run manifest should preserve municipality code.");

  execFileSync(
    "python",
    ["tools/import-mfma-annexures.py", csvPath, "--out", outPath],
    { cwd: root, encoding: "utf8" }
  );
  const writtenManifest = JSON.parse(fs.readFileSync(outPath, "utf8"));
  assert.equal(writtenManifest.status, "imported", "Output manifest should import a valid fixture.");
  assert.equal(writtenManifest.sourceFiles[0].rowCount, 1, "Output manifest should record source row count.");

  const badCsvPath = path.join(tmpDir, "bad-annexure.csv");
  fs.writeFileSync(
    badCsvPath,
    ["municipality_code,municipality_name,financial_year,audit_outcome", "EKU,Ekurhuleni,2024-25,qualified"].join("\n"),
    "utf8"
  );
  const badRun = spawnSync("python", ["tools/import-mfma-annexures.py", badCsvPath, "--dry-run"], {
    cwd: root,
    encoding: "utf8"
  });
  assert.equal(badRun.status, 1, "Missing-column dry-run should exit with validation failure.");
  const badManifest = JSON.parse(badRun.stdout);
  assert.equal(badManifest.status, "blocked", "Missing-column manifest should be blocked.");
  assert(badManifest.expectedInputs[0].notes.includes("Missing columns"), "Missing-column manifest should name missing columns.");

  const templateRun = spawnSync("python", ["tools/import-mfma-annexures.py", "docs/templates/mfma-annexure-template.csv", "--dry-run"], {
    cwd: root,
    encoding: "utf8"
  });
  assert.equal(templateRun.status, 1, "Template annexure dry-run should exit with validation failure.");
  const templateManifest = JSON.parse(templateRun.stdout);
  assert.equal(templateManifest.status, "blocked", "Template annexure manifest should be blocked.");
  assert.equal(templateManifest.matchedOutcomes.length, 0, "Template annexure rows should not be treated as matched outcomes.");
  assert(templateManifest.expectedInputs[0].notes.includes("Template/sample rows detected"), "Template annexure run should explain sample row rejection.");

  const committedAfter = fs.readFileSync(committedManifestPath, "utf8");
  assert.equal(committedAfter, committedBefore, "Dry-run and --out fixture runs must not mutate committed manifest.");
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log("Annexure importer verified: dry-run, custom output and missing-column validation work without mutating committed data.");
