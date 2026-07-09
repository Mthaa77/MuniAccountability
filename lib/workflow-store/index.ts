import "server-only";

import { firestoreWorkflowStore } from "./firestore-store";
import { localJsonWorkflowStore } from "./local-json-store";
import type { WorkflowStore, WorkflowTenantContext } from "./types";

export type { GateReview, GateReviewStatus, WorkflowStore, WorkflowStoreStatus, WorkflowTenantContext } from "./types";

export function workflowProviderName() {
  return process.env.WORKFLOW_STORE_PROVIDER === "firestore" ? "firestore" : "local_json";
}

export function getWorkflowStore(): WorkflowStore {
  return workflowProviderName() === "firestore" ? firestoreWorkflowStore : localJsonWorkflowStore;
}

export function defaultWorkflowContext(): WorkflowTenantContext {
  return {
    tenantId: process.env.WORKFLOW_TENANT_ID || "prototype",
    actorRole: process.env.MUNI_DEV_ROLE || "admin",
    actorId: "system"
  };
}

export function workflowStoreStatus() {
  return getWorkflowStore().status();
}
