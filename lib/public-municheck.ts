import "server-only";

import {
  getAuditTimelineForMunicipality,
  getFindingsForMunicipality,
  municipalities,
  publicProfiles
} from "./pilot-data";
import { publicSafeReviewOverlay } from "./review-overlays";

function present<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

const methodology = [
  "AGSA source-published evidence only.",
  "Platform priority scores are workflow aids, not legal findings.",
  "Treasury telemetry remains pending validation.",
  "Internal workflow notes, action comments and restricted evidence are excluded from public profiles."
];

export function listPublicMuniCheckProfiles() {
  return publicProfiles
    .map((profile) => {
      const reviewed = profile.citation?.id
        ? publicSafeReviewOverlay({ citationId: profile.citation.id, auditOutcome: profile.auditOutcome })
        : null;

      if (reviewed?.publicationState === "excluded") return null;

      return {
        municipalityId: profile.municipalityId,
        name: profile.name,
        plainLanguageStatus: profile.plainLanguageStatus,
        auditOutcome: reviewed?.auditOutcome ?? profile.auditOutcome,
        sourcePeriod: profile.sourcePeriod,
        citation: profile.citation,
        publicFields: profile.publicFields,
        methodology,
        reviewStatus: reviewed?.reviewStatus ?? "not_reviewed",
        publicationState: reviewed?.publicationState ?? "needs_review"
      };
    })
    .filter(present);
}

export function getPublicMuniCheckProfile(municipalityId: string) {
  const profile = listPublicMuniCheckProfiles().find((item) => item?.municipalityId === municipalityId);
  const municipality = municipalities.find((item) => item.id === municipalityId);

  if (!profile || !municipality) return null;

  const auditTimeline = getAuditTimelineForMunicipality(municipalityId)
    .map((entry) =>
      entry.source?.id
        ? publicSafeReviewOverlay({
            citationId: entry.source.id,
            year: entry.year,
            outcome: entry.outcome,
            movement: entry.movement,
            note: entry.note,
            mappingConfidence: "mappingConfidence" in entry ? entry.mappingConfidence : "needs_review",
            mappingRationale: "mappingRationale" in entry ? entry.mappingRationale : "Municipality-specific mapping is still under review.",
            source: entry.source
          })
        : entry
    )
    .filter(present);

  const findings = getFindingsForMunicipality(municipalityId)
    .map((finding) =>
      publicSafeReviewOverlay({
        citationId: finding.citationId,
        findingId: finding.findingId,
        financialYear: finding.financialYear,
        findingFamily: finding.findingFamily,
        subtheme: finding.subtheme,
        severity: finding.severity,
        description: finding.description,
        impact: finding.impact,
        repeatFlag: finding.repeatFlag,
        source: finding.source
      })
    )
    .filter(present);

  return {
    ...profile,
    province: municipality.province,
    category: municipality.category,
    auditTimeline,
    findings,
    publicSafety: {
      hiddenFields: ["Internal notes", "Institutional action comments", "Restricted evidence", "Draft remediation workflow"],
      methodology,
      treasuryStatus: "pending_validation"
    }
  };
}
