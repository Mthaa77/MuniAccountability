# Institutional Testing Strategy

This document defines the testing strategy for making MuniAccountability Command institution-ready.

The goal is not only to check that the app builds. The goal is to prove the platform preserves its trust model:

> No proof, no public claim.

## Current test approach

The project currently uses zero-dependency Node verification scripts under:

```txt
scripts/verify-*.mjs
```

These tests are designed for institutional fixture and contract verification. They are lightweight, deterministic and suitable for CI.

The main command is:

```bash
npm run verify
```

## Test layers

### 1. Type and build safety

Commands:

```bash
npm run typecheck
npm run build
```

Purpose:

- TypeScript correctness
- Next.js build safety
- import/path correctness
- production bundle check

### 2. Data fixture integrity

Existing tests verify AGSA generated data, governance fixtures, validation gates, source manifests, annexure imports and Treasury validation boundaries.

Purpose:

- source data shape remains stable
- generated data contracts remain valid
- validation boundaries stay explicit

### 3. Source-lock and assistant safety

Scripts:

```bash
npm run test:source-search-fixtures
npm run test:institutional-api-contracts
npm run test:institutional-workflows
```

Purpose:

- assistant endpoint stays source-locked
- unsupported claims remain refused
- search results retain citations
- assistant UI stays wired to `/v1/assistant/query`

### 4. Workflow integrity

Scripts:

```bash
npm run test:workflow-persistence
npm run test:institutional-workflows
```

Purpose:

- local JSON remains explicit prototype persistence
- Action Studio remains wired to draft-action endpoints
- Evidence Intake remains wired to evidence attachment endpoint
- AGSA Review Cockpit remains wired to review-decision endpoint

### 5. Public-safety contracts

Script:

```bash
npm run test:public-safety-contracts
```

Purpose:

- public MuniCheck pages exclude internal notes
- public routes expose source/review/confidence boundaries
- excluded review states are not published
- platform caveats remain visible

### 6. CSS and device safety

Script:

```bash
npm run test:css-authority-layers
```

Purpose:

- final layout CSS files remain imported in safe order
- desktop/laptop authority rules remain present
- compact desktop rescue remains present
- button authority layer remains present
- CSS safety docs remain aligned

### 7. Documentation completeness

Script:

```bash
npm run test:documentation-completeness
```

Purpose:

- docs hub remains complete
- folder READMEs exist
- QA/deployment/maintenance docs exist
- GitHub templates exist

## Institutional readiness test command

A dedicated command should run the institutional safety layer:

```bash
npm run test:institutional
```

It should include:

```txt
test:institutional-api-contracts
test:institutional-workflows
test:public-safety-contracts
test:css-authority-layers
test:documentation-completeness
```

## CI expectation

GitHub Actions should run:

1. all fixture tests
2. all institutional tests
3. typecheck
4. build

The workflow file is:

```txt
.github/workflows/verify.yml
```

## Future test upgrades

### Unit test runner

Add Vitest when the app needs executable TypeScript unit tests for:

- pure helpers
- stores
- source-search scoring
- review overlay rules
- readiness gate calculations

### Component tests

Add React Testing Library later for:

- assistant drawer behavior
- Action Studio modal states
- Evidence Intake form validation
- AGSA Review decision form

### Browser E2E tests

Add Playwright when the platform needs full institutional regression checks:

- `/actions` workflow
- `/admin/agsa-review` review save
- assistant source-lock refusal
- mobile navigation
- desktop layout
- public MuniCheck boundary

### Accessibility tests

Add axe checks later for:

- navigation
- dialogs/sheets
- assistant drawer
- review cockpit
- keyboard focus states

## Institutional pass criteria

A release should not be considered institution-ready unless:

```bash
npm run verify
```

passes locally and in CI.

Manual QA should also pass using:

```txt
docs/QA_CHECKLIST.md
```

## What the tests protect

The tests are designed to protect:

- source-backed evidence behavior
- public-safety boundaries
- API route contracts
- workflow endpoint wiring
- review decision governance
- CSS import authority
- documentation completeness
- production readiness clarity

## What the tests do not protect yet

Current tests do not fully cover:

- browser-level click flows
- actual file uploads
- authenticated RBAC
- real database writes
- visual screenshot regression
- accessibility scans
- performance budgets

Those should be added as the platform moves from premium MVP to production-grade institutional system.
