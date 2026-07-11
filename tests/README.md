# Browser E2E suite

This folder contains browser-level institutional tests.

## Current test layers

The project has two major test families:

1. **Node verification scripts** under `scripts/verify-*.mjs`  
   These are fast, deterministic contract tests and run inside `npm run verify`.

2. **Playwright browser E2E tests** under `tests/e2e`  
   These open the actual Next.js app in Chromium and verify institutional user journeys using signed sessions.

## Run institutional contract tests

```bash
npm run test:institutional
```

This also verifies that the E2E suite, Playwright config, signed-session helpers, E2E workflow and browser-test documentation remain present.

## Run all deterministic verification checks

```bash
npm run verify
```

## Run browser E2E tests

Install Chromium once:

```bash
npm run test:e2e:install
```

Run the browser suite:

```bash
npm run test:e2e
```

Run headed for debugging:

```bash
npm run test:e2e:headed
```

Playwright starts the app with authentication enabled. The default browser context receives a signed `admin` session. RBAC tests replace or remove that cookie to verify anonymous, viewer, reviewer and admin access boundaries.

## E2E scope

Current Playwright tests cover:

- command shell navigation
- command search to AGSA Review Cockpit
- mobile menu navigation
- Ask MuniAtlas source-lock behavior
- unsupported-claim refusal
- source-backed evidence prompt
- Action Studio presence
- Evidence Intake Desk presence
- AGSA Review Cockpit publish-safety/decision controls
- public MuniCheck safety boundary
- production-readiness gate-room
- production evidence unlock gates
- promotion rules
- admin shortcuts
- keyboard access smoke checks
- assistant drawer labelled-control checks
- mobile public-safety labels
- signed-session RBAC boundaries
- anonymous public access
- viewer evidence access
- reviewer governance access
- admin readiness access

## Current specs

```txt
tests/e2e/command-shell.spec.mjs
tests/e2e/assistant-source-lock.spec.mjs
tests/e2e/workflow-cockpits.spec.mjs
tests/e2e/production-readiness.spec.mjs
tests/e2e/accessibility-keyboard.spec.mjs
tests/e2e/rbac-access.spec.mjs
tests/e2e/helpers/auth.mjs
```

## E2E contract verification

The static E2E suite verifier is:

```bash
npm run test:e2e-contracts
```

It checks:

- required E2E specs exist
- `rbac-access`, production-readiness and accessibility-keyboard specs remain present
- signed-session helpers remain wired
- `playwright.config.mjs` keeps desktop/mobile projects, authentication and failure artifacts
- `.github/workflows/e2e.yml` keeps reports/traces upload
- docs continue to describe the browser suite

## Why browser E2E is not inside `npm run verify`

Browser tests are heavier because they install/run Chromium. The normal `verify` command should remain fast enough for frequent local and CI checks.

Use E2E for:

- release checks
- major UI changes
- navigation changes
- workflow changes
- authentication/RBAC changes
- assistant drawer changes
- desktop/mobile layout changes
- production-readiness screen changes
- public-safety page changes

## CI workflow

The dedicated GitHub Actions workflow is:

```txt
.github/workflows/e2e.yml
```

It runs with signed sessions through `workflow_dispatch` and on pull requests that touch app, component, lib, E2E or config files.
