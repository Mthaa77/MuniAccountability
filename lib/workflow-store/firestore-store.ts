import "server-only";

import type { AgsaReviewDecision, DraftAction } from "../types";
import type { GateReview, WorkflowStore, WorkflowTenantContext } from "./types";

function projectId() {
  return process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
}

function configured() {
  return Boolean(projectId());
}

function notConfigured(operation: string): never {
  throw new Error(
    `Firestore workflow store is prepared but not active for ${operation}. Configure Firebase Admin credentials and switch the provider intentionally.`
  );
}

export const firestoreWorkflowStore: WorkflowStore = {
  status() {
    return {
      provider: "firestore",
      productionReady: configured(),
      writable: configured(),
      limitations: configured()
        ? ["Requires Firebase Auth role claims and Firestore security rules in the target project"]
        : ["Firebase project and Admin credentials are not configured yet"]
    };
  },

  async listDraftActions(_context: WorkflowTenantContext): Promise<DraftAction[]> {
    return notConfigured("listDraftActions");
  },

  async saveDraftAction(_context: WorkflowTenantContext, _action: DraftAction): Promise<DraftAction> {
    return notConfigured("saveDraftAction");
  },

  async listReviewDecisions(_context: WorkflowTenantContext): Promise<AgsaReviewDecision[]> {
    return notConfigured("listReviewDecisions");
  },

  async saveReviewDecision(_context: WorkflowTenantContext, _decision: AgsaReviewDecision): Promise<AgsaReviewDecision> {
    return notConfigured("saveReviewDecision");
  },

  async listGateReviews(_context: WorkflowTenantContext): Promise<GateReview[]> {
    return notConfigured("listGateReviews");
  },

  async saveGateReview(_context: WorkflowTenantContext, _review: GateReview): Promise<GateReview> {
    return notConfigured("saveGateReview");
  }
};
