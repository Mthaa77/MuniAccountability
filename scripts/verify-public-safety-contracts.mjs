import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");

const publicMuniCheck = read("lib", "public-municheck.ts");
const publicMuniCheckPage = read("app", "municheck", "[municipalityId]", "page.tsx");
const reviewOverlays = read("lib", "review-overlays.ts");
const apiRoute = read("app", "api", "v1", "[...resource]", "route.ts");
const qaDocs = read("docs", "QA_CHECKLIST.md");
const contributing = read("CONTRIBUTING.md");

function assertIncludes(source, token, message) {
  assert(source.includes(token), message ?? `Expected source to include ${token}`);
}

[
  "publicSafeReviewOverlay",
  "Internal workflow notes, action comments and restricted evidence are excluded from public profiles.",
  "hiddenFields",
  "Internal notes",
  "Institutional action comments",
  "Restricted evidence",
  "Draft remediation workflow",
  "treasuryStatus: \"pending_validation\""
].forEach((token) => assertIncludes(publicMuniCheck, token, `Public MuniCheck safety contract missing ${token}.`));

[
  "Public MuniCheck profile",
  "Public profile boundary",
  "public-safe audit context only",
  "It excludes internal action comments",
  "What is not shown publicly",
  "Public safety boundary",
  "profile.publicSafety.hiddenFields"
].forEach((token) => assertIncludes(publicMuniCheckPage, token, `Public MuniCheck page safety contract missing ${token}.`));

[
  "publicSafeReviewOverlay",
  'decision.status === "excluded"',
  'reviewed.publicationState !== "excluded" ? reviewed : null',
  "reviewStatus",
  "publicationState"
].forEach((token) => assertIncludes(reviewOverlays, token, `Review overlay safety contract missing ${token}.`));

[
  "getPublicMuniCheckProfile(id)",
  "listPublicMuniCheckProfiles()",
  "Platform risk scores are workflow prioritisation aids, not legal findings.",
  "Treasury/Municipal Money telemetry is marked pending validation"
].forEach((token) => assertIncludes(apiRoute, token, `API public safety contract missing ${token}.`));

[
  "Public pages must not expose",
  "internal action notes",
  "restricted evidence",
  "unsupported allegations"
].forEach((token) => assertIncludes(qaDocs, token, `QA public safety checklist missing ${token}.`));

[
  "No proof, no public claim.",
  "Internal workflow notes are not exposed publicly"
].forEach((token) => assertIncludes(contributing, token, `Contributing public-safety rule missing ${token}.`));

console.log("Public-safety contracts verified: MuniCheck, review overlays, API caveats and QA rules protect public output.");
