import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const route = fs.readFileSync(path.join(root, "app", "api", "v1", "[...resource]", "route.ts"), "utf8");
const adminPage = fs.readFileSync(path.join(root, "app", "admin", "page.tsx"), "utf8");
const muniData = fs.readFileSync(path.join(root, "lib", "agsa-data.ts"), "utf8");
const model = fs.readFileSync(path.join(root, "lib", "production-evidence.ts"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");
const workflow = fs.readFileSync(path.join(root, ".github", "workflows", "verify.yml"), "utf8");

assert(model.includes("buildProductionReadinessPreflight"), "Production evidence model should expose a preflight builder.");
assert(model.includes("buildProductionEvidencePack"), "Production evidence model should expose an evidence pack builder.");
assert(model.includes("Financial Pulse must remain gated"), "Production evidence model should preserve the Treasury gate.");
assert(model.includes('workflowPersistence.activeProvider === "local_json"'), "Production evidence model should not mark local JSON workflow storage as production-ready.");

assert(route.includes('family === "production-readiness"'), "API should expose /v1/production-readiness.");
assert(route.includes("buildProductionReadinessPreflight()"), "Production readiness API should return the platform preflight model.");
assert(route.includes('family === "production-evidence"'), "API should expose /v1/production-evidence.");
assert(route.includes("buildProductionEvidencePack()"), "Production evidence API should return the operator evidence pack.");
assert(route.includes("production-evidence-pack-v0.1"), "MuniData metadata should list the production evidence schema.");

assert(adminPage.includes("Production evidence intake"), "Admin should render production evidence intake.");
assert(adminPage.includes("/v1/production-evidence"), "Admin should link to the production evidence API.");
assert(adminPage.includes("evidence required"), "Admin should communicate that external evidence is still required.");

assert(muniData.includes("/v1/production-readiness"), "MuniData catalogue should list the production readiness endpoint.");
assert(muniData.includes("/v1/production-evidence"), "MuniData catalogue should list the production evidence endpoint.");
assert(muniData.includes("promotion commands and guardrails"), "MuniData catalogue should describe evidence-pack guardrails.");

assert(packageJson.includes('"test:production-evidence-surface"'), "package.json should expose the production evidence surface verifier.");
assert(packageJson.includes("test:production-evidence && npm run test:production-evidence-surface"), "npm run verify should run the surface verifier after evidence-pack verification.");
assert(workflow.includes("Verify production evidence surface"), "CI should run the production evidence surface verifier.");

console.log("Production evidence surface verified: API, Admin and MuniData expose readiness evidence without unlocking external gates.");
