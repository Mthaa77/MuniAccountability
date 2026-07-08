import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ActionEvidenceAttachment, ActionStatus, ActionStatusHistoryEntry, DraftAction, DraftActionStore, SourceReference } from "./types";

const storePath = path.join(process.cwd(), "data", "agsa", "generated", "draft-actions.json");
const allowedStatuses: ActionStatus[] = [
  "not_started",
  "in_progress",
  "evidence_submitted",
  "under_review",
  "approved",
  "rejected",
  "overdue",
  "escalated",
  "closed_with_residual_risk"
];

function emptyStore(): DraftActionStore {
  return {
    schemaVersion: "draft-actions-v0.1",
    updatedAt: new Date().toISOString(),
    actions: []
  };
}

function readStore(): DraftActionStore {
  if (!existsSync(storePath)) return emptyStore();

  try {
    const parsed = JSON.parse(readFileSync(storePath, "utf8")) as DraftActionStore;
    if (parsed.schemaVersion !== "draft-actions-v0.1" || !Array.isArray(parsed.actions)) {
      return emptyStore();
    }
    return parsed;
  } catch {
    return emptyStore();
  }
}

function writeStore(store: DraftActionStore) {
  mkdirSync(path.dirname(storePath), { recursive: true });
  writeFileSync(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function asSourceRefs(value: unknown): SourceReference[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is SourceReference => {
    return typeof item === "object" && item !== null && typeof (item as SourceReference).id === "string";
  });
}

function asEvidenceAttachments(value: unknown): ActionEvidenceAttachment[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ActionEvidenceAttachment => {
    return typeof item === "object" && item !== null && typeof (item as ActionEvidenceAttachment).id === "string";
  });
}

function asStatusHistory(value: unknown): ActionStatusHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ActionStatusHistoryEntry => {
    return typeof item === "object" && item !== null && allowedStatuses.includes((item as ActionStatusHistoryEntry).status);
  });
}

function asStatus(value: unknown): ActionStatus {
  return allowedStatuses.includes(value as ActionStatus) ? (value as ActionStatus) : "not_started";
}

function normalizeDraftAction(action: DraftAction): DraftAction {
  const createdAt = action.createdAt || new Date().toISOString();
  const status = asStatus(action.status);
  const statusHistory = action.statusHistory?.length
    ? action.statusHistory
    : [
        {
          status,
          changedAt: createdAt,
          changedBy: "system",
          reason: "Draft action created"
        }
      ];

  return {
    ...action,
    status,
    assignedTo: action.assignedTo ?? action.owner,
    evidenceAttachments: action.evidenceAttachments ?? [],
    statusHistory,
    createdAt,
    updatedAt: action.updatedAt || createdAt
  };
}

export function listDraftActions() {
  const store = readStore();
  const actions = store.actions.map(normalizeDraftAction);
  return {
    ...store,
    actions,
    stats: {
      total: actions.length,
      byStatus: allowedStatuses.reduce<Record<string, number>>((counts, status) => {
        counts[status] = actions.filter((action) => action.status === status).length;
        return counts;
      }, {}),
      evidenceSubmitted: actions.filter((action) => (action.evidenceAttachments?.length ?? 0) > 0).length,
      overdue: actions.filter((action) => action.status === "overdue").length,
      closed: actions.filter((action) => action.status === "closed_with_residual_risk" || action.status === "approved").length
    }
  };
}

export function saveDraftAction(input: unknown) {
  const body = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const now = new Date().toISOString();
  const sourceQueueItemId = asString(body.sourceQueueItemId);
  const id = asString(body.id, sourceQueueItemId ? `draft_${sourceQueueItemId}` : `draft_${Date.now()}`);
  const municipalityId = asString(body.municipalityId);
  const title = asString(body.title);

  if (!id || !municipalityId || !title) {
    throw new Error("Draft action requires id, municipalityId and title.");
  }

  const store = readStore();
  const existing = store.actions.find((action) => action.id === id);
  const status = asStatus(body.status);
  const evidenceAttachments = asEvidenceAttachments(body.evidenceAttachments);
  const existingHistory = existing?.statusHistory ?? [];
  const inputHistory = asStatusHistory(body.statusHistory);
  const statusHistory =
    inputHistory.length > 0
      ? inputHistory
      : existing && existing.status !== status
        ? [
            ...existingHistory,
            {
              status,
              changedAt: now,
              changedBy: asString(body.changedBy, "prototype-reviewer"),
              reason: asString(body.transitionReason) || undefined
            }
          ]
        : existingHistory.length
          ? existingHistory
          : [
              {
                status,
                changedAt: now,
                changedBy: asString(body.changedBy, "prototype-reviewer"),
                reason: "Draft action created"
              }
            ];
  const draftAction: DraftAction = {
    id,
    municipalityId,
    title,
    linkedFinding: asString(body.linkedFinding),
    owner: asString(body.owner, "Oversight analyst"),
    reviewer: asString(body.reviewer, "Oversight reviewer"),
    assignedTo: asString(body.assignedTo, asString(body.owner, "Oversight analyst")),
    dueDate: asString(body.dueDate, "2026-08-15"),
    status,
    requiredEvidence: asStringArray(body.requiredEvidence),
    escalationRule: asString(body.escalationRule, "Escalate if evidence is not submitted by the queue due date."),
    sourceRefs: asSourceRefs(body.sourceRefs),
    sourceQueueItemId: sourceQueueItemId || undefined,
    sourceFindingId: asString(body.sourceFindingId) || undefined,
    evidenceAttachments,
    statusHistory,
    closureNote: asString(body.closureNote) || undefined,
    residualRisk: asString(body.residualRisk) || undefined,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
  const actions = existing
    ? store.actions.map((action) => (action.id === draftAction.id ? draftAction : action))
    : [draftAction, ...store.actions];
  const nextStore: DraftActionStore = {
    schemaVersion: "draft-actions-v0.1",
    updatedAt: now,
    actions
  };

  writeStore(nextStore);

  return {
    accepted: true,
    persisted: true,
    action: draftAction,
    storePath
  };
}

export function patchDraftAction(id: string, input: unknown) {
  const store = readStore();
  const existing = store.actions.find((action) => action.id === id);
  if (!existing) {
    throw new Error("Draft action not found.");
  }

  return saveDraftAction({
    ...existing,
    ...(typeof input === "object" && input !== null ? input : {}),
    id
  });
}

export function transitionDraftAction(id: string, input: unknown) {
  const body = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const status = asStatus(body.status);

  return patchDraftAction(id, {
    status,
    changedBy: asString(body.changedBy, "prototype-reviewer"),
    transitionReason: asString(body.reason),
    closureNote: asString(body.closureNote) || undefined,
    residualRisk: asString(body.residualRisk) || undefined
  });
}

export function addDraftActionEvidence(id: string, input: unknown) {
  const store = readStore();
  const existing = store.actions.find((action) => action.id === id);
  if (!existing) {
    throw new Error("Draft action not found.");
  }

  const body = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const now = new Date().toISOString();
  const label = asString(body.label);

  if (!label) {
    throw new Error("Evidence attachment requires a label.");
  }

  const evidence: ActionEvidenceAttachment = {
    id: asString(body.id, `ev_${Date.now()}`),
    label,
    url: asString(body.url) || undefined,
    submittedBy: asString(body.submittedBy, "prototype-reviewer"),
    submittedAt: now,
    note: asString(body.note) || undefined,
    sourceRefId: asString(body.sourceRefId) || undefined
  };

  return patchDraftAction(id, {
    evidenceAttachments: [...(existing.evidenceAttachments ?? []), evidence],
    status: existing.status === "not_started" || existing.status === "in_progress" ? "evidence_submitted" : existing.status,
    changedBy: evidence.submittedBy,
    transitionReason: "Evidence attachment added"
  });
}
