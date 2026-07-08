import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AgsaReviewDecision, AgsaReviewDecisionStatus, AgsaReviewDecisionStore } from "./types";

const storePath = path.join(process.cwd(), "data", "agsa", "generated", "agsa-review-decisions.json");

function emptyStore(): AgsaReviewDecisionStore {
  return {
    schemaVersion: "agsa-review-decisions-v0.1",
    updatedAt: new Date().toISOString(),
    decisions: []
  };
}

function readStore(): AgsaReviewDecisionStore {
  if (!existsSync(storePath)) return emptyStore();

  try {
    const parsed = JSON.parse(readFileSync(storePath, "utf8")) as AgsaReviewDecisionStore;
    if (parsed.schemaVersion !== "agsa-review-decisions-v0.1" || !Array.isArray(parsed.decisions)) {
      return emptyStore();
    }
    return parsed;
  } catch {
    return emptyStore();
  }
}

function writeStore(store: AgsaReviewDecisionStore) {
  mkdirSync(path.dirname(storePath), { recursive: true });
  writeFileSync(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function isDecisionStatus(value: unknown): value is AgsaReviewDecisionStatus {
  return value === "accepted" || value === "correction" || value === "excluded";
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function listAgsaReviewDecisions() {
  const store = readStore();
  const byStatus = store.decisions.reduce<Record<AgsaReviewDecisionStatus, number>>(
    (counts, decision) => {
      counts[decision.status] += 1;
      return counts;
    },
    { accepted: 0, correction: 0, excluded: 0 }
  );

  return {
    ...store,
    stats: {
      total: store.decisions.length,
      byStatus
    }
  };
}

export function saveAgsaReviewDecision(input: unknown) {
  const body = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const status = body.status;

  if (!isDecisionStatus(status)) {
    throw new Error("Review decision status must be accepted, correction or excluded.");
  }

  const documentId = asString(body.documentId);
  const pageNumber = Number(body.pageNumber);
  const issue = asString(body.issue);
  const decisionKey = asString(body.decisionKey, `${documentId}:${pageNumber}:${issue}`);

  if (!documentId || !Number.isFinite(pageNumber) || !issue || !decisionKey) {
    throw new Error("Review decision requires decisionKey, documentId, pageNumber and issue.");
  }

  const now = new Date().toISOString();
  const decision: AgsaReviewDecision = {
    decisionKey,
    documentId,
    pageNumber,
    issue,
    status,
    reviewer: asString(body.reviewer, "prototype-reviewer"),
    decidedAt: now,
    citationIds: asStringArray(body.citationIds),
    rationale: asString(body.rationale) || undefined,
    replacementText: asString(body.replacementText) || undefined
  };
  const store = readStore();
  const existingIndex = store.decisions.findIndex((item) => item.decisionKey === decision.decisionKey);
  const decisions =
    existingIndex >= 0
      ? store.decisions.map((item, index) => (index === existingIndex ? decision : item))
      : [...store.decisions, decision];
  const nextStore: AgsaReviewDecisionStore = {
    schemaVersion: "agsa-review-decisions-v0.1",
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
