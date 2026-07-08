#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function parseArgs(argv) {
  const args = { out: null };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--out") {
      if (!argv[index + 1] || argv[index + 1].startsWith("--")) {
        throw new Error("--out requires a destination path.");
      }

      args.out = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function usage() {
  return [
    "Usage: node tools/run-production-readiness-preflight.mjs [--out path]",
    "",
    "Runs the read-only production readiness preflight across the remaining external gates:",
    "- official MFMA annexure outcome import",
    "- Treasury / Municipal Money validation unlock",
    "- durable workflow database migration"
  ].join("\n");
}

function normalizeCheckStatus(status) {
  if (status === "pass") return "pass";
  if (status === "ready_for_input") return "ready_for_input";
  return "blocked";
}

function summarizeGate({ id, label, checks, externalDependency, evidence }) {
  const statuses = checks.map((check) => normalizeCheckStatus(check.status));
  const status = statuses.every((checkStatus) => checkStatus === "pass")
    ? "pass"
    : statuses.some((checkStatus) => checkStatus === "blocked")
      ? "blocked"
      : "ready_for_input";

  return {
    id,
    label,
    status,
    readyForProduction: status === "pass",
    externalDependency,
    evidence,
    checks
  };
}

function buildAnnexureGate() {
  const manifestPath = "data/agsa/generated/annexure-import-manifest.json";
  const manifest = readJson(manifestPath);
  const expectedInput = manifest.expectedInputs?.[0];
  const sourceFileCount = manifest.sourceFiles?.length ?? 0;
  const importedRows = manifest.importedRows ?? 0;
  const unmatchedRows = manifest.unmatchedRows?.length ?? 0;

  return summarizeGate({
    id: "mfma_annexure_mapping",
    label: "Official MFMA municipality outcome annexure",
    externalDependency: "Official machine-readable AGSA MFMA municipality-level annexure CSV or JSON.",
    evidence: [
      manifestPath,
      "tools/import-mfma-annexures.py",
      "lib/annexure-overlays.ts"
    ],
    checks: [
      {
        id: "official_annexure_registered",
        label: "Official annexure file registered",
        status: sourceFileCount > 0 ? "pass" : "ready_for_input",
        evidence: sourceFileCount > 0
          ? `${sourceFileCount} source file(s) registered in ${manifestPath}.`
          : expectedInput?.notes ?? "No machine-readable official annexure source file is registered.",
        nextStep: sourceFileCount > 0
          ? "Confirm the source file hash and row count against the operator export."
          : "Export the official AGSA annexure table to CSV or JSON and run the importer."
      },
      {
        id: "annexure_rows_imported",
        label: "Municipality-level rows imported",
        status: importedRows > 0 ? "pass" : "ready_for_input",
        evidence: `${importedRows} imported annexure row(s).`,
        nextStep: importedRows > 0
          ? "Review matched and unmatched row counts before promoting exact mappings."
          : "Run python tools/import-mfma-annexures.py against the official export."
      },
      {
        id: "annexure_unmatched_rows_resolved",
        label: "Unmatched rows resolved",
        status: importedRows > 0 && unmatchedRows === 0 ? "pass" : importedRows > 0 ? "blocked" : "ready_for_input",
        evidence: `${unmatchedRows} unmatched annexure row(s).`,
        nextStep: importedRows === 0
          ? "Import official annexure rows before reviewing unmatched row resolution."
          : unmatchedRows === 0
          ? "Keep importer manifest with release evidence."
          : "Fix municipality code/name mismatches or exclude non-municipal rows with reviewer notes."
      }
    ]
  });
}

function buildTreasuryGate() {
  const manifestPath = "data/treasury/validation/municipal-money-validation-manifest.json";
  const formulasPath = "data/treasury/validation/financial-pulse-formulas.json";
  const manifest = readJson(manifestPath);
  const formulas = readJson(formulasPath);
  const formulaVersions = manifest.formulaVersions ?? [];
  const formulaRecords = formulas.formulas ?? [];
  const publishableFormulaIds = new Set(
    formulaRecords
      .filter((formula) => formula.status === "validated" && formula.displayGate === "publishable")
      .map((formula) => `${formula.metric}:${formula.version}`)
  );
  const requiredFormulaIds = formulaRecords.map((formula) => `${formula.metric}:${formula.version}`);
  const validatedFormulaIds = new Set(
    formulaVersions
      .filter((formula) => formula.status === "validated")
      .map((formula) => `${formula.metric}:${formula.version}`)
  );
  const allRequiredFields = new Set(
    formulaRecords.flatMap((formula) => formula.requiredFields ?? [])
  );
  const validatedFields = new Set(manifest.schemaFingerprint?.validatedFields ?? []);
  const missingSchemaFields = Array.from(allRequiredFields).filter((field) => !validatedFields.has(field));
  const missingValidatedFormulas = requiredFormulaIds.filter(
    (id) => !publishableFormulaIds.has(id) || !validatedFormulaIds.has(id)
  );

  return summarizeGate({
    id: "treasury_financial_pulse_unlock",
    label: "Treasury / Municipal Money Financial Pulse unlock",
    externalDependency: "Validated connector, reuse permission, schema fingerprint, formula versions and freshness evidence.",
    evidence: [
      manifestPath,
      formulasPath,
      "tools/build-treasury-validation-manifest.mjs",
      "lib/treasury-validation.ts"
    ],
    checks: [
      {
        id: "treasury_connector_validated",
        label: "Connector validated",
        status: manifest.connector?.status === "validated" ? "pass" : "ready_for_input",
        evidence: manifest.connector?.lastProbeStatus ?? "No live Municipal Money connector probe has passed.",
        nextStep: "Capture a successful connector probe and timestamp in the validation manifest."
      },
      {
        id: "treasury_reuse_approved",
        label: "Reuse approval captured",
        status: manifest.reuseReview?.status === "approved" ? "pass" : "ready_for_input",
        evidence: manifest.reuseReview?.evidenceUrl ?? manifest.reuseReview?.notes ?? "No reuse approval evidence recorded.",
        nextStep: "Record reuse and display permission evidence before exposing public Treasury metrics."
      },
      {
        id: "treasury_schema_validated",
        label: "Schema fingerprint validated",
        status: manifest.schemaFingerprint?.status === "validated" && missingSchemaFields.length === 0 ? "pass" : "ready_for_input",
        evidence: missingSchemaFields.length
          ? `Missing validated field(s): ${missingSchemaFields.join(", ")}.`
          : `Validated schema fingerprint ${manifest.schemaFingerprint?.fingerprint}.`,
        nextStep: "Run the manifest builder with a reviewed schema snapshot that covers every formula field."
      },
      {
        id: "treasury_formulas_publishable",
        label: "Formula versions publishable",
        status: missingValidatedFormulas.length === 0 && formulaRecords.length > 0 ? "pass" : "ready_for_input",
        evidence: missingValidatedFormulas.length
          ? `Missing publishable validated formula(s): ${missingValidatedFormulas.join(", ")}.`
          : `${formulaRecords.length} publishable formula version(s) validated.`,
        nextStep: "Promote formulas only after field mapping, denominator treatment and period alignment are reviewed."
      },
      {
        id: "treasury_freshness_validated",
        label: "Freshness SLA validated",
        status: manifest.freshness?.status === "validated" ? "pass" : "ready_for_input",
        evidence: manifest.freshness?.lastPulledAt
          ? `Last pulled at ${manifest.freshness.lastPulledAt}.`
          : "No freshness cadence, last pull timestamp or stale-data treatment has been validated.",
        nextStep: "Record expected cadence, stale threshold and latest successful pull evidence."
      },
      {
        id: "treasury_unlock_decision",
        label: "Unlock decision approved",
        status: manifest.unlockDecision?.status === "unlocked" ? "pass" : "ready_for_input",
        evidence: manifest.unlockDecision?.rationale ?? "Financial Pulse remains locked.",
        nextStep: "Only unlock after every required Treasury gate passes."
      }
    ]
  });
}

function buildWorkflowGate() {
  const manifestPath = "data/agsa/generated/workflow-backfill-manifest.json";
  const migrationPath = "db/workflow/001_workflow_persistence.sql";
  const persistencePath = "lib/workflow-persistence.ts";
  const manifest = readJson(manifestPath);
  const migrationExists = fs.existsSync(path.join(root, migrationPath));
  const persistenceSource = fs.readFileSync(path.join(root, persistencePath), "utf8");
  const localProviderActive = persistenceSource.includes('activeProvider: "local_json"');
  const productionReady = persistenceSource.includes("productionReady: true");

  return summarizeGate({
    id: "durable_workflow_store",
    label: "Durable workflow database",
    externalDependency: "Hosted database provider, credentials, applied workflow migration and parity smoke evidence.",
    evidence: [
      migrationPath,
      "tools/build-workflow-backfill-manifest.mjs",
      manifestPath,
      persistencePath
    ],
    checks: [
      {
        id: "workflow_migration_sql_present",
        label: "Migration SQL present",
        status: migrationExists ? "pass" : "blocked",
        evidence: migrationExists ? `${migrationPath} exists.` : `${migrationPath} is missing.`,
        nextStep: migrationExists ? "Apply the migration to the selected hosted database." : "Restore the migration artifact before DB setup."
      },
      {
        id: "workflow_backfill_manifest_present",
        label: "Backfill manifest present",
        status: manifest.schemaVersion === "workflow-backfill-manifest-v0.1" ? "pass" : "blocked",
        evidence: `${manifest.rowCounts?.reviewDecisions ?? 0} review decision row(s), ${manifest.rowCounts?.draftActions ?? 0} draft action row(s).`,
        nextStep: "Regenerate the manifest immediately before production backfill."
      },
      {
        id: "workflow_database_provider_active",
        label: "Database provider active",
        status: !localProviderActive && productionReady ? "pass" : "ready_for_input",
        evidence: localProviderActive
          ? "Workflow persistence is still using the local JSON provider."
          : "Workflow persistence source no longer declares local JSON as active.",
        nextStep: "Switch the workflow store adapter only after migration, backfill and parity checks pass."
      }
    ]
  });
}

function buildReport() {
  const gates = [buildAnnexureGate(), buildTreasuryGate(), buildWorkflowGate()];
  const generatedAt = new Date().toISOString();
  const productionReady = gates.every((gate) => gate.readyForProduction);

  return {
    schemaVersion: "production-readiness-preflight-v0.1",
    generatedAt,
    productionReady,
    summary: productionReady
      ? "All production readiness gates passed."
      : "Production readiness is not yet unlocked. External source and infrastructure evidence is still required.",
    gates,
    externalDependencies: gates
      .filter((gate) => !gate.readyForProduction)
      .map((gate) => ({
        gateId: gate.id,
        dependency: gate.externalDependency,
        nextSteps: gate.checks
          .filter((check) => normalizeCheckStatus(check.status) !== "pass")
          .map((check) => check.nextStep)
      }))
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(usage());
    return;
  }

  const report = buildReport();
  const output = `${JSON.stringify(report, null, 2)}\n`;

  if (args.out) {
    const outPath = path.resolve(root, args.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, output);
    console.log(`Production readiness preflight written to ${path.relative(root, outPath)}`);
    return;
  }

  process.stdout.write(output);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
