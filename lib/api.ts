import {
  actions,
  apiMeta,
  auditTimeline,
  briefings,
  briefingTemplates,
  evidenceChecklist,
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
    timeline: [
      {
        date: "2026-07-06",
        title: "Pilot case file published",
        detail: "AGSA-first case file assembled with source citations and action workflow seed."
      },
      {
        date: "2026-07-05",
        title: "AGSA source pack loaded",
        detail: "2024-25 consolidated report added as authoritative Phase 1 baseline."
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
  auditTimeline,
  ipiComponents,
  recoveryMilestones,
  evidenceChecklist,
  sourceFreshnessEvents,
  briefingTemplates,
  publicProfiles,
  muniDataEndpoints
};
