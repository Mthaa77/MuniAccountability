# Institutional Testing Strategy

This document defines the testing strategy for making MuniAccountability Command institution-ready.

The goal is not only to check that the app builds. The goal is to prove the platform preserves its trust model:

> No proof, no public claim.

## Current test approach

The project now uses two complementary test layers:

1. zero-dependency Node verification scripts under `scripts/verify-*.mjs`
2. Playwright browser E2E tests under `tests/e2e`

The deterministic verification command is:

```bash
npm run verify
```

The browser E2E command is:

```bash
npm run test:e2e
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
- QA/deployment/maintenance/auth docs exist
- GitHub templates exist

### 8. E2E suite contract safety

Script:

```bash
npm run test:e2e-contracts
```

Purpose:

- required browser specs remain present
- Playwright config keeps desktop and mobile projects
- signed-session helpers remain present
- failure artifacts remain enabled
- E2E GitHub workflow remains wired
- browser test docs remain complete

This is part of `npm run test:institutional`, so the browser suite cannot silently disappear even though browser execution remains a separate release check.

### 9. Authentication and RBAC contracts

Script:

```bash
npm run test:rbac-contracts
```

Purpose:

- canonical roles and permissions remain defined
- route and method policies remain centralized
- middleware does not trust client role headers
- signed HMAC session format remains valid
- server session resolution remains wired
- role-aware navigation remains present
- access-denied behavior remains documented
- local signed-session generation remains testable

See:

```txt
docs/AUTH_RBAC.md
```

### 10. Browser E2E tests and regression checks

Scripts:

```bash
npm run test:e2e:install
npm run test:e2e
npm run test:e2e:headed
```

Purpose:

- verify the app in a real Chromium browser
- protect desktop and mobile shell behavior
- test assistant source-lock UX
- test Action Studio and Evidence Intake visibility
- test AGSA Review Cockpit governance controls
- test the public MuniCheck boundary and public-safety rules
- test production-readiness gate-room and promotion controls
- smoke test keyboard-accessible controls and labelled drawers
- test signed-session RBAC for anonymous, viewer, reviewer and admin roles

The E2E suite lives in:

```txt
tests/e2e
playwright.config.mjs
```

Current specs include:

```txt
command-shell.spec.mjs
assistant-source-lock.spec.mjs
workflow-cockpits.spec.mjs
production-readiness.spec.mjs
accessibility-keyboard.spec.mjs
rbac-access.spec.mjs
```

Playwright runs the application with authentication enabled and a signed admin session by default. The RBAC spec replaces or removes the session cookie to test lower-privilege boundaries.

The dedicated E2E CI workflow is:

```txt
.github/workflows/e2e.yml
```

Browser tests are not included inside `npm run verify` because they install/run Chromium and are heavier than deterministic contract checks. Run them for release readiness, authentication changes, major UI changes and workflow regressions.

## Institutional readiness test command

A dedicated command runs the institutional contract layer:

```bash
npm run test:institutional
```

It includes:

```txt
test:institutional-api-contracts
test:institutional-workflows
test:public-safety-contracts
test:css-authority-layers
test:documentation-completeness
test:e2e-contracts
test:rbac-contracts
```

## CI expectation

GitHub Actions should run:

1. all fixture tests
2. all institutional tests
3. typecheck
4. build

The deterministic verification workflow file is:

```txt
.github/workflows/verify.yml
```

The browser E2E workflow file is:

```txt
.github/workflows/e2e.yml
```

## Future test upgrades

### Unit test runner

Add Vitest for executable TypeScript unit tests covering:

- source-search scoring
- review overlay rules
- readiness gate calculations
- role and permission evaluation
- session expiry and tamper cases
- workflow store adapters

### Component tests

Add React Testing Library for:

- assistant drawer behavior
- Action Studio modal states
- Evidence Intake form validation
- AGSA Review decision form
- role-aware navigation rendering
- access-denied states

### Accessibility tests

The current E2E suite has keyboard/accessibility smoke tests. Add axe checks later for deeper automated accessibility coverage on:

- navigation
- dialogs/sheets
- assistant drawer
- review cockpit
- access-denied page
- keyboard focus states

### Security tests

Add dedicated security testing for:

- expired sessions
- tampered signatures
- cross-tenant session claims
- missing/rotated session secrets
- CSRF controls on mutation endpoints
- rate limits and abuse controls
- Firebase token exchange and revocation

## Institutional pass criteria

A release should not be considered institution-ready unless this passes locally and in CI:

```bash
npm run verify
```

For release candidates and major UI, workflow or authentication changes, also run:

```bash
npm run test:e2e
```

Manual QA should also pass using:

```txt
docs/QA_CHECKLIST.md
```
