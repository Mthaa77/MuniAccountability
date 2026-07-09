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
      limitations: ["Prototype-only JSON writes", "Single workspace", "No concurrent write lock"]
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
    return listProductionGateReviews().decisions as GateReview[];
  },

  async saveGateReview(_context: WorkflowTenantContext, review: GateReview) {
    return saveProductionGateReview(review).decision as GateReview;
  }
};
