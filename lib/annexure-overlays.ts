import type {
  AgsaAuditee,
  AgsaAuditOutcome,
  AgsaMappedAuditOutcome,
  AgsaOutcomeMappingConfidence,
  AgsaPageCitation,
  AgsaSourceDocument,
  SourceReference
} from "./types";

export type AnnexureOutcomeRow = {
  municipalityCode?: string;
  municipalityName?: string;
  financialYear?: string;
  auditOutcome?: string;
  movement?: string;
  sourceDocument?: string;
  sourcePage?: string | number;
};

export function confidenceForOutcome(outcome: AgsaAuditOutcome): { mappingConfidence: AgsaOutcomeMappingConfidence; mappingRationale: string } {
  if (outcome.opinion.includes("cohort") || outcome.notes.toLowerCase().includes("cohort")) {
    return {
      mappingConfidence: "cohort_derived",
      mappingRationale: "Outcome is derived from AGSA metro/province cohort text and awaits municipality-level annexure validation."
    };
  }

  if (outcome.notes.toLowerCase().includes("annexure validation") || outcome.notes.toLowerCase().includes("support case")) {
    return {
      mappingConfidence: "needs_review",
      mappingRationale: "Outcome is mapped from available report context but requires municipality-specific annexure confirmation."
    };
  }

  if (outcome.cleanAuditFlag || outcome.financialYear !== "2024-25") {
    return {
      mappingConfidence: "exact",
      mappingRationale: "Outcome is linked to a municipality-specific AGSA statement in the extracted report corpus."
    };
  }

  return {
    mappingConfidence: "manual",
    mappingRationale: "Outcome was manually mapped from the local AGSA source pack and should remain reviewable."
  };
}

export function findAnnexureOutcome(
  outcome: AgsaAuditOutcome,
  auditee: AgsaAuditee | undefined,
  rows: AnnexureOutcomeRow[] = []
) {
  return rows.find((row) => {
    const code = row.municipalityCode?.toLowerCase();
    const name = row.municipalityName?.toLowerCase();
    const year = row.financialYear;
    return Boolean(code || name) && year === outcome.financialYear && (
      code === outcome.auditeeId.toLowerCase() ||
      code === auditee?.canonicalCode?.toLowerCase() ||
      code === auditee?.commonName.toLowerCase() ||
      name === auditee?.canonicalName.toLowerCase() ||
      name === auditee?.commonName.toLowerCase()
    );
  });
}

export function annexureCitationId(
  row: AnnexureOutcomeRow,
  fallbackCitationId: string,
  documents: AgsaSourceDocument[],
  citations: AgsaPageCitation[]
) {
  const pageNumber = Number(row.sourcePage);
  const document = documents.find(
    (candidate) => candidate.documentId === row.sourceDocument || candidate.fileName === row.sourceDocument
  );
  const citation = document && Number.isFinite(pageNumber)
    ? citations.find((candidate) => candidate.documentId === document.documentId && candidate.pageNumber === pageNumber)
    : undefined;

  return citation?.citationId ?? fallbackCitationId;
}

export function mapAuditOutcomeWithAnnexure(
  outcome: AgsaAuditOutcome,
  options: {
    auditee?: AgsaAuditee;
    annexureRows?: AnnexureOutcomeRow[];
    documents: AgsaSourceDocument[];
    citations: AgsaPageCitation[];
    citationToSource: (citationId: string) => SourceReference;
  }
): AgsaMappedAuditOutcome {
  const annexureOutcome = findAnnexureOutcome(outcome, options.auditee, options.annexureRows);
  const citationId = annexureOutcome
    ? annexureCitationId(annexureOutcome, outcome.citationId, options.documents, options.citations)
    : outcome.citationId;

  if (annexureOutcome?.auditOutcome) {
    return {
      ...outcome,
      opinion: annexureOutcome.auditOutcome,
      movement: annexureOutcome.movement || outcome.movement,
      notes:
        `Exact municipality-level outcome imported from official MFMA annexure manifest. ` +
        `Original extracted note: ${outcome.notes}`,
      citationId,
      mappingConfidence: "exact",
      mappingRationale:
        `Outcome promoted from ${confidenceForOutcome(outcome).mappingConfidence.split("_").join(" ")} ` +
        "using the official MFMA annexure import manifest.",
      source: options.citationToSource(citationId)
    };
  }

  return {
    ...outcome,
    ...confidenceForOutcome(outcome),
    source: options.citationToSource(citationId)
  };
}
