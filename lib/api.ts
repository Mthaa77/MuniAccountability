import {
  actions,
  apiMeta,
  agsaDocuments,
  agsaExtract,
  agsaFindings,
  agsaInitiatives,
  agsaMaterialIrregularities,
  agsaPageCitations,
  agsaRecommendations,
  auditTimeline,
  auditTimelines,
  briefings,
  briefingTemplates,
  evidenceChecklist,
  extractionIssues,
  getAuditTimelineForMunicipality,
  getFindingsForMunicipality,
  getIpiComponentsForMunicipality,
  getMaterialIrregularitiesForMunicipality,
  getRecommendationsForMunicipality,
  ipiComponents,
  municipalities,
  muniDataEndpoints,
  publicProfiles,
  queueItems,
  recoveryMilestones,
  sourceFreshnessEvents,
  sourceHealth
} from "./pilot-data";

export function apiResponse<T>(data: T, filters: Record<string, string | number | null> = {}) {
  return {
    data,
    meta: {
      ...apiMeta,
      filters,
      pagination: null,
      sources: ["agsa_mfma", "municipal_money_pending", "client_workflow"],
      warnings: apiMeta.warnings
    }
  };
}

export function getMunicipality(id: string) {
  return municipalities.find((municipality) => municipality.id === id);
}

export function getCaseFile(id: string) {
  const municipality = getMunicipality(id);

  if (!municipality) {
    return null;
  }

  return {
    municipality,
    queueItems: queueItems.filter((item) => item.municipalityId === id),
    actions: actions.filter((action) => action.municipalityId === id),
    findings: getFindingsForMunicipality(id),
    materialIrregularities: getMaterialIrregularitiesForMunicipality(id),
    recommendations: getRecommendationsForMunicipality(id),
    ipiComponents: getIpiComponentsForMunicipality(id),
    auditHistory: getAuditTimelineForMunicipality(id),
    timeline: [
      {
        date: apiMeta.generatedAt,
        title: "AGSA case file generated",
        detail: "Normalized AGSA records were projected into municipality, queue, action, and citation views."
      },
      {
        date: "2026-06-24",
        title: "Latest MFMA baseline tabled",
        detail: "2024-25 local government outcomes are the first baseline for municipal oversight."
      },
      {
        date: "Phase 2",
        title: "Treasury telemetry validation",
        detail: "Municipal Money connector remains disabled until source health and reuse checks pass."
      }
    ]
  };
}

export const apiDatasets = {
  municipalities,
  queueItems,
  actions,
  briefings,
  sourceHealth,
  agsaExtract,
  agsaDocuments,
  agsaFindings,
  agsaInitiatives,
  agsaMaterialIrregularities,
  agsaRecommendations,
  agsaPageCitations,
  extractionIssues,
  auditTimeline,
  auditTimelines,
  ipiComponents,
  recoveryMilestones,
  evidenceChecklist,
  sourceFreshnessEvents,
  briefingTemplates,
  publicProfiles,
  muniDataEndpoints
};
