import "server-only";

import {
  agsaDocuments,
  agsaFindings,
  agsaInitiatives,
  agsaPageCitations,
  mappedAuditOutcomes,
  municipalities,
  queueItems
} from "./pilot-data";
import { applyReviewOverlay } from "./review-overlays";
import type { SourceReference } from "./types";

export type SourceSearchResult = {
  id: string;
  type: "finding" | "outcome" | "citation" | "document" | "queue_item" | "initiative";
  title: string;
  summary: string;
  score: number;
  confidence: "high" | "medium" | "low" | "needs_review";
  citation?: SourceReference;
  documentId?: string;
  pageNumber?: number;
  period?: string;
  path?: string;
  reviewStatus?: string;
  publicationState?: string;
};

const citationById = new Map(agsaPageCitations.map((citation) => [citation.citationId, citation]));
const documentById = new Map(agsaDocuments.map((document) => [document.documentId, document]));
const municipalityById = new Map(municipalities.map((municipality) => [municipality.id, municipality]));

function present<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function words(query: string) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((word) => word.length > 2);
}

function scoreText(text: string, terms: string[]) {
  const haystack = text.toLowerCase();
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

function sourceForCitation(citationId: string): SourceReference | undefined {
  const citation = citationById.get(citationId);
  const document = citation ? documentById.get(citation.documentId) : undefined;
  if (!citation || !document) return undefined;

  return {
    id: citation.citationId,
    label: `AGSA ${document.reportYear} p.${citation.pageNumber}`,
    source: document.title,
    period: document.reportYear,
    location: `${document.fileName}, page ${citation.pageNumber}${citation.sectionTitle ? `, ${citation.sectionTitle}` : ""}`,
    qualityState: citation.extractionConfidence === "needs_review" ? "needs_review" : document.qualityState,
    url: `/sources/${document.documentId}`
  };
}

function confidenceForCitation(citationId?: string): SourceSearchResult["confidence"] {
  if (!citationId) return "needs_review";
  return citationById.get(citationId)?.extractionConfidence ?? "needs_review";
}

function resultScore(base: number, text: string, terms: string[]) {
  return base + scoreText(text, terms) * 10;
}

export function searchAgsaEvidence(query: string, limit = 8): SourceSearchResult[] {
  const terms = words(query);
  if (!terms.length) return [];

  const findingResults = agsaFindings
    .map((finding) => {
      const reviewed = applyReviewOverlay(finding);
      if (reviewed.publicationState === "excluded") return null;

      const municipality = municipalityById.get(finding.auditeeId);
      const text = [finding.subtheme, finding.description, finding.impact, finding.findingFamily, municipality?.name].join(" ");
      const score = resultScore(finding.repeatFlag ? 12 : 8, text, terms);
      if (score <= 8) return null;

      return {
        id: finding.findingId,
        type: "finding" as const,
        title: finding.subtheme,
        summary: finding.description,
        score,
        confidence: confidenceForCitation(finding.citationId),
        citation: sourceForCitation(finding.citationId),
        documentId: citationById.get(finding.citationId)?.documentId,
        pageNumber: citationById.get(finding.citationId)?.pageNumber,
        period: finding.financialYear,
        path: `/findings/${finding.findingId}`,
        reviewStatus: reviewed.reviewStatus,
        publicationState: reviewed.publicationState
      };
    })
    .filter(present);

  const outcomeResults = mappedAuditOutcomes
    .map((outcome) => {
      const reviewed = applyReviewOverlay(outcome);
      if (reviewed.publicationState === "excluded") return null;

      const municipality = municipalityById.get(outcome.auditeeId);
      const text = [municipality?.name, outcome.opinion, outcome.movement, outcome.notes, outcome.mappingConfidence].join(" ");
      const score = resultScore(outcome.mappingConfidence === "exact" ? 10 : 6, text, terms);
      if (score <= 6) return null;

      return {
        id: `${outcome.auditeeId}_${outcome.financialYear}`,
        type: "outcome" as const,
        title: `${municipality?.name ?? outcome.auditeeId}: ${reviewed.opinion}`,
        summary: reviewed.notes,
        score,
        confidence: confidenceForCitation(outcome.citationId),
        citation: sourceForCitation(outcome.citationId),
        documentId: citationById.get(outcome.citationId)?.documentId,
        pageNumber: citationById.get(outcome.citationId)?.pageNumber,
        period: outcome.financialYear,
        path: `/municipalities/${outcome.auditeeId}`,
        reviewStatus: reviewed.reviewStatus,
        publicationState: reviewed.publicationState
      };
    })
    .filter(present);

  const citationResults = agsaPageCitations
    .map((citation) => {
      const reviewed = applyReviewOverlay({ citationId: citation.citationId, quoteSnippet: citation.quoteSnippet ?? "" });
      if (reviewed.publicationState === "excluded") return null;

      const document = documentById.get(citation.documentId);
      const text = [document?.title, document?.theme, citation.sectionTitle, citation.quoteSnippet].join(" ");
      const score = resultScore(4, text, terms);
      if (score <= 4) return null;

      return {
        id: citation.citationId,
        type: "citation" as const,
        title: `${document?.title ?? "AGSA document"} p.${citation.pageNumber}`,
        summary: citation.quoteSnippet ?? citation.sectionTitle ?? "AGSA page citation",
        score,
        confidence: citation.extractionConfidence,
        citation: sourceForCitation(citation.citationId),
        documentId: citation.documentId,
        pageNumber: citation.pageNumber,
        period: document?.reportYear,
        path: document ? `/sources/${document.documentId}` : "/sources",
        reviewStatus: reviewed.reviewStatus,
        publicationState: reviewed.publicationState
      };
    })
    .filter(present);

  const documentResults = agsaDocuments
    .map((document) => {
      const text = [document.title, document.fileName, document.scope, document.theme, document.reportFamily].join(" ");
      const score = resultScore(3, text, terms);
      if (score <= 3) return null;
      const confidence: SourceSearchResult["confidence"] = document.qualityState === "needs_review" ? "needs_review" : "high";
      const publicationState: SourceSearchResult["publicationState"] =
        document.qualityState === "needs_review" ? "needs_review" : "publishable";

      return {
        id: document.documentId,
        type: "document" as const,
        title: document.title,
        summary: `${document.scope} ${document.theme}`,
        score,
        confidence,
        documentId: document.documentId,
        period: document.reportYear,
        path: `/sources/${document.documentId}`,
        publicationState
      };
    })
    .filter(present);

  const queueResults = queueItems
    .map((item) => {
      const text = [item.title, item.reasonSummary, item.whatChanged, item.requiredNextStep, item.riskType].join(" ");
      const score = resultScore(5, text, terms);
      if (score <= 5) return null;

      return {
        id: item.id,
        type: "queue_item" as const,
        title: item.title,
        summary: item.reasonSummary,
        score,
        confidence: "medium" as const,
        citation: item.evidenceRefs[0],
        period: item.evidenceRefs[0]?.period,
        path: "/intervention-queue",
        publicationState: "needs_review"
      };
    })
    .filter(present);

  const initiativeResults = agsaInitiatives
    .map((initiative) => {
      const text = [
        initiative.name,
        initiative.initiativeType,
        initiative.location,
        initiative.progressStatus,
        initiative.qualityIssues.join(" "),
        initiative.responsibleEntities.join(" ")
      ].join(" ");
      const score = resultScore(5, text, terms);
      if (score <= 5) return null;

      return {
        id: initiative.initiativeId,
        type: "initiative" as const,
        title: initiative.name,
        summary: `${initiative.location} is ${initiative.progressStatus}. ${initiative.qualityIssues.join("; ")}`,
        score,
        confidence: "medium" as const,
        documentId: initiative.reportId,
        period: documentById.get(initiative.reportId)?.reportYear,
        path: "/recovery",
        publicationState: "needs_review"
      };
    })
    .filter(present);

  return [
    ...findingResults,
    ...outcomeResults,
    ...citationResults,
    ...documentResults,
    ...queueResults,
    ...initiativeResults
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function answerSourceLockedQuery(query: string) {
  const results = searchAgsaEvidence(query, 5);

  if (!results.length) {
    return {
      answer: null,
      confidence: "unsupported",
      refusal: "No AGSA source in the current corpus supports that answer. No source means no assertion.",
      results,
      requiredAnswerParts: [
        "direct answer",
        "data coverage and period",
        "evidence citations",
        "filters/calculation",
        "confidence/completeness label",
        "suggested follow-up actions"
      ]
    };
  }

  const citations = results
    .filter((result) => result.citation)
    .map((result) => ({
      id: result.citation?.id,
      label: result.citation?.label,
      source: result.citation?.source,
      location: result.citation?.location,
      period: result.citation?.period,
      url: result.citation?.url
    }));

  return {
    answer:
      `The current AGSA corpus has ${results.length} source-backed result${results.length === 1 ? "" : "s"} for "${query}". ` +
      `The strongest signal is "${results[0].title}": ${results[0].summary}`,
    confidence: results.some((result) => result.confidence === "needs_review" || result.publicationState === "needs_review")
      ? "partial_review_required"
      : "source_backed",
    coverage: {
      source: "Local AGSA report corpus",
      periods: Array.from(new Set(results.map((result) => result.period).filter(Boolean))),
      resultTypes: Array.from(new Set(results.map((result) => result.type)))
    },
    citations,
    results,
    filtersAndCalculation: "Keyword match across AGSA findings, audit outcomes, page citations, source documents, queue items and initiatives.",
    suggestedFollowUpActions: [
      "Open the cited source page before publishing a claim.",
      "Resolve review decisions for any needs-review or corrected citation.",
      "Create or update an action only when the cited evidence supports the remediation step."
    ],
    refusalRule: "No source means no assertion."
  };
}
