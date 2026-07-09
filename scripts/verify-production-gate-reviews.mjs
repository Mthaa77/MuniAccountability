import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const store = JSON.parse(fs.readFileSync(path.join(root, "data", "agsa", "generated", "production-gate-reviews.json"), "utf8"));
const reviewStore = fs.readFileSync(path.join(root, "lib", "production-gate-review-store.ts"), "utf8");
const evidenceModel = fs.readFileSync(path.join(root, "lib", "production-evidence.ts"), "utf8");
const route = fs.readFileSync(path.join(root, "app", "api", "v1", "[...resource]", "route.ts"), "utf8");
const adminPage = fs.readFileSync(path.join(root, "app", "admin", "page.tsx"), "utf8");
const muniData = fs.readFileSync(path.join(root, "lib", "agsa-data.ts"), "utf8");
const cliPack = fs.readFileSync(path.join(root, "tools", "build-production-evidence-pack.mjs"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");
const workflow = fs.readFileSync(path.join(root, ".github", "workflows", "verify.yml"), "utf8");
const policy = fs.readFileSync(path.join(root, "docs", "AGSA_GENERATED_DATA_POLICY.md"), "utf8");

assert.equal(store.schemaVersion, "production-gate-reviews-v0.1", "Committed review store should have a stable schema version.");
assert(Array.isArray(store.decisions), "Committed review store should contain a decisions array.");
assert.equal(store.decisions.length, 0, "Baseline review store should be empty until real evidence is reviewed.");

assert(reviewStore.includes("ProductionGateReviewStatus"), "Review store should type gate review statuses.");
assert(reviewStore.includes('"accepted" | "needs_correction" | "excluded"'), "Review store should expose governed review statuses.");
assert(reviewStore.includes("Accepted production gate reviews require at least one evidence reference."), "Accepted reviews should require evidence references.");
assert(reviewStore.includes("listProductionGateReviews"), "Review store should list review decisions with stats.");
assert(reviewStore.includes("saveProductionGateReview"), "Review store should persist review decisions.");

assert(evidenceModel.includes("reviewGovernance"), "Evidence model should include review governance.");
assert(evidenceModel.includes("latestProductionGateReview"), "Evidence model should include latest review per gate.");
assert(cliPack.includes("reviewGovernance"), "CLI evidence pack should include review governance.");

assert(route.includes('family === "production-evidence" && id === "reviews"'), "API should expose production evidence reviews.");
assert(route.includes("saveProductionGateReview(body)"), "API should persist production gate reviews.");
assert(adminPage.includes("accepted evidence review"), "Admin should show production evidence review stats.");
assert(adminPage.includes("Latest review"), "Admin should show latest production gate review.");

assert(muniData.includes("/v1/production-evidence/reviews"), "MuniData should document production evidence review endpoints.");
assert(policy.includes("production-gate-reviews.json"), "Generated data policy should list the production gate review store.");
assert(packageJson.includes('"test:production-gate-reviews"'), "package.json should expose review verification.");
assert(packageJson.includes("test:production-gate-reviews && npm run test:production-gate-inputs"), "npm run verify should run gate review verification before input checks.");
assert(workflow.includes("Verify production gate reviews"), "CI should run production gate review verification.");

console.log("Production gate reviews verified: review store, API, Admin, MuniData and evidence packs are wired without unlocking gates.");
