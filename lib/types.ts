export type Severity = "critical" | "high" | "medium" | "watch" | "resolved";
export type FreshnessStatus = "current" | "aging" | "stale" | "unavailable" | "under_review";
export type SourceType = "AGSA" | "Treasury" | "Institution" | "Platform";
export type ActionStatus =
  | "not_started"
  | "in_progress"
  | "evidence_submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "overdue"
  | "escalated"
  | "closed_with_residual_risk";

export type DataFreshness = {
  sourceType: SourceType;
  reportingPeriod: string;
  pulledAt: string | null;
  verifiedAt: string | null;
  expectedNextUpdate: string | null;
  status: FreshnessStatus;
  stalenessReason?: string;
};

export type SourceReference = {
  id: string;
  label: string;
  source: string;
  period: string;
  location: string;
  qualityState: "verified" | "source_published" | "under_review" | "needs_review";
  url?: string;
  calculationVersion?: string;
};

export type Metric = {
  id: string;
  label: string;
  value: string;
  change: string;
  tone: "good" | "watch" | "risk" | "neutral";
  definition: string;
  freshness: DataFreshness;
  sources: SourceReference[];
};

export type Municipality = {
  id: string;
  name: string;
  commonName: string;
  province: string;
  category: "metro" | "district" | "local";
  auditOutcome: string;
  interventionPriority: Severity;
  ipi: number;
  householdImpact: string;
  situationSummary: string;
  posture: string;
  coordinates: { x: number; y: number };
  metrics: Metric[];
};

export type QueueItem = {
  id: string;
  rank: number;
  municipalityId: string;
  title: string;
  riskType: "audit" | "financial" | "grant" | "infrastructure" | "recovery" | "action_overdue" | "data_quality";
  severity: Severity;
  priorityScore: number;
  reasonSummary: string;
  whatChanged: string;
  requiredNextStep: string;
  owner: string;
  dueDate: string;
  status: "decision_required" | "assigned" | "monitoring" | "blocked" | "resolved";
  evidenceRefs: SourceReference[];
};

export type Action = {
  id: string;
  municipalityId: string;
  title: string;
  linkedFinding: string;
  owner: string;
  reviewer: string;
  dueDate: string;
  status: ActionStatus;
  requiredEvidence: string[];
  escalationRule: string;
  sourceRefs: SourceReference[];
};

export type Briefing = {
  id: string;
  title: string;
  template: string;
  scope: string;
  status: "draft" | "review" | "approved";
  sections: string[];
  sourceRefs: SourceReference[];
};

export type SourceHealth = {
  sourceId: string;
  sourceName: string;
  owner: string;
  accessClass: "A" | "B" | "C" | "D" | "E";
  status: "healthy" | "degraded" | "blocked" | "unknown";
  lastVerifiedAt: string;
  latestRun: string;
  publishedRecords: number;
  openExceptions: number;
  treatment: string;
};
