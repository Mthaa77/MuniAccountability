import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const sql = fs.readFileSync(path.join(root, "db", "workflow", "001_workflow_persistence.sql"), "utf8");
const generator = fs.readFileSync(path.join(root, "tools", "build-workflow-backfill-manifest.mjs"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data", "agsa", "generated", "workflow-backfill-manifest.json"), "utf8"));
const persistenceSource = fs.readFileSync(path.join(root, "lib", "workflow-persistence.ts"), "utf8");

assert(sql.includes("create table if not exists workflow_review_decisions"), "SQL must create review decision table.");
assert(sql.includes("create table if not exists workflow_draft_actions"), "SQL must create draft action table.");
assert(sql.includes("create table if not exists workflow_persistence_migrations"), "SQL must create migration ledger table.");
assert(sql.includes("tenant_id text not null"), "Workflow tables must include tenant_id.");
assert(sql.includes("status_history jsonb"), "Draft action table must preserve status history.");
assert(sql.includes("evidence_attachments jsonb"), "Draft action table must preserve evidence attachments.");

assert(generator.includes("workflow-backfill-manifest.json"), "Backfill generator should write the committed manifest path.");
assert(generator.includes("normalizeReviewDecision"), "Backfill generator should normalize review decisions.");
assert(generator.includes("normalizeDraftAction"), "Backfill generator should normalize draft actions.");

assert.equal(manifest.schemaVersion, "workflow-backfill-manifest-v0.1", "Unexpected workflow backfill manifest schema.");
assert.equal(manifest.sourceProvider, "local_json", "Backfill manifest should migrate from local_json.");
assert.equal(manifest.targetProvider, "database", "Backfill manifest should target database.");
assert(Array.isArray(manifest.parityChecks) && manifest.parityChecks.length >= 4, "Backfill manifest should define API parity checks.");

assert(persistenceSource.includes("db/workflow/001_workflow_persistence.sql"), "Persistence model should reference SQL migration.");
assert(persistenceSource.includes("tools/build-workflow-backfill-manifest.mjs"), "Persistence model should reference backfill generator.");

console.log("Workflow migration verified: SQL schema, backfill manifest and parity checks present.");
