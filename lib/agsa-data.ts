import extractJson from "@/data/agsa/generated/agsa-report-extract.json";
import type {
  Action,
  AgsaAuditOutcome,
  AgsaExtract,
  AgsaFinding,
  AgsaMaterialIrregularity,
  AgsaPageCitation,
  AgsaRecommendation,
  Briefing,
  DataFreshness,
  Municipality,
  QueueItem,
  Severity,
  SourceHealth,
  SourceReference
} from "./types";

export const agsaExtract = extractJson as AgsaExtract;
export const agsaDocuments = agsaExtract.documents;
export const agsaFindings = agsaExtract.findings;
export const agsaInitiatives = agsaExtract.initiatives;
export const agsaMaterialIrregularities = agsaExtract.materialIrregularities;
export const agsaRecommendations = agsaExtract.recommendations;
export const agsaPageCitations = agsaExtract.pageCitations;
export const extractionIssues = agsaExtract.extractionIssues;

const generatedAt = agsaExtract.generatedAt;
const municipalityAuditeeIds = ["ZA_GP_EKU", "ZA_GP_JHB", "ZA_GP_TSH", "ZA_GP_MER", "ZA_WC_CPT"];
const queueMunicipalityIds = ["ZA_GP_EKU", "ZA_GP_JHB", "ZA_GP_TSH", "ZA_GP_MER"];
const coordinatesByAuditee: Record<string, { x: number; y: number }> = {
  ZA_GP_EKU: { x: 69, y: 38 },
  ZA_GP_JHB: { x: 52, y: 46 },
  ZA_GP_TSH: { x: 45, y: 30 },
  ZA_GP_MER: { x: 29, y: 61 },
  ZA_WC_CPT: { x: 16, y: 82 }
};
const priorityByAuditee: Record<string, { severity: Severity; ipi: number; impact: string; posture: string }> = {
  ZA_GP_EKU: {
    severity: "critical",
    ipi: 88,
    impact: "High metro exposure",
    posture: "Executive decision required before next quarterly review"
  },
  ZA_GP_JHB: {
    severity: "high",
    ipi: 81,
    impact: "Major population and budget exposure",
    posture: "High-priority oversight with action evidence request"
  },
  ZA_GP_TSH: {
    severity: "high",
    ipi: 76,
    impact: "Metro service-delivery exposure",
    posture: "Maintain high-priority monitoring and require updated evidence"
  },
  ZA_GP_MER: {
    severity: "medium",
    ipi: 62,
    impact: "Local municipality support case",
    posture: "Analyst review required"
  },
  ZA_WC_CPT: {
    severity: "watch",
    ipi: 29,
    impact: "Clean-audit metro comparator",
    posture: "Comparator case for clean-audit control practices"
  }
};

const documentById = new Map(agsaDocuments.map((document) => [document.documentId, document]));
const citationById = new Map(agsaPageCitations.map((citation) => [citation.citationId, citation]));
const auditeeById = new Map(agsaExtract.auditees.map((auditee) => [auditee.auditeeId, auditee]));

function periodLabel(year: string) {
  return year.startsWith("FY ") ? year : `FY ${year}`;
}

function citationToSource(citationId: string): SourceReference {
  const citation = citationById.get(citationId);
  const document = citation ? documentById.get(citation.documentId) : undefined;

  if (!citation || !document) {
    return {
      id: citationId,
      label: "AGSA source reference",
      source: "AGSA report corpus",
      period: "Unknown",
      location: "Citation pending review",
      qualityState: "needs_review",
      url: "/sources"
    };
  }

  return {
    id: citation.citationId,
    label: `AGSA ${document.reportYear} p.${citation.pageNumber}`,
    source: document.title,
    period: document.reportYear,
    location: `${document.fileName}, page ${citation.pageNumber}${citation.sectionTitle ? `, ${citation.sectionTitle}` : ""}`,
    qualityState: citation.extractionConfidence === "needs_review" ? "needs_review" : document.qualityState,
    url: `/admin/agsa-review?documentId=${citation.documentId}&page=${citation.pageNumber}`
  };
}

function latestOutcome(auditeeId: string) {
  return agsaExtract.auditOutcomes
    .filter((outcome) => outcome.auditeeId === auditeeId)
    .sort((a, b) => b.financialYear.localeCompare(a.financialYear))[0];
}

function auditeeFindings(auditeeId: string) {
  return agsaFindings.filter((finding) => finding.auditeeId === auditeeId || finding.auditeeId === "LOCAL_GOVERNMENT");
}

function freshness(sourceType: DataFreshness["sourceType"], reportingPeriod = "FY 2024-25"): DataFreshness {
  return {
    sourceType,
    reportingPeriod,
    pulledAt: generatedAt,
    verifiedAt: generatedAt,
    expectedNextUpdate: sourceType === "AGSA" ? "2027-06-30T00:00:00+02:00" : null,
    status: sourceType === "AGSA" ? "current" : "under_review",
    stalenessReason:
      sourceType === "Treasury" ? "Not displayed as live until source health and formula governance pass." : undefined
  };
}

function toneForOutcome(outcome: AgsaAuditOutcome | undefined): "good" | "watch" | "risk" | "neutral" {
  if (!outcome) return "neutral";
  if (outcome.cleanAuditFlag) return "good";
  if (outcome.opinion.toLowerCase().includes("disclaimed") || outcome.movement === "regressed") return "risk";
  return "watch";
}

function riskTypeForFinding(finding: AgsaFinding): QueueItem["riskType"] {
  if (finding.findingFamily === "water") return "water";
  if (finding.findingFamily === "disaster_relief") return "disaster_relief";
  if (finding.findingFamily === "infrastructure") return "infrastructure";
  if (finding.findingFamily === "financial" || finding.findingFamily === "procurement") return "financial";
  return "audit";
}

function scoreForSeverity(severity: Severity, offset: number) {
  const base = severity === "critical" ? 92 : severity === "high" ? 82 : severity === "medium" ? 64 : 48;
  return Math.max(35, base - offset);
}

export const agsa2025: SourceReference =
  citationToSource("cit_mfma_2024_25_p7") ?? {
    id: "src_agsa_mfma_2024_25",
    label: "AGSA verified - FY 2024-25",
    source: "AGSA consolidated reports",
    period: "2024-25",
    location: "Generated AGSA extract",
    qualityState: "verified",
    url: "/sources"
  };

export const treasuryPending: SourceReference = {
  id: "src_treasury_pending",
  label: "Treasury pending validation",
  source: "Municipal Money / National Treasury Section 71 telemetry",
  period: "Phase 2 validation gate",
  location: "Connector disabled until source health, reuse, schema and formula checks pass",
  qualityState: "under_review",
  calculationVersion: "not-enabled"
};

export const municipalities: Municipality[] = municipalityAuditeeIds.map((auditeeId) => {
  const auditee = auditeeById.get(auditeeId);
  const outcome = latestOutcome(auditeeId);
  const findings = auditeeFindings(auditeeId);
  const priority = priorityByAuditee[auditeeId];
  const source = outcome ? citationToSource(outcome.citationId) : agsa2025;

  return {
    id: auditeeId,
    name: auditee?.canonicalName ?? auditeeId,
    commonName: auditee?.commonName ?? auditeeId,
    province: auditee?.province ?? "Gauteng",
    category: auditee?.category === "local" ? "local" : "metro",
    auditOutcome: outcome?.opinion ?? "Under review",
    interventionPriority: priority.severity,
    ipi: priority.ipi,
    householdImpact: priority.impact,
    situationSummary:
      `${auditee?.commonName ?? "This municipality"} is now projected from the AGSA extract. ` +
      `Latest available outcome is ${outcome?.opinion ?? "under review"} for ${outcome?.financialYear ?? "the current extract"}, ` +
      `with ${findings.length} AGSA finding signal${findings.length === 1 ? "" : "s"} linked into the workflow. ` +
      `${outcome?.cleanAuditFlag ? "This profile is used as a clean-audit comparator. " : ""}` +
      "Treasury telemetry remains gated.",
    posture: priority.posture,
    coordinates: coordinatesByAuditee[auditeeId],
    metrics: [
      {
        id: "audit_trajectory",
        label: "Audit trajectory",
        value: outcome?.movement ?? "Under review",
        change: outcome?.opinion ?? "Awaiting AGSA mapping",
        tone: toneForOutcome(outcome),
        definition: "Ordered audit outcome movement based on AGSA outcome taxonomy.",
        freshness: freshness("AGSA", periodLabel(outcome?.financialYear ?? "2024-25")),
        sources: [source]
      },
      {
        id: "agsa_findings",
        label: "AGSA findings",
        value: `${findings.length}`,
        change: findings.some((finding) => finding.repeatFlag) ? "Repeat signals present" : "No repeat signal mapped",
        tone: findings.some((finding) => finding.severity === "critical" || finding.severity === "high") ? "risk" : "watch",
        definition: "Structured findings extracted from AGSA annual and special reports.",
        freshness: freshness("AGSA"),
        sources: findings.slice(0, 2).map((finding) => citationToSource(finding.citationId))
      },
      {
        id: "financial_pulse",
        label: "Financial pulse",
        value: "Pending",
        change: "Treasury connector disabled",
        tone: "watch",
        definition: "Phase 2 Municipal Money telemetry after connector and reuse validation.",
        freshness: freshness("Treasury", "Pending validation"),
        sources: [treasuryPending]
      }
    ]
  };
});

const findingQueueItems: QueueItem[] = agsaFindings.slice(0, 6).map((finding, index) => {
  const municipalityId = queueMunicipalityIds[index % queueMunicipalityIds.length];
  const auditee = auditeeById.get(municipalityId);

  return {
    id: `qi_finding_${finding.findingId}`,
    rank: index + 1,
    municipalityId,
    title: finding.subtheme,
    riskType: riskTypeForFinding(finding),
    severity: finding.severity,
    priorityScore: scoreForSeverity(finding.severity, index * 3),
    reasonSummary: finding.description,
    whatChanged: finding.repeatFlag ? "Repeat AGSA finding remains active in the evidence workflow." : "New AGSA finding mapped into the intervention queue.",
    requiredNextStep: "Assign a responsible owner, request evidence, and attach AGSA citation to the case file.",
    owner: finding.severity === "critical" ? "Executive sponsor" : "Oversight analyst",
    dueDate: finding.severity === "critical" ? "2026-07-13" : "2026-07-20",
    status: finding.severity === "critical" ? "decision_required" : "assigned",
    evidenceRefs: [citationToSource(finding.citationId)]
  };
});

const miQueueItems: QueueItem[] = agsaMaterialIrregularities.map((mi, index) => ({
  id: `qi_mi_${mi.miId}`,
  rank: findingQueueItems.length + index + 1,
  municipalityId: queueMunicipalityIds[(index + 1) % queueMunicipalityIds.length],
  title: "Material irregularity lifecycle requires follow-up",
  riskType: "material_irregularity",
  severity: mi.status.toLowerCase().includes("resolved") ? "medium" : "high",
  priorityScore: scoreForSeverity(mi.status.toLowerCase().includes("resolved") ? "medium" : "high", index * 4),
  reasonSummary: mi.description,
  whatChanged: `MI status in AGSA extract: ${mi.status}.`,
  requiredNextStep: "Confirm responsible body, recovery/prevention amount, and next evidence gate.",
  owner: mi.referralBody ?? "Accounting officer",
  dueDate: "2026-07-24",
  status: "monitoring",
  evidenceRefs: [citationToSource(mi.citationId)]
}));

export const queueItems = [...findingQueueItems, ...miQueueItems]
  .sort((a, b) => b.priorityScore - a.priorityScore)
  .map((item, index) => ({ ...item, rank: index + 1 }));

export const actions: Action[] = agsaRecommendations.map((recommendation, index) => ({
  id: `act_${recommendation.recommendationId}`,
  municipalityId: recommendation.auditeeId && queueMunicipalityIds.includes(recommendation.auditeeId) ? recommendation.auditeeId : queueMunicipalityIds[index % queueMunicipalityIds.length],
  title: recommendation.action,
  linkedFinding: recommendation.reportId,
  owner: recommendation.ownerRole,
  reviewer: recommendation.priority === "p0" ? "Executive sponsor" : "Oversight reviewer",
  dueDate: recommendation.deadline ?? "2026-08-15",
  status: recommendation.priority === "p0" ? "overdue" : "under_review",
  requiredEvidence: ["Management response", "Implementation owner list", "AGSA citation check", "Reviewer sign-off"],
  escalationRule: "Critical or unresolved evidence after SLA breach moves to the intervention queue.",
  sourceRefs: [citationToSource(recommendation.citationId)]
}));

export const briefings: Briefing[] = [
  {
    id: "br_agsa_local_government",
    title: "AGSA Local Government Oversight Brief",
    template: "Weekly intervention brief",
    scope: "MFMA 2024-25 baseline and Gauteng pilot municipalities",
    status: "review",
    sections: ["Decision required", "Audit movement", "Priority risks", "Action owner status", "Source notes"],
    sourceRefs: [citationToSource("cit_mfma_2024_25_p7"), citationToSource("cit_mfma_2024_25_p26")]
  },
  {
    id: "br_water_value_chain",
    title: "Water Value Chain Initiative Brief",
    template: "Special report brief",
    scope: "Water infrastructure and service-delivery findings",
    status: "draft",
    sections: ["Initiative scope", "Service-delivery risk", "Responsible entities", "Evidence citations"],
    sourceRefs: [citationToSource("cit_water_p10")]
  },
  {
    id: "br_material_irregularities",
    title: "Material Irregularity Lifecycle Brief",
    template: "MI status brief",
    scope: "Unresolved and monitored MI records",
    status: "draft",
    sections: ["MI status", "Recovery/prevention amounts", "Referral body", "Next evidence gate"],
    sourceRefs: [citationToSource("cit_mi_status_p5")]
  }
];

export const sourceHealth: SourceHealth[] = [
  {
    sourceId: "agsa_corpus",
    sourceName: "AGSA report corpus",
    owner: "Auditor-General South Africa",
    accessClass: "B",
    status: extractionIssues.length ? "degraded" : "healthy",
    lastVerifiedAt: generatedAt,
    latestRun: `${agsaDocuments.length} PDFs inventoried and extracted from docs/`,
    publishedRecords: agsaDocuments.length + agsaPageCitations.length + agsaFindings.length,
    openExceptions: extractionIssues.length,
    treatment: "Primary AGSA evidence backbone for the MVP"
  },
  {
    sourceId: "agsa_extraction",
    sourceName: "Structured AGSA extraction",
    owner: "Platform data pipeline",
    accessClass: "C",
    status: extractionIssues.length ? "degraded" : "healthy",
    lastVerifiedAt: generatedAt,
    latestRun: `${agsaPageCitations.length} page citations generated with confidence flags`,
    publishedRecords:
      agsaExtract.auditOutcomes.length +
      agsaFindings.length +
      agsaMaterialIrregularities.length +
      agsaInitiatives.length +
      agsaRecommendations.length,
    openExceptions: extractionIssues.length,
    treatment: "Use confidence and citation fields before publishing derived assertions"
  },
  {
    sourceId: "municipal_money",
    sourceName: "Municipal Money / Treasury telemetry",
    owner: "National Treasury / OpenUp",
    accessClass: "A",
    status: "unknown",
    lastVerifiedAt: "Pending Phase 2 connector review",
    latestRun: "Disabled in MVP prototype",
    publishedRecords: 0,
    openExceptions: 1,
    treatment: "Do not display as live data until validation passes"
  },
  {
    sourceId: "client_workflow",
    sourceName: "Institutional workflow data",
    owner: "Pilot tenant",
    accessClass: "C",
    status: "degraded",
    lastVerifiedAt: "Under pilot configuration",
    latestRun: "Generated action workflow from AGSA recommendations",
    publishedRecords: actions.length,
    openExceptions: 0,
    treatment: "Internal only; never included in public MuniCheck"
  }
];

export const apiMeta = {
  requestId: "req_agsa_extract",
  generatedAt,
  warnings: [
    "AGSA records are extracted from local docs/ reports with page citations and confidence flags.",
    "Platform risk scores are workflow prioritisation aids, not legal findings.",
    "Treasury/Municipal Money telemetry is marked pending validation and is not presented as live."
  ],
  freshness: {
    agsa: "AGSA extracted - FY 2024-25 baseline plus prior years and special reports",
    treasury: "Pending validation"
  }
};

export function getAuditTimelineForMunicipality(municipalityId: string) {
  const direct = agsaExtract.auditOutcomes
    .filter((outcome) => outcome.auditeeId === municipalityId)
    .sort((a, b) => a.financialYear.localeCompare(b.financialYear))
    .map((outcome) => ({
      year: outcome.financialYear,
      outcome: outcome.opinion,
      movement: outcome.movement,
      note: outcome.notes,
      source: citationToSource(outcome.citationId)
    }));

  if (direct.length) return direct;

  return [
    {
      year: "2024-25",
      outcome: "Under review",
      movement: "needs_mapping",
      note: "No municipality-specific outcome mapped in the current AGSA extract.",
      source: agsa2025
    }
  ];
}

export const auditTimelines = Object.fromEntries(
  municipalityAuditeeIds.map((municipalityId) => [municipalityId, getAuditTimelineForMunicipality(municipalityId)])
);

export const auditTimeline = getAuditTimelineForMunicipality("ZA_GP_EKU");

export function getIpiComponentsForMunicipality(municipalityId: string) {
  const municipality = municipalities.find((item) => item.id === municipalityId);
  const findings = auditeeFindings(municipalityId);
  const unresolvedMis = agsaMaterialIrregularities.filter((mi) => !mi.status.toLowerCase().includes("resolved"));
  const actionCount = actions.filter((action) => action.municipalityId === municipalityId).length;

  return [
    {
      label: "Audit exposure",
      score: Math.min(25, Math.round((municipality?.ipi ?? 60) * 0.27)),
      max: 25,
      explanation: "Current outcome and AGSA movement determine the base exposure lane."
    },
    {
      label: "Repeat findings",
      score: Math.min(20, findings.filter((finding) => finding.repeatFlag).length * 5 + 8),
      max: 20,
      explanation: "Repeat AGSA findings increase oversight urgency."
    },
    {
      label: "Material irregularity exposure",
      score: Math.min(15, unresolvedMis.length * 4 + 3),
      max: 15,
      explanation: "MI treatment is tracked only where source-backed in AGSA reports."
    },
    {
      label: "Financial deterioration",
      score: 0,
      max: 20,
      explanation: "Reserved for Phase 2 Treasury validation."
    },
    {
      label: "Funding risk",
      score: 0,
      max: 10,
      explanation: "Disabled until Municipal Money reuse and formula checks pass."
    },
    {
      label: "Action overdue exposure",
      score: Math.min(10, actionCount * 3 + 3),
      max: 10,
      explanation: "Generated remediation items and evidence status affect the workflow lane."
    }
  ];
}

export const ipiComponents = getIpiComponentsForMunicipality("ZA_GP_EKU");

export const recoveryMilestones = [
  {
    id: "rm_water",
    title: "Water value chain response pack",
    owner: "Infrastructure oversight lead",
    dueDate: "2026-07-24",
    status: "pending_validation",
    blocker: "Special-report initiative needs owner evidence and municipal mapping review",
    evidence: "Water value chain AGSA citation pack"
  },
  {
    id: "rm_flood",
    title: "Flood relief control review",
    owner: "Disaster relief programme lead",
    dueDate: "2026-07-31",
    status: "off_track",
    blocker: "Delayed or incomplete project controls surfaced in AGSA special-report extraction",
    evidence: "Flood relief project status and consequence-management evidence"
  },
  {
    id: "rm_mi",
    title: "Material irregularity lifecycle review",
    owner: "Accounting officer liaison",
    dueDate: "2026-08-02",
    status: "on_track",
    blocker: "None",
    evidence: "MI status report extract with recovery/prevention amounts"
  }
];

export const evidenceChecklist = [
  "Source document attached or linked",
  "Source period and page/section captured",
  "Reviewer confirms municipality identifier",
  "Evidence matches required action outcome",
  "Closure rationale records residual risk",
  "Public profile excludes internal workflow notes"
];

export const sourceFreshnessEvents = [
  { sourceId: "agsa_corpus", event: "PDF inventory completed", status: "healthy", date: generatedAt },
  { sourceId: "agsa_extraction", event: "Structured extract generated", status: extractionIssues.length ? "degraded" : "healthy", date: generatedAt },
  { sourceId: "agsa_extraction", event: `${extractionIssues.length} low-confidence pages flagged`, status: "degraded", date: generatedAt },
  { sourceId: "municipal_money", event: "Connector disabled pending validation", status: "unknown", date: "Phase 2" },
  { sourceId: "client_workflow", event: "AGSA recommendations converted to draft actions", status: "degraded", date: generatedAt }
];

export const briefingTemplates = [
  {
    id: "tpl_weekly",
    name: "Weekly intervention brief",
    audience: "Executive sponsor",
    sections: ["Decision required", "What changed", "Priority risks", "Action owners", "Source notes"]
  },
  {
    id: "tpl_special_report",
    name: "Special report initiative brief",
    audience: "Initiative owner",
    sections: ["Initiative scope", "AGSA findings", "Impacted entities", "Required evidence"]
  },
  {
    id: "tpl_mi_lifecycle",
    name: "Material irregularity lifecycle brief",
    audience: "Accounting officer and oversight committee",
    sections: ["MI status", "Financial loss/recovery", "Referral body", "Next action"]
  }
];

export const publicProfiles = municipalities.map((municipality) => {
  const outcome = latestOutcome(municipality.id);
  return {
    municipalityId: municipality.id,
    name: municipality.name,
    plainLanguageStatus:
      municipality.interventionPriority === "critical"
        ? "This municipality has audit issues that need senior oversight attention."
        : "This municipality is being monitored through public AGSA evidence.",
    auditOutcome: municipality.auditOutcome,
    sourcePeriod: outcome?.financialYear ?? "2024-25",
    citation: outcome ? citationToSource(outcome.citationId) : agsa2025,
    publicFields: ["Audit outcome", "Source period", "Plain-language explanation", "Methodology note"],
    hiddenFields: ["Internal notes", "Institutional action comments", "Restricted evidence"]
  };
});

export const muniDataEndpoints = [
  { method: "GET", path: "/v1/municipalities", access: "Public developer", description: "Filterable municipality directory backed by AGSA records." },
  { method: "GET", path: "/v1/municipalities/{id}/case-file", access: "Institutional", description: "Source-backed case file with citations, queue and actions." },
  { method: "GET", path: "/v1/municipalities/{id}/audit-history", access: "Public safe", description: "Year-specific AGSA audit outcomes where mapped." },
  { method: "GET", path: "/v1/intervention-queue", access: "Institutional", description: "Ranked AGSA-derived risks with evidence references." },
  { method: "GET", path: "/v1/agsa/documents", access: "Public safe", description: "Ingested AGSA report inventory and metadata." },
  { method: "GET", path: "/v1/agsa/findings", access: "Institutional", description: "Structured AGSA findings with citation IDs." },
  { method: "GET", path: "/v1/material-irregularities", access: "Institutional", description: "MI lifecycle records extracted from AGSA reporting." },
  { method: "GET", path: "/v1/initiatives", access: "Institutional", description: "Special-report initiative datasets including water and disaster relief." },
  { method: "GET", path: "/v1/data-freshness", access: "Public safe", description: "Source status, freshness records and extraction exceptions." },
  { method: "POST", path: "/v1/assistant/query", access: "Institutional", description: "Source-locked answer policy endpoint." }
];

export function getFindingsForMunicipality(municipalityId: string) {
  return auditeeFindings(municipalityId).map((finding) => ({
    ...finding,
    source: citationToSource(finding.citationId)
  }));
}

export function getMaterialIrregularitiesForMunicipality(_municipalityId: string) {
  return agsaMaterialIrregularities.map((mi) => ({
    ...mi,
    source: citationToSource(mi.citationId)
  }));
}

export function getRecommendationsForMunicipality(municipalityId: string) {
  return agsaRecommendations
    .filter((recommendation) => !recommendation.auditeeId || recommendation.auditeeId === municipalityId)
    .map((recommendation) => ({
      ...recommendation,
      source: citationToSource(recommendation.citationId)
    }));
}
