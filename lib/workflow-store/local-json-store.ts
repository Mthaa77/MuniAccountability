import "server-only";

import { listAgsaReviewDecisions, saveAgsaReviewDecision } from "../agsa-review-store";
import { listDraftActions, saveDraftAction } from "../draft-action-store";
import { listProductionGateReviews, saveProductionGateReview } from "../production-gate-review-store";
import type { WorkflowStore, WorkflowTenantContext, GateReview } from "./types";
import type { AgsaReviewDecision, DraftAction } from "../types";

export const localJsonWorkflowStore: WorkflowStore = {
  status() {
    return {
      provider: "local_json",
      productionReady: false,
      writable: true,
      limitations: [
        "Prototype-only local JSON writes",
        "No tenant isolation beyond namespacing metadata",
        "No concurrent write protection",
        "No hosted backup or retention policy"
      ]
    };
  },

  async listDraftActions(_context: WorkflowTenantContext) {
    return listDraftActions().actions;
  },

  async saveDraftAction(_context: WorkflowTenantContext, action: DraftAction) {
    return saveDraftAction(action).action;
  },

  async listReviewDecisions(_context: WorkflowTenantContext) {
    return listAgsaReviewDecisions().decisions;
  },

  async saveReviewDecision(_context: WorkflowTenantContext, decision: AgsaReviewDecision) {
    return saveAgsaReviewDecision(decision).decision;
  },

  async listGateReviews(_context: WorkflowTenantContext) {
    return listProductionGateReviews().reviews as GateReview[];
  },

  async saveGateReview(_context: WorkflowTenantContext, review: GateReview) {
    return saveProductionGateReview(review).review as GateReview;
  }
};
