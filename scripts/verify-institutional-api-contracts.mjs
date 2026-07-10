import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");

const apiRoute = read("app", "api", "v1", "[...resource]", "route.ts");
const clientApi = read("lib", "client-api.ts");
const apiDocs = read("docs", "API_REFERENCE.md");
const muniData = read("lib", "agsa-data.ts");

function assertIncludes(source, token, message) {
  assert(source.includes(token), message ?? `Expected source to include ${token}`);
}

[
  "export async function GET",
  "export async function POST",
  "export async function PATCH",
  'export const runtime = "nodejs"',
  'export const dynamic = "force-dynamic"'
].forEach((token) => assertIncludes(apiRoute, token, `API route contract missing ${token}.`));

const getContracts = [
  'family === "municipalities" && !id',
  'family === "municipalities" && id && child === "case-file"',
  'family === "intervention-queue"',
  'family === "actions"',
  'family === "agsa" && id === "review-decisions"',
  'family === "sources" || family === "data-freshness"',
  'family === "search"',
  'family === "assistant" && id === "query"',
  'family === "production-readiness"',
  'family === "production-evidence"',
  'family === "municheck"',
  'family === "munidata"'
];

getContracts.forEach((contract) => assertIncludes(apiRoute, contract, `GET API contract missing route guard: ${contract}`));

const mutationContracts = [
  'family === "actions" && id === "drafts"',
  'operation === "transition"',
  'operation === "evidence"',
  "saveDraftAction(body)",
  "transitionDraftAction(child, body)",
  "addDraftActionEvidence(child, body)",
  'family === "agsa" && id === "review-decisions"',
  "saveAgsaReviewDecision(body)",
  'family === "production-evidence" && id === "reviews"',
  "saveProductionGateReview(body)",
  "answerSourceLockedQuery(query)",
  "patchDraftAction(child, body)"
];

mutationContracts.forEach((contract) => assertIncludes(apiRoute, contract, `Mutation API contract missing: ${contract}`));

[
  'method?: "GET" | "POST" | "PATCH"',
  'path.startsWith("/v1/")',
  '`/api${path}`',
  'cache: "no-store"',
  "ApiClientError",
  "apiGet",
  "apiPost",
  "apiPatch"
].forEach((token) => assertIncludes(clientApi, token, `Client API helper contract missing ${token}.`));

[
  "GET /v1/municipalities",
  "POST /v1/actions/drafts",
  "POST /v1/actions/drafts/:id/evidence",
  "GET /v1/agsa/review-decisions",
  "POST /v1/agsa/review-decisions",
  "POST /v1/assistant/query",
  "GET /v1/production-evidence"
].forEach((token) => assertIncludes(apiDocs, token, `API documentation missing ${token}.`));

[
  "/v1/search?q={query}",
  "/v1/municheck/{id}",
  "/v1/production-evidence/reviews"
].forEach((token) => assertIncludes(muniData, token, `MuniData endpoint catalogue missing ${token}.`));

console.log("Institutional API contracts verified: route guards, mutation paths, client helper and docs are aligned.");
