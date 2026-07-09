import { annexureValidation, treasuryValidation } from "./source-validation";
import { workflowPersistence } from "./workflow-persistence";

export type ReadinessStatus = "complete" | "ready_for_input" | "blocked_external";

export type AgsaReadinessSlice = {
  id: string;
  title: string;
  status: ReadinessStatus;
  evidence: string[];
  verification: string[];
  remainingDependency?: string;
};

export const agsaReadinessLedger: AgsaReadinessSlice[] = [
  {
    id: "agsa_data_backbone",
    title: "AGSA normalized data backbone",
    status: "complete",
    evidence: [
      "data/agsa/generated/agsa-report-extract.json",
      "lib/agsa-data.ts",
      "lib/types.ts"
    ],
    verification: ["npm run test:agsa-fixtures", "npm run build"]
  },
  {
    id: "review_workflow",
    title: "Extraction review workflow and correction overlays",
    status: "complete",
    evidence: [
      "lib/agsa-review-store.ts",
      "lib/review-overlays.ts",
      "app/admin/agsa-review/page.tsx"
    ],
    verification: ["npm run test:governance-fixtures", "npm run build"]
  },
  {
    id: "public_municheck",
    title: "Public-safe MuniCheck profiles",
    status: "complete",
    evidence: [
      "lib/public-municheck.ts",
      "app/municheck/page.tsx",
      "app/municheck/[municipalityId]/page.tsx"
    ],
    verification: ["npm run test:source-search-fixtures", "npm run build"]
  },
  {
    id: "source_search_assistant",
    title: "Source-locked search and assistant grounding",
    status: "complete",
    evidence: [
      "lib/source-search.ts",
      "app/search/page.tsx",
      "app/api/v1/[...resource]/route.ts"
    ],
    verification: ["npm run test:source-search-fixtures", "npm run build"]
  },
  {
    id: "draft_action_lifecycle",
    title: "Draft action lifecycle and evidence workflow",
    status: "complete",
    evidence: [
      "lib/draft-action-store.ts",
      "components/interactive.tsx",
      "scripts/verify-governance-fixtures.mjs"
    ],
    verification: ["npm run test:governance-fixtures", "npm run build"]
  },
  {
    id: "generated_data_policy_ci",
    title: "Generated-data policy and CI verification",
    status: "complete",
    evidence: [
      "docs/AGSA_GENERATED_DATA_POLICY.md",
      ".github/workflows/verify.yml",
      "package.json"
    ],
    verification: ["npm run verify"]
  },
  {
    id: "exact_annexure_mapping",
    title: "Exact MFMA annexure mapping",
    status: annexureValidation.unresolvedCount === 0 ? "complete" : "ready_for_input",
    evidence: [
      "tools/import-mfma-annexures.py",
      "tools/run-production-readiness-preflight.mjs",
      "tools/build-production-evidence-pack.mjs",
      "data/agsa/generated/annexure-import-manifest.json",
      "lib/annexure-overlays.ts"
    ],
    verification: ["npm run test:annexure-overlay", "npm run test:source-manifests", "npm run test:production-readiness", "npm run test:production-evidence"],
    remainingDependency:
      annexureValidation.unresolvedCount === 0
        ? undefined
        : "Official machine-readable MFMA municipality-level annexure CSV/JSON is required."
  },
  {
    id: "treasury_financial_pulse",
    title: "Treasury/Municipal Money validation and Financial Pulse unlock",
    status: treasuryValidation.unlockEvaluation.unlocked ? "complete" : "ready_for_input",
    evidence: [
      "data/treasury/validation/municipal-money-validation-manifest.json",
      "data/treasury/validation/financial-pulse-formulas.json",
      "tools/run-production-readiness-preflight.mjs",
      "tools/build-production-evidence-pack.mjs",
      "lib/treasury-validation.ts"
    ],
    verification: ["npm run test:treasury-validation", "npm run test:validation-gates", "npm run test:production-readiness", "npm run test:production-evidence"],
    remainingDependency:
      treasuryValidation.unlockEvaluation.unlocked
        ? undefined
        : "Validated connector, reuse permission, schema fingerprint, formula versions and freshness evidence are required."
  },
  {
    id: "durable_workflow_store",
    title: "Durable workflow database migration",
    status: workflowPersistence.productionReady ? "complete" : "ready_for_input",
    evidence: [
      "db/workflow/001_workflow_persistence.sql",
      "tools/build-workflow-backfill-manifest.mjs",
      "tools/run-production-readiness-preflight.mjs",
      "tools/build-production-evidence-pack.mjs",
      "docs/WORKFLOW_PERSISTENCE_MIGRATION.md"
    ],
    verification: ["npm run test:workflow-persistence", "npm run test:workflow-migration", "npm run test:production-readiness", "npm run test:production-evidence"],
    remainingDependency:
      workflowPersistence.productionReady
        ? undefined
        : "Hosted database provider, credentials and migration execution are required."
  },
  {
    id: "source_validation_boundaries",
    title: "Source validation boundaries and unlock gates",
    status: "complete",
    evidence: [
      "lib/source-validation.ts",
      "tools/run-production-readiness-preflight.mjs",
      "tools/build-production-evidence-pack.mjs",
      "app/financial-pulse/page.tsx",
      "app/admin/data-quality/page.tsx"
    ],
    verification: ["npm run test:validation-gates", "npm run test:production-readiness", "npm run test:production-evidence", "npm run build"]
  }
];

export const agsaReadinessSummary = {
  total: agsaReadinessLedger.length,
  complete: agsaReadinessLedger.filter((slice) => slice.status === "complete").length,
  readyForInput: agsaReadinessLedger.filter((slice) => slice.status === "ready_for_input").length,
  blockedExternal: agsaReadinessLedger.filter((slice) => slice.status === "blocked_external").length,
  productionReady: agsaReadinessLedger.every((slice) => slice.status === "complete"),
  ledger: agsaReadinessLedger
};
