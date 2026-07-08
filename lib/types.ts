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
  riskType:
    | "audit"
    | "financial"
    | "grant"
    | "infrastructure"
    | "recovery"
    | "action_overdue"
    | "data_quality"
    | "material_irregularity"
    | "water"
    | "disaster_relief";
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

export type DraftAction = Action & {
  sourceQueueItemId?: string;
  sourceFindingId?: string;
  createdAt: string;
  updatedAt: string;
};

export type DraftActionStore = {
  schemaVersion: "draft-actions-v0.1";
  updatedAt: string;
  actions: DraftAction[];
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

export type AgsaQualityState = "verified" | "source_published" | "under_review" | "needs_review";
export type AgsaReportFamily = "PFMA" | "MFMA" | "special" | "citizens";
export type AgsaFindingFamily =
  | "audit"
  | "compliance"
  | "financial"
  | "financial_reporting"
  | "procurement"
  | "infrastructure"
  | "governance"
  | "performance"
  | "ict"
  | "environmental"
  | "consequence_management"
  | "water"
  | "disaster_relief";

export type AgsaSourceDocument = {
  documentId: string;
  reportFamily: AgsaReportFamily;
  reportYear: string;
  tabledDate: string | null;
  title: string;
  issuer: string;
  fileName: string;
  filePath: string;
  pageCount: number;
  scope: string;
  theme: string;
  priority: "P0" | "P1" | "P2" | "P3" | "P4";
  qualityState: AgsaQualityState;
  sha256: string;
  pdfTitle: string;
};

export type AgsaPageSample = {
  pageNumber: number;
  sectionTitle: string | null;
  textSample: string;
  keywordHit: boolean;
  extractionConfidence: "high" | "medium" | "low" | "needs_review";
};

export type AgsaPageCitation = {
  citationId: string;
  documentId: string;
  pageNumber: number;
  sectionTitle: string | null;
  quoteSnippet: string | null;
  extractionConfidence: "high" | "medium" | "low" | "needs_review";
};

export type AgsaAuditee = {
  auditeeId: string;
  canonicalName: string;
  commonName: string;
  sphere: string;
  province: string | null;
  category: string;
  sector: string | null;
  highImpact: boolean;
  canonicalCode: string | null;
};

export type AgsaAuditOutcome = {
  auditeeId: string;
  financialYear: string;
  opinion: string;
  movement: string;
  budgetAmount: number | null;
  cleanAuditFlag: boolean;
  correctedMisstatements: boolean | null;
  notes: string;
  citationId: string;
};

export type AgsaFinding = {
  findingId: string;
  auditeeId: string;
  financialYear: string;
  findingFamily: AgsaFindingFamily;
  subtheme: string;
  severity: Exclude<Severity, "resolved">;
  description: string;
  impact: string;
  valueAtRisk: number | null;
  repeatFlag: boolean;
  citationId: string;
};

export type AgsaMaterialIrregularity = {
  miId: string;
  auditeeId: string;
  notifiedDate: string | null;
  category: "financial_loss" | "public_harm" | "resource_misuse" | "compliance";
  description: string;
  estimatedLoss: number | null;
  status: string;
  recoveredAmount: number | null;
  preventedAmount: number | null;
  referralBody: string | null;
  citationId: string;
};

export type AgsaInitiative = {
  initiativeId: string;
  reportId: string;
  initiativeType: "water" | "disaster_relief" | "material_irregularity" | "infrastructure" | "service_delivery" | "other";
  name: string;
  location: string;
  budget: number | null;
  progressStatus: "not_started" | "delayed" | "in_progress" | "complete" | "under_review";
  delayMonths: number | null;
  qualityIssues: string[];
  beneficiaries: number | null;
  responsibleEntities: string[];
};

export type AgsaRecommendation = {
  recommendationId: string;
  reportId: string;
  auditeeId: string | null;
  ownerRole: string;
  action: string;
  deadline: string | null;
  priority: "p0" | "p1" | "p2" | "p3";
  citationId: string;
};

export type AgsaExtractionIssue = {
  documentId: string;
  pageNumber: number;
  issue: string;
};

export type AgsaReviewDecisionStatus = "accepted" | "correction" | "excluded";

export type AgsaReviewDecision = {
  decisionKey: string;
  documentId: string;
  pageNumber: number;
  issue: string;
  status: AgsaReviewDecisionStatus;
  reviewer: string;
  decidedAt: string;
  citationIds: string[];
  rationale?: string;
  replacementText?: string;
};

export type AgsaReviewDecisionStore = {
  schemaVersion: "agsa-review-decisions-v0.1";
  updatedAt: string;
  decisions: AgsaReviewDecision[];
};

export type AgsaReviewStats = {
  totalIssues: number;
  open: number;
  accepted: number;
  correction: number;
  excluded: number;
  blockers: number;
};

export type AgsaExtract = {
  schemaVersion: string;
  generatedAt: string;
  sourceRoot: string;
  documents: AgsaSourceDocument[];
  pagesByDocument: Record<string, AgsaPageSample[]>;
  pageCitations: AgsaPageCitation[];
  auditees: AgsaAuditee[];
  auditOutcomes: AgsaAuditOutcome[];
  findings: AgsaFinding[];
  materialIrregularities: AgsaMaterialIrregularity[];
  initiatives: AgsaInitiative[];
  recommendations: AgsaRecommendation[];
  extractionIssues: AgsaExtractionIssue[];
};
