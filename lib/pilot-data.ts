import type { Action, Briefing, Municipality, QueueItem, SourceHealth, SourceReference } from "./types";

export const agsa2025: SourceReference = {
  id: "src_agsa_mfma_2024_25",
  label: "AGSA verified · FY 2024-25",
  source: "AGSA Consolidated General Report on Local Government Audit Outcomes 2024-25",
  period: "2024-25",
  location: "General report, pages 27-39; source bundle includes mfma_report_2024_25.pdf",
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

export const municipalities: Municipality[] = [
  {
    id: "ZA_GP_EKU",
    name: "City of Ekurhuleni Metropolitan Municipality",
    commonName: "Ekurhuleni",
    province: "Gauteng",
    category: "metro",
    auditOutcome: "Unqualified with findings",
    interventionPriority: "critical",
    ipi: 86,
    householdImpact: "High metro exposure",
    situationSummary:
      "Metro governance and financial controls require executive oversight. AGSA reported metro regressions and financial distress indicators; Treasury telemetry remains gated until Phase 2 validation.",
    posture: "Executive decision required before next quarterly review",
    coordinates: { x: 69, y: 38 },
    metrics: [
      {
        id: "audit_trajectory",
        label: "Audit trajectory",
        value: "Regressed",
        change: "Metro cohort concern",
        tone: "risk",
        definition: "Ordered audit outcome movement based on AGSA outcome taxonomy.",
        freshness: {
          sourceType: "AGSA",
          reportingPeriod: "FY 2024-25",
          pulledAt: "2026-07-05T09:47:00+02:00",
          verifiedAt: "2026-07-06T02:30:00+02:00",
          expectedNextUpdate: "2027-06-30T00:00:00+02:00",
          status: "current"
        },
        sources: [agsa2025]
      },
      {
        id: "financial_pulse",
        label: "Financial pulse",
        value: "Pending",
        change: "Treasury connector disabled",
        tone: "watch",
        definition: "Phase 2 Municipal Money telemetry after connector and reuse validation.",
        freshness: {
          sourceType: "Treasury",
          reportingPeriod: "Pending validation",
          pulledAt: null,
          verifiedAt: null,
          expectedNextUpdate: null,
          status: "under_review",
          stalenessReason: "Not displayed as live until source health and formula governance pass."
        },
        sources: [treasuryPending]
      }
    ]
  },
  {
    id: "ZA_GP_JHB",
    name: "City of Johannesburg Metropolitan Municipality",
    commonName: "Johannesburg",
    province: "Gauteng",
    category: "metro",
    auditOutcome: "Unqualified with findings",
    interventionPriority: "high",
    ipi: 78,
    householdImpact: "Major population and budget exposure",
    situationSummary:
      "Audit and performance reporting weaknesses place Johannesburg in the high-priority review lane. Evidence review should focus on repeat findings, owner assignment and source-cited briefing outputs.",
    posture: "High-priority oversight with action evidence request",
    coordinates: { x: 52, y: 46 },
    metrics: [
      {
        id: "repeat_findings",
        label: "Repeat findings",
        value: "Active",
        change: "Action evidence needed",
        tone: "risk",
        definition: "Repeat or unresolved finding categories that remain operationally relevant.",
        freshness: {
          sourceType: "AGSA",
          reportingPeriod: "FY 2024-25",
          pulledAt: "2026-07-05T09:47:00+02:00",
          verifiedAt: "2026-07-06T02:30:00+02:00",
          expectedNextUpdate: "2027-06-30T00:00:00+02:00",
          status: "current"
        },
        sources: [agsa2025]
      }
    ]
  },
  {
    id: "ZA_GP_TSH",
    name: "City of Tshwane Metropolitan Municipality",
    commonName: "Tshwane",
    province: "Gauteng",
    category: "metro",
    auditOutcome: "Unqualified with findings",
    interventionPriority: "high",
    ipi: 74,
    householdImpact: "Metro service-delivery exposure",
    situationSummary:
      "Tshwane remains a high-priority case file for governance, compliance and action follow-through. Current release uses AGSA evidence only; financial telemetry is clearly marked pending.",
    posture: "Maintain high-priority monitoring and require updated evidence",
    coordinates: { x: 45, y: 30 },
    metrics: [
      {
        id: "actions_overdue",
        label: "Corrective actions overdue",
        value: "2",
        change: "Needs review",
        tone: "watch",
        definition: "Open corrective actions past due date without accepted evidence.",
        freshness: {
          sourceType: "Institution",
          reportingPeriod: "Pilot workflow seed",
          pulledAt: "2026-07-06T02:30:00+02:00",
          verifiedAt: null,
          expectedNextUpdate: "2026-07-13T09:00:00+02:00",
          status: "under_review"
        },
        sources: [agsa2025]
      }
    ]
  },
  {
    id: "ZA_GP_MER",
    name: "Merafong City Local Municipality",
    commonName: "Merafong City",
    province: "Gauteng",
    category: "local",
    auditOutcome: "Qualified with findings",
    interventionPriority: "medium",
    ipi: 61,
    householdImpact: "Local municipality support case",
    situationSummary:
      "Merafong is suited to analyst review rather than immediate executive escalation. The case file highlights source-backed audit posture, actions, and data quality needs.",
    posture: "Analyst review required",
    coordinates: { x: 29, y: 61 },
    metrics: [
      {
        id: "data_quality",
        label: "Data quality",
        value: "Review",
        change: "Municipality mapping check",
        tone: "watch",
        definition: "Data steward review status for canonical municipality mapping and source links.",
        freshness: {
          sourceType: "Platform",
          reportingPeriod: "Pilot setup",
          pulledAt: "2026-07-06T02:30:00+02:00",
          verifiedAt: null,
          expectedNextUpdate: "2026-07-08T17:00:00+02:00",
          status: "under_review"
        },
        sources: [agsa2025]
      }
    ]
  }
];

export const queueItems: QueueItem[] = [
  {
    id: "qi_001",
    rank: 1,
    municipalityId: "ZA_GP_EKU",
    title: "Metro regression requires executive decision",
    riskType: "audit",
    severity: "critical",
    priorityScore: 92,
    reasonSummary: "AGSA metro regression context plus unresolved governance/action evidence risk.",
    whatChanged: "Moved into critical lane after FY 2024-25 review pack.",
    requiredNextStep: "Approve executive evidence request and add to weekly intervention brief.",
    owner: "Provincial Treasury: Chief Director",
    dueDate: "2026-07-13",
    status: "decision_required",
    evidenceRefs: [agsa2025]
  },
  {
    id: "qi_002",
    rank: 2,
    municipalityId: "ZA_GP_JHB",
    title: "Repeat finding evidence not yet accepted",
    riskType: "action_overdue",
    severity: "high",
    priorityScore: 84,
    reasonSummary: "Finding-to-action workflow has overdue evidence against a high-priority metro case.",
    whatChanged: "Evidence review SLA passed without acceptance.",
    requiredNextStep: "Escalate to case manager and request corrected evidence.",
    owner: "Oversight Analyst",
    dueDate: "2026-07-11",
    status: "assigned",
    evidenceRefs: [agsa2025]
  },
  {
    id: "qi_003",
    rank: 3,
    municipalityId: "ZA_GP_TSH",
    title: "Committee brief needs updated source pack",
    riskType: "recovery",
    severity: "high",
    priorityScore: 79,
    reasonSummary: "Weekly briefing is missing a reviewed action status and source note.",
    whatChanged: "Briefing deadline moved to this week.",
    requiredNextStep: "Complete source review and generate executive briefing.",
    owner: "Committee Researcher",
    dueDate: "2026-07-10",
    status: "blocked",
    evidenceRefs: [agsa2025]
  },
  {
    id: "qi_004",
    rank: 4,
    municipalityId: "ZA_GP_MER",
    title: "Canonical municipality mapping review",
    riskType: "data_quality",
    severity: "medium",
    priorityScore: 58,
    reasonSummary: "Data steward must confirm pilot mapping before publication.",
    whatChanged: "New local municipality added to pilot cohort.",
    requiredNextStep: "Review source references and publish or hold with reason.",
    owner: "Data Steward",
    dueDate: "2026-07-15",
    status: "monitoring",
    evidenceRefs: [agsa2025]
  }
];

export const actions: Action[] = [
  {
    id: "act_001",
    municipalityId: "ZA_GP_EKU",
    title: "Submit corrected governance action evidence",
    linkedFinding: "Performance reporting and compliance controls",
    owner: "Municipal respondent",
    reviewer: "Provincial reviewer",
    dueDate: "2026-07-12",
    status: "overdue",
    requiredEvidence: ["Council-approved action plan", "Implementation owner list", "Evidence of review meeting"],
    escalationRule: "Critical action overdue by 7 days escalates to executive queue.",
    sourceRefs: [agsa2025]
  },
  {
    id: "act_002",
    municipalityId: "ZA_GP_JHB",
    title: "Review repeat finding root-cause response",
    linkedFinding: "Repeat accountability environment weakness",
    owner: "Oversight analyst",
    reviewer: "Audit committee reviewer",
    dueDate: "2026-07-18",
    status: "under_review",
    requiredEvidence: ["Root-cause response", "Management sign-off", "Reviewer notes"],
    escalationRule: "Evidence rejected twice requires oversight lead review.",
    sourceRefs: [agsa2025]
  },
  {
    id: "act_003",
    municipalityId: "ZA_GP_TSH",
    title: "Prepare weekly committee question pack",
    linkedFinding: "High-priority oversight queue",
    owner: "Committee researcher",
    reviewer: "Executive sponsor",
    dueDate: "2026-07-10",
    status: "in_progress",
    requiredEvidence: ["Question pack", "Source citations", "Decision log draft"],
    escalationRule: "Briefing deadline miss adds item to decision-required lane.",
    sourceRefs: [agsa2025]
  }
];

export const briefings: Briefing[] = [
  {
    id: "br_001",
    title: "Weekly Gauteng Intervention Brief",
    template: "Weekly intervention brief",
    scope: "Critical and high-priority queue items",
    status: "review",
    sections: ["Decision required", "What changed", "Priority risks", "Action owner status", "Source notes"],
    sourceRefs: [agsa2025]
  },
  {
    id: "br_002",
    title: "Municipality 360 Executive Pack",
    template: "Municipality 360 executive brief",
    scope: "Selected metro case files",
    status: "draft",
    sections: ["Current situation", "Audit posture", "Evidence snapshot", "Recommended next steps"],
    sourceRefs: [agsa2025, treasuryPending]
  }
];

export const sourceHealth: SourceHealth[] = [
  {
    sourceId: "agsa_mfma",
    sourceName: "AGSA MFMA consolidated report",
    owner: "Auditor-General South Africa",
    accessClass: "B",
    status: "healthy",
    lastVerifiedAt: "2026-07-06T02:30:00+02:00",
    latestRun: "Report artifact loaded from workspace source pack",
    publishedRecords: 4,
    openExceptions: 0,
    treatment: "Phase 1 foundation source"
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
    latestRun: "Static workflow seed",
    publishedRecords: 3,
    openExceptions: 2,
    treatment: "Internal only; never included in public MuniCheck"
  }
];

export const apiMeta = {
  requestId: "req_pilot_static",
  generatedAt: "2026-07-06T02:30:00+02:00",
  warnings: [
    "Prototype data is seeded from the local PRD/source pack.",
    "Treasury/Municipal Money telemetry is marked pending validation and is not presented as live."
  ],
  freshness: {
    agsa: "AGSA verified · FY 2024-25",
    treasury: "Pending validation"
  }
};

export const auditTimeline = [
  { year: "2020-21", outcome: "Clean audit", movement: "baseline", note: "Prior administration comparison year" },
  { year: "2021-22", outcome: "Clean audit", movement: "stable", note: "No material movement recorded in pilot baseline" },
  { year: "2022-23", outcome: "Unqualified with findings", movement: "regressed", note: "Control weaknesses entered active review" },
  { year: "2023-24", outcome: "Unqualified with findings", movement: "stable", note: "Repeat finding watch continued" },
  { year: "2024-25", outcome: "Unqualified with findings", movement: "watch", note: "Executive attention required in pilot workflow" }
];

export const ipiComponents = [
  { label: "Audit exposure", score: 22, max: 25, explanation: "Current outcome and metro regression context require attention." },
  { label: "Repeat findings", score: 14, max: 20, explanation: "Repeat accountability environment weakness remains active." },
  { label: "Material irregularity exposure", score: 11, max: 15, explanation: "MI treatment is tracked only where source-backed." },
  { label: "Financial deterioration", score: 0, max: 20, explanation: "Reserved for Phase 2 Treasury validation." },
  { label: "Funding risk", score: 0, max: 10, explanation: "Disabled until Municipal Money reuse and formula checks pass." },
  { label: "Action overdue exposure", score: 9, max: 10, explanation: "Evidence workflow has overdue or blocked items." }
];

export const recoveryMilestones = [
  {
    id: "rm_001",
    title: "Approve evidence request protocol",
    owner: "Provincial reviewer",
    dueDate: "2026-07-12",
    status: "off_track",
    blocker: "Municipal response pack incomplete",
    evidence: "Council-approved action plan"
  },
  {
    id: "rm_002",
    title: "Weekly war-room agenda issued",
    owner: "Case manager",
    dueDate: "2026-07-09",
    status: "on_track",
    blocker: "None",
    evidence: "Agenda and decision register"
  },
  {
    id: "rm_003",
    title: "Treasury telemetry validation gate",
    owner: "Data steward",
    dueDate: "Phase 2",
    status: "pending_validation",
    blocker: "Connector and reuse review not complete",
    evidence: "Source-health report"
  }
];

export const evidenceChecklist = [
  "Source document attached or linked",
  "Source period and page/section captured",
  "Reviewer confirms municipality identifier",
  "Evidence matches required action outcome",
  "Closure rationale records residual risk"
];

export const sourceFreshnessEvents = [
  { sourceId: "agsa_mfma", event: "Artifact loaded", status: "healthy", date: "2026-07-05" },
  { sourceId: "agsa_mfma", event: "Pilot fields reviewed", status: "healthy", date: "2026-07-06" },
  { sourceId: "municipal_money", event: "Connector disabled pending validation", status: "unknown", date: "Phase 2" },
  { sourceId: "client_workflow", event: "Workflow seed created", status: "degraded", date: "2026-07-06" }
];

export const briefingTemplates = [
  {
    id: "tpl_weekly",
    name: "Weekly intervention brief",
    audience: "Executive sponsor",
    sections: ["Decision required", "What changed", "Priority risks", "Action owners", "Source notes"]
  },
  {
    id: "tpl_committee",
    name: "Committee question pack",
    audience: "Portfolio committee researcher",
    sections: ["Oversight questions", "Evidence citations", "Municipality context", "Follow-up requests"]
  },
  {
    id: "tpl_recovery",
    name: "Recovery progress brief",
    audience: "Municipal recovery team",
    sections: ["Milestones", "Blockers", "Evidence state", "Next 30 days"]
  }
];

export const publicProfiles = municipalities.map((municipality) => ({
  municipalityId: municipality.id,
  name: municipality.name,
  plainLanguageStatus:
    municipality.interventionPriority === "critical"
      ? "This municipality has issues that need senior oversight attention."
      : "This municipality is being monitored through the pilot evidence workflow.",
  publicFields: ["Audit outcome", "Source period", "Plain-language explanation", "Methodology note"],
  hiddenFields: ["Internal notes", "Institutional action comments", "Restricted evidence"]
}));

export const muniDataEndpoints = [
  { method: "GET", path: "/v1/municipalities", access: "Public developer", description: "Filterable municipality directory." },
  { method: "GET", path: "/v1/municipalities/{id}/case-file", access: "Institutional", description: "Source-backed case file." },
  { method: "GET", path: "/v1/intervention-queue", access: "Institutional", description: "Ranked worklist with evidence references." },
  { method: "GET", path: "/v1/data-freshness", access: "Public safe", description: "Source status and freshness records." },
  { method: "POST", path: "/v1/assistant/query", access: "Institutional", description: "Source-locked answer policy endpoint." }
];
