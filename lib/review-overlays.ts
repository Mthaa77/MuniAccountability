import "server-only";

import { getDecisionForCitation } from "./agsa-review-store";
import type { AgsaReviewDecision } from "./types";

type CitationBackedRecord = {
  citationId?: string;
};

type ReviewOverlay<T> = T & {
  reviewStatus: AgsaReviewDecision["status"] | "not_reviewed";
  reviewDecision?: AgsaReviewDecision;
  publicationState: "publishable" | "corrected" | "excluded" | "needs_review";
  correctionApplied?: boolean;
  originalValue?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getReplacementField(decision: AgsaReviewDecision) {
  return decision.replacementField?.trim();
}

export function applyReviewOverlay<T extends CitationBackedRecord>(record: T): ReviewOverlay<T> {
  const citationId = record.citationId;
  const decision = citationId ? getDecisionForCitation(citationId) : undefined;

  if (!decision) {
    return {
      ...record,
      reviewStatus: "not_reviewed",
      publicationState: "needs_review"
    };
  }

  if (decision.status === "excluded") {
    return {
      ...record,
      reviewStatus: decision.status,
      reviewDecision: decision,
      publicationState: "excluded"
    };
  }

  if (decision.status === "correction") {
    const field = getReplacementField(decision);
    const replacementValue = decision.replacementValue ?? decision.replacementText;

    if (field && replacementValue !== undefined && isRecord(record) && field in record) {
      return {
        ...record,
        [field]: replacementValue,
        reviewStatus: decision.status,
        reviewDecision: decision,
        publicationState: "corrected",
        correctionApplied: true,
        originalValue: record[field as keyof T]
      };
    }

    return {
      ...record,
      reviewStatus: decision.status,
      reviewDecision: decision,
      publicationState: "corrected",
      correctionApplied: false
    };
  }

  return {
    ...record,
    reviewStatus: decision.status,
    reviewDecision: decision,
    publicationState: "publishable"
  };
}

export function applyReviewOverlays<T extends CitationBackedRecord>(records: T[]) {
  return records.map((record) => applyReviewOverlay(record));
}

export function publicSafeReviewOverlay<T extends CitationBackedRecord>(record: T) {
  const reviewed = applyReviewOverlay(record);
  return reviewed.publicationState !== "excluded" ? reviewed : null;
}
