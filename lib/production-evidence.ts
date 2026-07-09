import fs from "node:fs";
import path from "node:path";
import { annexureValidation, treasuryValidation } from "./source-validation";
import { workflowPersistence } from "./workflow-persistence";
import { latestProductionGateReview, listProductionGateReviews, type ProductionGateReviewDecision } from "./production-gate-review-store";

export type ProductionGateStatus = "pass" | "ready_for_input" | "blocked";

export type ProductionGateCheck = {
  id: string;
  label: string;
  status: ProductionGateStatus;
  evidence: string;
  nextStep: string;
};

export type ProductionReadinessGate = {
  id: string;
  label: string;
  status: ProductionGateStatus;
  readyForProduction: boolean;
  externalDependency: string;
  evidence: string[];
  checks: ProductionGateCheck[];
};

export type ProductionReadinessPreflight = {
  schemaVersion: "production-readiness-preflight-v0.1";
  generatedAt: string;
  productionReady: boolean;
  summary: string;
  gates: ProductionReadinessGate[];
  externalDependencies: Array<{
    gateId: string;
    dependency: string;
    nextSteps: string[];
  }>;
};

export type ProductionEvidencePack = {
  schemaVersion: "production-evidence-pack-v0.1";
  generatedAt: string;
  productionReady: boolean;
  summary: string;
  preflight: ProductionReadinessPreflight;
  intakeRequirements: Array<{
    gateId: string;
    title: string;
    status: ProductionGateStatus;
    requiredEvidence: string[];
    safeValidationCommands: string[];
    promotionCommand: string;
    promotionGuardrail: string;
    latestReview?: ProductionGateReviewDecision;
  }>;
  releaseChecklist: string[];
  reviewGovernance: ReturnType<typeof listProductionGateReviews>;
};

function summarizeGate(
  gate: Omit<ProductionReadinessGate, "status" | "readyForProduction">
): ProductionReadinessGate {
  const statuses = gate.checks.map((check) => check.status);
  const status = statuses.every((checkStatus) => checkStatus === "pass")
    ? "pass"
    : statuses.some((checkStatus) => checkStatus === "blocked")
      ? "blocked"
      : "ready_for_input";

  return {
    ...gate,
    status,
    readyForProduction: status === "pass"
  };
}

function buildAnnexureGate(): ProductionReadinessGate {
  const manifest = annexureValidation.manifest;
  const sourceFileCount = manifest.sourceFiles.length;
  const importedRows = manifest.importedRows;
  const unmatchedRows = manifest.unmatchedRows.length;
  const expectedInput = manifest.expectedInputs[0];

  return summarizeGate({
    id: "mfma_annexure_mapping",
    label: "Official MFMA municipality outcome annexure",
    externalDependency: "Official machine-readable AGSA MFMA municipality-level annexure CSV or JSON.",
    evidence: [
      "data/agsa/generated/annexure-import-manifest.json",
      "tools/import-mfma-annexures.py",
      "lib/annexure-overlays.ts"
    ],
    checks: [
      {
        id: "official_annexure_registered",
        label: "Official annexure file registered",
        status: sourceFileCount > 0 ? "pass" : "ready_for_input",
        evidence: sourceFileCount > 0
          ? `${sourceFileCount} source file(s) registered in the annexure manifest.`
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

function buildTreasuryGate(): ProductionReadinessGate {
  const manifest = treasuryValidation.manifest;
  const unlock = treasuryValidation.unlockEvaluation;

  return summarizeGate({
    id: "treasury_financial_pulse_unlock",
    label: "Treasury / Municipal Money Financial Pulse unlock",
    externalDependency: "Validated connector, reuse permission, schema fingerprint, formula versions and freshness evidence.",
    evidence: [
      "data/treasury/validation/municipal-money-validation-manifest.json",
      "data/treasury/validation/financial-pulse-formulas.json",
      "tools/build-treasury-validation-manifest.mjs",
      "lib/treasury-validation.ts"
    ],
    checks: [
      {
        id: "treasury_connector_validated",
        label: "Connector validated",
        status: manifest.connector.status === "validated" ? "pass" : "ready_for_input",
        evidence: manifest.connector.lastProbeStatus ?? "No live Municipal Money connector probe has passed.",
        nextStep: "Capture a successful connector probe and timestamp in the validation manifest."
      },
      {
        id: "treasury_reuse_approved",
        label: "Reuse approval captured",
        status: manifest.reuseReview.status === "approved" ? "pass" : "ready_for_input",
        evidence: manifest.reuseReview.evidenceUrl ?? manifest.reuseReview.notes,
        nextStep: "Record reuse and display permission evidence before exposing public Treasury metrics."
      },
      {
        id: "treasury_schema_validated",
        label: "Schema fingerprint validated",
        status: unlock.gates.schema ? "pass" : "ready_for_input",
        evidence: unlock.formulaReadiness.missingSchemaFields.length
          ? `Missing validated field(s): ${unlock.formulaReadiness.missingSchemaFields.join(", ")}.`
          : `Validated schema fingerprint ${manifest.schemaFingerprint.fingerprint}.`,
        nextStep: "Run the manifest builder with a reviewed schema snapshot that covers every formula field."
      },
      {
        id: "treasury_formulas_publishable",
        label: "Formula versions publishable",
        status: unlock.gates.formulas ? "pass" : "ready_for_input",
        evidence: unlock.gates.formulas
          ? `${unlock.formulaReadiness.validatedFormulaCount} publishable formula version(s) validated.`
          : `Missing publishable validated formula(s): ${unlock.formulaReadiness.missingFormulaMetrics.join(", ")}.`,
        nextStep: "Promote formulas only after field mapping, denominator treatment and period alignment are reviewed."
      },
      {
        id: "treasury_freshness_validated",
        label: "Freshness SLA validated",
        status: manifest.freshness.status === "validated" ? "pass" : "ready_for_input",
        evidence: manifest.freshness.lastPulledAt
          ? `Last pulled at ${manifest.freshness.lastPulledAt}.`
          : "No freshness cadence, last pull timestamp or stale-data treatment has been validated.",
        nextStep: "Record expected cadence, stale threshold and latest successful pull evidence."
      },
      {
        id: "treasury_unlock_decision",
        label: "Unlock decision approved",
        status: unlock.unlocked ? "pass" : "ready_for_input",
        evidence: manifest.unlockDecision.rationale,
        nextStep: "Only unlock after every required Treasury gate passes."
      }
    ]
  });
}

function buildWorkflowGate(): ProductionReadinessGate {
  const migrationPath = "db/workflow/001_workflow_persistence.sql";
  const migrationExists = fs.existsSync(path.join(process.cwd(), migrationPath));
  const localJsonActive = workflowPersistence.activeProvider === "local_json";
  const localProvider = workflowPersistence.providers.find((provider) => provider.id === "local_json");

  return summarizeGate({
    id: "durable_workflow_store",
    label: "Durable workflow database",
    externalDependency: "Hosted database provider, credentials, applied workflow migration and parity smoke evidence.",
    evidence: [
      migrationPath,
      "tools/build-workflow-backfill-manifest.mjs",
      "data/agsa/generated/workflow-backfill-manifest.json",
      "lib/workflow-persistence.ts"
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
        status: localProvider?.migrationArtifacts?.includes("data/agsa/generated/workflow-backfill-manifest.json") ? "pass" : "blocked",
        evidence: "Backfill manifest is tracked as a migration artifact for local JSON workflow records.",
        nextStep: "Regenerate the manifest immediately before production backfill."
      },
      {
        id: "workflow_database_provider_active",
        label: "Database provider active",
        status: !localJsonActive && workflowPersistence.productionReady ? "pass" : "ready_for_input",
        evidence: localJsonActive
          ? "Workflow persistence is still using the local JSON provider."
          : "Workflow persistence source no longer declares local JSON as active.",
        nextStep: "Switch the workflow store adapter only after migration, backfill and parity checks pass."
      }
    ]
  });
}

export function buildProductionReadinessPreflight(): ProductionReadinessPreflight {
  const gates = [buildAnnexureGate(), buildTreasuryGate(), buildWorkflowGate()];
  const productionReady = gates.every((gate) => gate.readyForProduction);

  return {
    schemaVersion: "production-readiness-preflight-v0.1",
    generatedAt: new Date().toISOString(),
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
          .filter((check) => check.status !== "pass")
          .map((check) => check.nextStep)
      }))
  };
}

export function buildProductionEvidencePack(): ProductionEvidencePack {
  const preflight = buildProductionReadinessPreflight();

  return {
    schemaVersion: "production-evidence-pack-v0.1",
    generatedAt: new Date().toISOString(),
    productionReady: preflight.productionReady,
    summary: preflight.summary,
    preflight,
    intakeRequirements: [
      {
        gateId: "mfma_annexure_mapping",
        title: "Official MFMA annexure intake",
        status: preflight.gates.find((gate) => gate.id === "mfma_annexure_mapping")?.status ?? "blocked",
        requiredEvidence: [
          "Official AGSA MFMA municipality-level audit outcome annexure exported to CSV or JSON.",
          "Start from docs/templates/mfma-annexure-template.csv when preparing a local reviewed input.",
          "Columns: municipality_code, municipality_name, financial_year, audit_outcome, movement, source_document, source_page.",
          "Source filename, row count and checksum retained in the import manifest.",
          "Reviewer resolution notes for unmatched or excluded rows."
        ],
        safeValidationCommands: [
          "node tools/prepare-production-gate-inputs.mjs",
          "python tools/import-mfma-annexures.py path\\to\\official-mfma-annexure.csv --dry-run",
          "python tools/import-mfma-annexures.py path\\to\\official-mfma-annexure.csv --out data\\agsa\\generated\\annexure-import-manifest.local.json",
          "npm run test:annexure-importer",
          "npm run test:annexure-overlay"
        ],
        promotionCommand: "python tools/import-mfma-annexures.py path\\to\\official-mfma-annexure.csv",
        promotionGuardrail: "Only promote after the dry-run manifest shows expected row counts and unmatched rows are reviewed.",
        latestReview: latestProductionGateReview("mfma_annexure_mapping") as ProductionGateReviewDecision | undefined
      },
      {
        gateId: "treasury_financial_pulse_unlock",
        title: "Treasury / Municipal Money validation intake",
        status: preflight.gates.find((gate) => gate.id === "treasury_financial_pulse_unlock")?.status ?? "blocked",
        requiredEvidence: [
          "Successful connector probe timestamp and status.",
          "Reuse and display permission evidence URL or reviewed internal reference.",
          "Start from docs/templates/treasury-schema-snapshot-template.json when preparing a schema snapshot.",
          "Schema snapshot JSON covering every Financial Pulse formula field.",
          "Validated formula versions with reviewed denominator, period alignment and display gate decisions.",
          "Freshness SLA: expected cadence, stale-after threshold and latest successful pull timestamp."
        ],
        safeValidationCommands: [
          "node tools/prepare-production-gate-inputs.mjs",
          "node tools/build-treasury-validation-manifest.mjs --schema-snapshot path\\to\\schema.json --connector-status validated --dry-run",
          "node tools/build-treasury-validation-manifest.mjs --schema-snapshot path\\to\\schema.json --out data\\treasury\\validation\\municipal-money-validation-manifest.local.json",
          "npm run test:treasury-validation",
          "npm run test:treasury-manifest-builder"
        ],
        promotionCommand: "Review and intentionally write data\\treasury\\validation\\municipal-money-validation-manifest.json only after every Treasury gate passes.",
        promotionGuardrail: "Financial Pulse must remain gated while any connector, reuse, schema, formula or freshness check is incomplete.",
        latestReview: latestProductionGateReview("treasury_financial_pulse_unlock") as ProductionGateReviewDecision | undefined
      },
      {
        gateId: "durable_workflow_store",
        title: "Durable workflow database intake",
        status: preflight.gates.find((gate) => gate.id === "durable_workflow_store")?.status ?? "blocked",
        requiredEvidence: [
          "Hosted PostgreSQL-compatible database provider and tenant model selected.",
          "Provider credentials configured outside the repository.",
          "db/workflow/001_workflow_persistence.sql applied successfully.",
          "Start from docs/templates/workflow-migration-evidence-template.md when recording migration evidence.",
          "Fresh workflow backfill manifest generated from local JSON stores.",
          "Parity smoke evidence for review decisions, draft actions, transitions and evidence attachments."
        ],
        safeValidationCommands: [
          "node tools/prepare-production-gate-inputs.mjs",
          "node tools/build-workflow-backfill-manifest.mjs",
          "npm run test:workflow-migration",
          "npm run test:workflow-persistence"
        ],
        promotionCommand: "Switch workflowPersistence.activeProvider to database only after migration, backfill and parity checks pass.",
        promotionGuardrail: "Do not mark workflowPersistence.productionReady true while local_json remains active.",
        latestReview: latestProductionGateReview("durable_workflow_store") as ProductionGateReviewDecision | undefined
      }
    ],
    releaseChecklist: [
      "Run node tools/run-production-readiness-preflight.mjs and confirm productionReady is true.",
      "Run npm run verify.",
      "Attach official source evidence and generated local artifacts to the release review.",
      "Confirm Financial Pulse no longer exposes pending_validation only after Treasury unlock is approved.",
      "Confirm workflow writes use the durable store before multi-user or tenant pilots."
    ],
    reviewGovernance: listProductionGateReviews()
  };
}
