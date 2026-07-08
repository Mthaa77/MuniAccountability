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

export const annexureValidation: ValidationModel & {
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
      status: "blocked",
      evidence: "No separate machine-readable MFMA annexure workbook is present in docs/.",
      requiredForUnlock: true
    },
    {
      id: "municipality_code_match",
      label: "Municipality code/name match",
      status: unresolvedOutcomeMappings.length ? "in_progress" : "passed",
      evidence: `${mappedAuditOutcomes.length - unresolvedOutcomeMappings.length} exact mapping(s), ${unresolvedOutcomeMappings.length} unresolved mapping(s).`,
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
} = {
  id: "treasury_municipal_money_validation",
  label: "Treasury / Municipal Money validation",
  status: "blocked",
  summary: "Financial Pulse remains locked until source access, reuse permission, schema, formulas and freshness checks pass.",
  sourceStatus: sourceHealth.find((source) => source.sourceId === "municipal_money")?.status ?? "unknown",
  gates: [
    {
      id: "source_access",
      label: "Source access and connector",
      status: "not_started",
      evidence: "No live connector is enabled in this AGSA-first slice.",
      requiredForUnlock: true
    },
    {
      id: "reuse_permission",
      label: "Reuse and display permission",
      status: "not_started",
      evidence: "Reuse review has not been recorded in the repository.",
      requiredForUnlock: true
    },
    {
      id: "schema_fingerprint",
      label: "Schema fingerprint",
      status: "not_started",
      evidence: "No validated Municipal Money schema snapshot has been committed.",
      requiredForUnlock: true
    },
    {
      id: "formula_version",
      label: "Formula versioning",
      status: "not_started",
      evidence: "Financial Pulse formulas are not versioned against Treasury fields yet.",
      requiredForUnlock: true
    },
    {
      id: "freshness_sla",
      label: "Freshness SLA",
      status: "not_started",
      evidence: "No live pull timestamp, expected update cadence or stale-data treatment has been validated.",
      requiredForUnlock: true
    }
  ]
};

export const sourceValidationSummary = {
  annexures: annexureValidation,
  treasury: treasuryValidation,
  unlockRule: "Every required gate must pass before exact-annexure or Financial Pulse claims are published."
};
