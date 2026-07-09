import type { AgsaReviewDecision, DraftAction } from "../types";

export type GateReviewStatus = "accepted" | "needs_correction" | "excluded";

export type GateReview = {
  decisionKey: string;
  gateId: "mfma_annexure_mapping" | "treasury_financial_pulse_unlock" | "durable_workflow_store";
  status: GateReviewStatus;
  reviewer: string;
  decidedAt: string;
  evidenceRefs: string[];
  rationale?: string;
  correctionRequired?: string;
};

export type WorkflowTenantContext = {
  tenantId: string;
  actorRole?: string;
  actorId?: string;
};

export type WorkflowStoreStatus = {
  provider: "local_json" | "firestore";
  productionReady: boolean;
  writable: boolean;
  limitations: string[];
};

export type WorkflowStore = {
  status(): WorkflowStoreStatus;
  listDraftActions(context: WorkflowTenantContext): Promise<DraftAction[]>;
  saveDraftAction(context: WorkflowTenantContext, action: DraftAction): Promise<DraftAction>;
  listReviewDecisions(context: WorkflowTenantContext): Promise<AgsaReviewDecision[]>;
  saveReviewDecision(context: WorkflowTenantContext, decision: AgsaReviewDecision): Promise<AgsaReviewDecision>;
  listGateReviews(context: WorkflowTenantContext): Promise<GateReview[]>;
  saveGateReview(context: WorkflowTenantContext, review: GateReview): Promise<GateReview>;
};
