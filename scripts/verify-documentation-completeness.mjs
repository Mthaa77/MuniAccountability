import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");
const exists = (...parts) => fs.existsSync(path.join(root, ...parts));

const requiredDocs = [
  "docs/README.md",
  "docs/CODEBASE_MAP.md",
  "docs/ARCHITECTURE.md",
  "docs/FRONTEND_GUIDE.md",
  "docs/API_REFERENCE.md",
  "docs/WORKFLOW_MODULES.md",
  "docs/AUTH_RBAC.md",
  "docs/DESIGN_SYSTEM.md",
  "docs/CSS_LAYERS.md",
  "docs/TESTING_STRATEGY.md",
  "docs/DEVELOPER_ONBOARDING.md",
  "docs/QA_CHECKLIST.md",
  "docs/DEPLOYMENT_RUNBOOK.md",
  "docs/REPO_MAINTENANCE.md",
  "docs/NEXT_STEPS.md",
  "CODEX_CONTINUATION.md",
  "CONTRIBUTING.md",
  "tests/README.md",
  "app/README.md",
  "components/README.md",
  "components/atlas/README.md",
  "lib/README.md",
  ".github/pull_request_template.md",
  ".github/ISSUE_TEMPLATE/bug_report.md",
  ".github/ISSUE_TEMPLATE/feature_request.md"
];

requiredDocs.forEach((docPath) => assert(exists(...docPath.split("/")), `Missing required institutional documentation: ${docPath}`));

const docsHub = read("docs", "README.md");
[
  "CODEBASE_MAP.md",
  "ARCHITECTURE.md",
  "FRONTEND_GUIDE.md",
  "API_REFERENCE.md",
  "WORKFLOW_MODULES.md",
  "AUTH_RBAC.md",
  "DESIGN_SYSTEM.md",
  "CSS_LAYERS.md",
  "TESTING_STRATEGY.md",
  "DEVELOPER_ONBOARDING.md",
  "QA_CHECKLIST.md",
  "DEPLOYMENT_RUNBOOK.md",
  "REPO_MAINTENANCE.md",
  "NEXT_STEPS.md",
  "CODEX_CONTINUATION.md"
].forEach((token) => assert(docsHub.includes(token), `Documentation hub must link ${token}.`));

const codebaseMap = read("docs", "CODEBASE_MAP.md");
[
  "app/",
  "components/",
  "components/atlas/",
  "lib/",
  "data/",
  "Safe organization strategy"
].forEach((token) => assert(codebaseMap.includes(token), `Codebase map missing ${token}.`));

const onboarding = read("docs", "DEVELOPER_ONBOARDING.md");
[
  "npm run lint",
  "npm run build",
  "phone browser with “Desktop site” enabled",
  "No proof, no public claim"
].forEach((token) => assert(onboarding.includes(token), `Onboarding doc missing ${token}.`));

const testingStrategyExists = exists("docs", "TESTING_STRATEGY.md");
assert(testingStrategyExists, "Institutional testing strategy document must exist.");

console.log(`Documentation completeness verified: ${requiredDocs.length} required documentation artifacts are present and indexed.`);
