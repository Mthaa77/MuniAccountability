import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const ledgerSource = fs.readFileSync(path.join(root, "lib", "agsa-readiness-ledger.ts"), "utf8");
const apiRoute = fs.readFileSync(path.join(root, "app", "api", "v1", "[...resource]", "route.ts"), "utf8");
const adminPage = fs.readFileSync(path.join(root, "app", "admin", "page.tsx"), "utf8");
const muniData = fs.readFileSync(path.join(root, "lib", "agsa-data.ts"), "utf8");

const sliceIds = Array.from(ledgerSource.matchAll(/id: "([^"]+)"/g)).map((match) => match[1]);
const uniqueSliceIds = new Set(sliceIds);

assert.equal(uniqueSliceIds.size, 10, "Readiness ledger should contain exactly ten unique slices.");
assert(sliceIds.includes("exact_annexure_mapping"), "Readiness ledger should track exact annexure mapping.");
assert(sliceIds.includes("treasury_financial_pulse"), "Readiness ledger should track Treasury Financial Pulse unlock.");
assert(sliceIds.includes("durable_workflow_store"), "Readiness ledger should track durable workflow storage.");
assert(ledgerSource.includes("Official machine-readable MFMA municipality-level annexure CSV/JSON is required."), "Ledger should name the annexure external dependency.");
assert(ledgerSource.includes("Validated connector, reuse permission, schema fingerprint, formula versions and freshness evidence are required."), "Ledger should name the Treasury external dependency.");
assert(ledgerSource.includes("Hosted database provider, credentials and migration execution are required."), "Ledger should name the DB external dependency.");
assert(ledgerSource.includes("productionReady: agsaReadinessLedger.every"), "Ledger summary should compute production readiness from slice status.");
assert(apiRoute.includes('family === "readiness"'), "API should expose readiness endpoint.");
assert(adminPage.includes("Ten-slice completion ledger"), "Admin page should render readiness ledger.");
assert(muniData.includes("/v1/readiness"), "MuniData should document readiness endpoint.");

console.log("Readiness ledger verified: ten slices tracked with evidence and external dependencies.");
