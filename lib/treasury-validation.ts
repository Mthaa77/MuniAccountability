export type TreasuryValidationManifest = {
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

export type FinancialPulseFormulaRegistry = {
  schemaVersion: string;
  updatedAt: string;
  status: "draft" | "validated";
  formulas: Array<{
    id: string;
    metric: string;
    label: string;
    version: string;
    status: "draft" | "validated";
    expression: string;
    requiredFields: string[];
    unit: string;
    displayGate: "blocked_until_validated" | "publishable";
    notes: string;
  }>;
};

export type TreasuryFormulaReadiness = {
  requiredFormulaCount: number;
  validatedFormulaCount: number;
  missingFormulaMetrics: string[];
  missingSchemaFields: string[];
  publishable: boolean;
};

export function evaluateFormulaReadiness(
  manifest: TreasuryValidationManifest,
  registry: FinancialPulseFormulaRegistry
): TreasuryFormulaReadiness {
  const validatedManifestMetrics = new Set(manifest.formulaVersions.map((formula) => formula.metric));
  const validatedFields = new Set(manifest.schemaFingerprint.validatedFields);
  const requiredFields = new Set(registry.formulas.flatMap((formula) => formula.requiredFields));
  const missingFormulaMetrics = registry.formulas
    .filter((formula) => formula.status !== "validated" || !validatedManifestMetrics.has(formula.metric))
    .map((formula) => formula.metric);
  const missingSchemaFields = Array.from(requiredFields).filter((field) => !validatedFields.has(field));
  const validatedFormulaCount = registry.formulas.length - missingFormulaMetrics.length;

  return {
    requiredFormulaCount: registry.formulas.length,
    validatedFormulaCount,
    missingFormulaMetrics,
    missingSchemaFields,
    publishable:
      registry.status === "validated" &&
      missingFormulaMetrics.length === 0 &&
      missingSchemaFields.length === 0 &&
      manifest.schemaFingerprint.status === "validated"
  };
}

export function canUnlockFinancialPulse(
  manifest: TreasuryValidationManifest,
  registry: FinancialPulseFormulaRegistry
) {
  const formulaReadiness = evaluateFormulaReadiness(manifest, registry);
  const gates = {
    connector: manifest.connector.status === "validated",
    reuse: manifest.reuseReview.status === "approved",
    schema: manifest.schemaFingerprint.status === "validated" && formulaReadiness.missingSchemaFields.length === 0,
    formulas: formulaReadiness.publishable,
    freshness: manifest.freshness.status === "validated"
  };

  return {
    unlocked:
      manifest.status === "unlocked" &&
      manifest.unlockDecision.status === "unlocked" &&
      Object.values(gates).every(Boolean),
    gates,
    formulaReadiness
  };
}
