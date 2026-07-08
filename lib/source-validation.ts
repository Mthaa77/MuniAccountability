import annexureManifestJson from "@/data/agsa/generated/annexure-import-manifest.json";
import treasuryManifestJson from "@/data/treasury/validation/municipal-money-validation-manifest.json";
import { mappedAuditOutcomes, sourceHealth } from "./pilot-data";

export type ValidationGate = {
  id: string;
  label: string;
  status: "passed" | "in_progress" | "blocked" | "not_started";
  evidence: string;
  requiredForUnlock: boolean;
};

export type ValidationModel = {
  id: string;
  label: string;
  status: "passed" | "blocked";
  summary: string;
  gates: ValidationGate[];
};

const unresolvedOutcomeMappings = mappedAuditOutcomes.filter((outcome) =>
  ["cohort_derived", "manual", "needs_review"].includes(outcome.mappingConfidence)
);
const annexureManifest = annexureManifestJson as {
  schemaVersion: string;
  updatedAt: string;
  status: "blocked" | "ready" | "imported";
  sourceFiles: Array<{ path: string; sha256?: string; rowCount?: number }>;
  expectedInputs: Array<{
    id: string;
    label: string;
    acceptedFormats: string[];
    requiredColumns: string[];
    status: "missing" | "present" | "imported";
    notes?: string;
  }>;
  importedRows: number;
  matchedOutcomes: Array<unknown>;
  unmatchedRows: Array<unknown>;
  operatorNotes: string[];
};
const treasuryManifest = treasuryManifestJson as {
  schemaVersion: string;
  updatedAt: string;
  status: "blocked" | "ready" | "unlocked";
  connector: { status: string; baseUrl: string | null; lastProbeAt: string | null; lastProbeStatus: string | null };
  reuseReview: { status: string; evidenceUrl: string | null; notes: string };
  schemaFingerprint: { status: string; fingerprint: string | null; requiredFields: string[]; validatedFields: string[] };
  formulaVersions: Array<{ id: string; metric: string; version: string; expression: string }>;
  freshness: { status: string; lastPulledAt: string | null; expectedCadence: string | null; staleAfterDays: number | null };
  unlockDecision: { status: string; decidedBy: string | null; decidedAt: string | null; rationale: string };
};

export const annexureValidation: ValidationModel & {
  manifest: typeof annexureManifest;
  unresolvedCount: number;
  unresolvedOutcomes: Array<{
    auditeeId: string;
    financialYear: string;
    opinion: string;
    mappingConfidence: string;
    mappingRationale: string;
    citation: unknown;
  }>;
} = {
  id: "mfma_annexure_validation",
  label: "MFMA municipality annexure validation",
  status: unresolvedOutcomeMappings.length ? "blocked" : "passed",
  summary: unresolvedOutcomeMappings.length
    ? "Some municipal audit outcomes are still cohort-derived, manual or needs-review and must be tied to exact MFMA annexure rows before being treated as exact."
    : "All mapped municipal audit outcomes are exact.",
  manifest: annexureManifest,
  unresolvedCount: unresolvedOutcomeMappings.length,
  unresolvedOutcomes: unresolvedOutcomeMappings.map((outcome) => ({
    auditeeId: outcome.auditeeId,
    financialYear: outcome.financialYear,
    opinion: outcome.opinion,
    mappingConfidence: outcome.mappingConfidence,
    mappingRationale: outcome.mappingRationale,
    citation: outcome.source
  })),
  gates: [
    {
      id: "annexure_file_inventory",
      label: "Official annexure file inventory",
      status: annexureManifest.sourceFiles.length ? "in_progress" : "blocked",
      evidence: annexureManifest.sourceFiles.length
        ? `${annexureManifest.sourceFiles.length} annexure source file(s) registered in the import manifest.`
        : annexureManifest.expectedInputs[0]?.notes ?? "No separate machine-readable MFMA annexure workbook is present in docs/.",
      requiredForUnlock: true
    },
    {
      id: "municipality_code_match",
      label: "Municipality code/name match",
      status: annexureManifest.importedRows > 0 && unresolvedOutcomeMappings.length ? "in_progress" : unresolvedOutcomeMappings.length ? "blocked" : "passed",
      evidence:
        `${mappedAuditOutcomes.length - unresolvedOutcomeMappings.length} exact mapping(s), ${unresolvedOutcomeMappings.length} unresolved mapping(s), ` +
        `${annexureManifest.importedRows} imported annexure row(s).`,
      requiredForUnlock: true
    },
    {
      id: "review_decision_applied",
      label: "Reviewer decision applied",
      status: "in_progress",
      evidence: "Review decisions are applied through the governed API overlay; open extraction issues remain visible in source health.",
      requiredForUnlock: true
    }
  ]
};

export const treasuryValidation: ValidationModel & {
  sourceStatus: string;
  manifest: typeof treasuryManifest;
} = {
  id: "treasury_municipal_money_validation",
  label: "Treasury / Municipal Money validation",
  status: "blocked",
  summary: "Financial Pulse remains locked until source access, reuse permission, schema, formulas and freshness checks pass.",
  manifest: treasuryManifest,
  sourceStatus: sourceHealth.find((source) => source.sourceId === "municipal_money")?.status ?? "unknown",
  gates: [
    {
      id: "source_access",
      label: "Source access and connector",
      status: treasuryManifest.connector.status === "validated" ? "passed" : "not_started",
      evidence: treasuryManifest.connector.lastProbeStatus ?? "No live connector is enabled in this AGSA-first slice.",
      requiredForUnlock: true
    },
    {
      id: "reuse_permission",
      label: "Reuse and display permission",
      status: treasuryManifest.reuseReview.status === "approved" ? "passed" : "not_started",
      evidence: treasuryManifest.reuseReview.notes,
      requiredForUnlock: true
    },
    {
      id: "schema_fingerprint",
      label: "Schema fingerprint",
      status: treasuryManifest.schemaFingerprint.status === "validated" ? "passed" : "not_started",
      evidence: treasuryManifest.schemaFingerprint.fingerprint
        ? `Validated schema fingerprint ${treasuryManifest.schemaFingerprint.fingerprint}.`
        : "No validated Municipal Money schema snapshot has been committed.",
      requiredForUnlock: true
    },
    {
      id: "formula_version",
      label: "Formula versioning",
      status: treasuryManifest.formulaVersions.length ? "in_progress" : "not_started",
      evidence: treasuryManifest.formulaVersions.length
        ? `${treasuryManifest.formulaVersions.length} formula version(s) registered.`
        : "Financial Pulse formulas are not versioned against Treasury fields yet.",
      requiredForUnlock: true
    },
    {
      id: "freshness_sla",
      label: "Freshness SLA",
      status: treasuryManifest.freshness.status === "validated" ? "passed" : "not_started",
      evidence: treasuryManifest.freshness.expectedCadence
        ? `Expected cadence: ${treasuryManifest.freshness.expectedCadence}.`
        : "No live pull timestamp, expected update cadence or stale-data treatment has been validated.",
      requiredForUnlock: true
    }
  ]
};

export const sourceValidationSummary = {
  annexures: annexureValidation,
  treasury: treasuryValidation,
  unlockRule: "Every required gate must pass before exact-annexure or Financial Pulse claims are published."
};
