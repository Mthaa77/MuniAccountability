import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");
const exists = (...parts) => fs.existsSync(path.join(root, ...parts));

const packageJson = read("package.json");
const playwrightConfig = read("playwright.config.mjs");
const e2eWorkflow = read(".github", "workflows", "e2e.yml");
const authHelper = read("tests", "e2e", "helpers", "auth.mjs");
const testsReadme = read("tests", "README.md");
const testingStrategy = read("docs", "TESTING_STRATEGY.md");

const requiredSpecs = [
  "command-shell.spec.mjs",
  "assistant-source-lock.spec.mjs",
  "workflow-cockpits.spec.mjs",
  "production-readiness.spec.mjs",
  "accessibility-keyboard.spec.mjs",
  "rbac-access.spec.mjs"
];

for (const spec of requiredSpecs) {
  assert(exists("tests", "e2e", spec), `Missing E2E spec: ${spec}`);
}

assert(exists("tests", "e2e", "helpers", "auth.mjs"), "Missing signed-session E2E auth helper.");

const specContracts = {
  "command-shell.spec.mjs": ["Command shell navigation", "Action Board", "AGSA Review Cockpit", "mobile menu"],
  "assistant-source-lock.spec.mjs": ["Evidence Mode", "No source means no assertion", "irregular expenditure"],
  "workflow-cockpits.spec.mjs": ["Action Studio", "Evidence Intake Desk", "Publish safety", "Public MuniCheck"],
  "production-readiness.spec.mjs": ["Production readiness gate-room", "Readiness gate ladder", "Promotion rules"],
  "accessibility-keyboard.spec.mjs": ["accessible names", "keyboard", "Close assistant"],
  "rbac-access.spec.mjs": ["Institutional RBAC boundaries", "authentication_required", "insufficient_permission", "reviewer", "admin"]
};

for (const [spec, tokens] of Object.entries(specContracts)) {
  const source = read("tests", "e2e", spec);
  for (const token of tokens) {
    assert(source.includes(token), `${spec} is missing institutional coverage token: ${token}`);
  }
}

[
  "createSessionToken",
  "createHmac",
  "sha256",
  "muni_session",
  "authenticateAs",
  "signOut"
].forEach((token) => assert(authHelper.includes(token), `E2E signed-session helper missing ${token}.`));

[
  "test:e2e",
  "test:e2e:headed",
  "test:e2e:install"
].forEach((token) => assert(packageJson.includes(token), `package.json missing ${token}.`));

[
  "chromium-desktop",
  "chromium-mobile",
  "trace: \"retain-on-failure\"",
  "screenshot: \"only-on-failure\"",
  "PLAYWRIGHT_BASE_URL",
  "authenticatedStorageState",
  "sessionCookie(\"admin\"",
  "NEXT_PUBLIC_REQUIRE_AUTH: \"true\"",
  "MUNI_SESSION_SECRET"
].forEach((token) => assert(playwrightConfig.includes(token), `playwright.config.mjs missing ${token}.`));

[
  "workflow_dispatch",
  "Install Chromium browser",
  "Run E2E tests",
  "Upload Playwright report",
  "Upload Playwright traces",
  'NEXT_PUBLIC_REQUIRE_AUTH: "true"',
  "MUNI_E2E_SESSION_SECRET"
].forEach((token) => assert(e2eWorkflow.includes(token), `E2E workflow missing ${token}.`));

[
  "Browser E2E suite",
  "npm run test:e2e",
  "production-readiness",
  "accessibility-keyboard",
  "rbac-access",
  "signed sessions"
].forEach((token) => assert(testsReadme.includes(token), `tests/README.md missing ${token}.`));

[
  "Browser E2E tests",
  "Playwright",
  "public MuniCheck boundary",
  "accessibility",
  "signed-session RBAC"
].forEach((token) => assert(testingStrategy.includes(token), `Testing strategy missing ${token}.`));

console.log("E2E suite contracts verified: browser specs, signed sessions, Playwright config, CI workflow and docs are wired for institutional readiness.");
