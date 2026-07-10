# Tests

This folder contains browser-level institutional tests.

## Current test layers

The project has two major test families:

1. **Node verification scripts** under `scripts/verify-*.mjs`  
   These are fast, deterministic contract tests and run inside `npm run verify`.

2. **Playwright browser E2E tests** under `tests/e2e`  
   These open the actual Next.js app in Chromium and verify institutional user journeys.

## Run institutional contract tests

```bash
npm run test:institutional
```

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

## E2E scope

Current Playwright tests cover:

- command shell navigation
- command search to AGSA Review Cockpit
- mobile menu navigation
- Ask MuniAtlas source-lock behavior
- Action Studio presence
- Evidence Intake Desk presence
- AGSA Review Cockpit publish-safety/decision controls
- public MuniCheck safety boundary

## Why E2E is not inside `npm run verify`

Browser tests are heavier because they install/run Chromium. The normal `verify` command should remain fast enough for frequent local and CI checks.

Use E2E for:

- release checks
- major UI changes
- navigation changes
- workflow changes
- assistant drawer changes
- desktop/mobile layout changes

## CI workflow

The dedicated GitHub Actions workflow is:

```txt
.github/workflows/e2e.yml
```

It runs manually through `workflow_dispatch` and on pull requests that touch app, component, lib, E2E or config files.
