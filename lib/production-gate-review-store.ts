import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type ProductionGateId = "mfma_annexure_mapping" | "treasury_financial_pulse_unlock" | "durable_workflow_store";
export type ProductionGateReviewStatus = "accepted" | "needs_correction" | "excluded";

export type ProductionGateReviewDecision = {
  decisionKey: string;
  gateId: ProductionGateId;
  status: ProductionGateReviewStatus;
  reviewer: string;
  decidedAt: string;
  evidenceRefs: string[];
  rationale?: string;
  correctionRequired?: string;
};

export type ProductionGateReviewStore = {
  schemaVersion: "production-gate-reviews-v0.1";
  updatedAt: string;
  decisions: ProductionGateReviewDecision[];
};

const storePath = path.join(process.cwd(), "data", "agsa", "generated", "production-gate-reviews.json");
const allowedGateIds: ProductionGateId[] = [
  "mfma_annexure_mapping",
  "treasury_financial_pulse_unlock",
  "durable_workflow_store"
];
const allowedStatuses: ProductionGateReviewStatus[] = ["accepted", "needs_correction", "excluded"];

function emptyStore(): ProductionGateReviewStore {
  return {
    schemaVersion: "production-gate-reviews-v0.1",
    updatedAt: new Date().toISOString(),
    decisions: []
  };
}

function readStore(): ProductionGateReviewStore {
  if (!existsSync(storePath)) return emptyStore();

  try {
    const parsed = JSON.parse(readFileSync(storePath, "utf8")) as ProductionGateReviewStore;
    if (parsed.schemaVersion !== "production-gate-reviews-v0.1" || !Array.isArray(parsed.decisions)) {
      return emptyStore();
    }
    return parsed;
  } catch {
    return emptyStore();
  }
}

function writeStore(store: ProductionGateReviewStore) {
  mkdirSync(path.dirname(storePath), { recursive: true });
  writeFileSync(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asGateId(value: unknown): ProductionGateId | null {
  return allowedGateIds.includes(value as ProductionGateId) ? (value as ProductionGateId) : null;
}

function asReviewStatus(value: unknown): ProductionGateReviewStatus | null {
  return allowedStatuses.includes(value as ProductionGateReviewStatus) ? (value as ProductionGateReviewStatus) : null;
}

export function listProductionGateReviews() {
  const store = readStore();
  const byGate = allowedGateIds.reduce<Record<ProductionGateId, ProductionGateReviewDecision[]>>(
    (accumulator, gateId) => {
      accumulator[gateId] = store.decisions.filter((decision) => decision.gateId === gateId);
      return accumulator;
    },
    {
      mfma_annexure_mapping: [],
      treasury_financial_pulse_unlock: [],
      durable_workflow_store: []
    }
  );
  const byStatus = allowedStatuses.reduce<Record<ProductionGateReviewStatus, number>>(
    (accumulator, status) => {
      accumulator[status] = store.decisions.filter((decision) => decision.status === status).length;
      return accumulator;
    },
    { accepted: 0, needs_correction: 0, excluded: 0 }
  );

  return {
    ...store,
    stats: {
      total: store.decisions.length,
      byStatus,
      byGate: Object.fromEntries(
        allowedGateIds.map((gateId) => [
          gateId,
          {
            total: byGate[gateId].length,
            accepted: byGate[gateId].filter((decision) => decision.status === "accepted").length,
            needsCorrection: byGate[gateId].filter((decision) => decision.status === "needs_correction").length,
            excluded: byGate[gateId].filter((decision) => decision.status === "excluded").length
          }
        ])
      )
    }
  };
}

export function latestProductionGateReview(gateId: ProductionGateId) {
  return readStore().decisions
    .filter((decision) => decision.gateId === gateId)
    .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt))[0];
}

export function saveProductionGateReview(input: unknown) {
  const body = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const gateId = asGateId(body.gateId);
  const status = asReviewStatus(body.status);
  const reviewer = asString(body.reviewer);
  const evidenceRefs = asStringArray(body.evidenceRefs);

  if (!gateId) {
    throw new Error("Production gate review requires a valid gateId.");
  }
  if (!status) {
    throw new Error("Production gate review status must be accepted, needs_correction or excluded.");
  }
  if (!reviewer) {
    throw new Error("Production gate review requires a reviewer.");
  }
  if (status === "accepted" && evidenceRefs.length === 0) {
    throw new Error("Accepted production gate reviews require at least one evidence reference.");
  }

  const now = new Date().toISOString();
  const decision: ProductionGateReviewDecision = {
    decisionKey: asString(body.decisionKey, `${gateId}:${now}`),
    gateId,
    status,
    reviewer,
    decidedAt: now,
    evidenceRefs,
    rationale: asString(body.rationale) || undefined,
    correctionRequired: asString(body.correctionRequired) || undefined
  };
  const store = readStore();
  const existingIndex = store.decisions.findIndex((item) => item.decisionKey === decision.decisionKey);
  const decisions =
    existingIndex >= 0
      ? store.decisions.map((item, index) => (index === existingIndex ? decision : item))
      : [decision, ...store.decisions];
  const nextStore: ProductionGateReviewStore = {
    schemaVersion: "production-gate-reviews-v0.1",
    updatedAt: now,
    decisions
  };

  writeStore(nextStore);

  return {
    accepted: true,
    persisted: true,
    decision,
    storePath
  };
}
