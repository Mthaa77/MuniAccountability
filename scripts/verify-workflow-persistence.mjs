import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const persistenceSource = fs.readFileSync(path.join(root, "lib", "workflow-persistence.ts"), "utf8");
const apiRoute = fs.readFileSync(path.join(root, "app", "api", "v1", "[...resource]", "route.ts"), "utf8");
const dataQualityPage = fs.readFileSync(path.join(root, "app", "admin", "data-quality", "page.tsx"), "utf8");
const muniData = fs.readFileSync(path.join(root, "lib", "agsa-data.ts"), "utf8");

assert(persistenceSource.includes('activeProvider: "local_json"'), "Active provider should remain explicit local JSON.");
assert(persistenceSource.includes("productionReady: false"), "Local JSON workflow storage must not be marked production-ready.");
assert(persistenceSource.includes("No tenant isolation"), "Persistence model should document tenant isolation limitation.");
assert(persistenceSource.includes("Backfill current JSON records"), "Persistence model should include database migration gates.");
assert(apiRoute.includes('family === "workflow" && id === "persistence"'), "API should expose workflow persistence state.");
assert(dataQualityPage.includes("Storage provider boundary"), "Admin data-quality page should show persistence boundary.");
assert(muniData.includes("/v1/workflow/persistence"), "MuniData should document workflow persistence endpoint.");

console.log("Workflow persistence verified: local JSON active, production DB not configured.");
