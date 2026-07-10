import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");

const appShell = read("components", "app-shell.tsx");
const actionsPage = read("app", "actions", "page.tsx");
const agsaReviewPage = read("app", "admin", "agsa-review", "page.tsx");
const assistant = read("components", "atlas", "free-assistant.tsx");
const actionStudio = read("components", "atlas", "action-studio.tsx");
const evidenceDesk = read("components", "atlas", "evidence-attachment-drawer.tsx");
const agsaReview = read("components", "atlas", "agsa-review-desk.tsx");
const workflowDocs = read("docs", "WORKFLOW_MODULES.md");

function assertIncludes(source, token, message) {
  assert(source.includes(token), message ?? `Expected source to include ${token}`);
}

[
  "FreeAssistant",
  "PageTransition",
  "AGSA Review Cockpit",
  "/admin/agsa-review",
  "quickActions",
  "Command"
].forEach((token) => assertIncludes(appShell, token, `App shell is missing institutional navigation/module contract: ${token}`));

[
  "ActionStudio",
  "EvidenceAttachmentDrawer",
  "Internal action notes stay private",
  "Reviewer sign-off shown"
].forEach((token) => assertIncludes(actionsPage, token, `Actions page is missing workflow contract: ${token}`));

[
  "AgsaReviewDesk",
  "Human review queue",
  "Correction overlays"
].forEach((token) => assertIncludes(agsaReviewPage, token, `AGSA review page is missing review cockpit contract: ${token}`));

[
  'apiPost<AssistantAnswer>("/v1/assistant/query"',
  'mode: "evidence"',
  "continuity",
  "No source means no assertion.",
  "Evidence Mode uses backend data only",
  "Analyst Mode"
].forEach((token) => assertIncludes(assistant, token, `Free assistant contract missing ${token}.`));

[
  'apiGet<DraftActionResponse>("/v1/actions/drafts"',
  'apiPost<DraftAction>("/v1/actions/drafts"',
  'apiPatch<DraftAction>(`/v1/actions/drafts/${selectedAction.id}`',
  'apiPost<DraftAction>(`/v1/actions/drafts/${selectedAction.id}/transition`',
  'apiPost<DraftAction>(`/v1/actions/drafts/${selectedAction.id}/evidence`',
  "Action Studio",
  "requiredEvidence"
].forEach((token) => assertIncludes(actionStudio, token, `Action Studio contract missing ${token}.`));

[
  'apiGet<DraftActionResponse>("/v1/actions/drafts"',
  'apiPost<DraftAction>(`/v1/actions/drafts/${selectedAction.id}/evidence`',
  "Evidence Intake Desk",
  "Signed management response",
  "AGSA citation confirmation",
  "sourceRefId"
].forEach((token) => assertIncludes(evidenceDesk, token, `Evidence Intake Desk contract missing ${token}.`));

[
  'apiGet<{ decisions?: AgsaReviewDecision[] }>("/v1/agsa/review-decisions"',
  'apiPost("/v1/agsa/review-decisions"',
  "publishSafetyScore",
  "ReviewerGate",
  "Accepted after checking citation",
  "Correction field presets",
  "accepted",
  "correction",
  "excluded"
].forEach((token) => assertIncludes(agsaReview, token, `AGSA Review Cockpit contract missing ${token}.`));

[
  "Step 1: Free Source-Locked Assistant",
  "Step 2: Action Studio",
  "Step 3: Evidence Intake Desk",
  "Step 4: AGSA Review Cockpit",
  "Step 5: Production Readiness Command Centre"
].forEach((token) => assertIncludes(workflowDocs, token, `Workflow docs missing ${token}.`));

console.log("Institutional workflow modules verified: assistant, action, evidence and AGSA review wiring are documented and mounted.");
