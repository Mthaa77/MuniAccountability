# MuniAccountability Command

Premium municipal oversight and recovery operating system for South African institutional users.

The current MVP is an **AGSA-first municipal accountability workspace**. It combines source-backed municipal case files, intervention queues, draft action workflows, public-safe MuniCheck profiles, source health panels, validation gates, signed-session RBAC and production-readiness evidence packs.

## Current Prototype Scope

- Executive Command Centre for a one-province Provincial Treasury-style pilot.
- AGSA-backed municipality profiles, findings, page citations, action workflow, briefing builder and source/data operations panels.
- Public MuniCheck and MuniData entry points.
- Versioned `/v1/*` API family backed by typed AGSA-derived data.
- Source-locked search and assistant query policy: unsupported claims are refused.
- Signed session-cookie boundary with roles, permissions, middleware enforcement and role-aware navigation.
- Tenant-aware Firestore and Storage rules.
- Production gate model for exact MFMA annexure mapping, Treasury/Municipal Money Financial Pulse unlock and durable workflow persistence.

The prototype deliberately marks Treasury/Municipal Money telemetry as pending validation. It does not claim live financial integration.

## Developer Documentation

Start with the docs hub:

```txt
docs/README.md
```

Recommended reading order:

1. `docs/CODEBASE_MAP.md`
2. `docs/ARCHITECTURE.md`
3. `docs/FRONTEND_GUIDE.md`
4. `docs/API_REFERENCE.md`
5. `docs/WORKFLOW_MODULES.md`
6. `docs/AUTH_RBAC.md`
7. `docs/DESIGN_SYSTEM.md`
8. `docs/CSS_LAYERS.md`
9. `docs/TESTING_STRATEGY.md`
10. `docs/DEVELOPER_ONBOARDING.md`
11. `docs/QA_CHECKLIST.md`
12. `docs/DEPLOYMENT_RUNBOOK.md`
13. `docs/REPO_MAINTENANCE.md`
14. `docs/NEXT_STEPS.md`
15. `CODEX_CONTINUATION.md`

Folder-level guides also exist in:

```txt
app/README.md
components/README.md
components/atlas/README.md
lib/README.md
tests/README.md
```

## Local Development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

Copy `.env.example` to `.env.local` when preparing Firebase/GCP settings.

## Verification Commands

Run the full deterministic platform verification chain before promoting any change:

```bash
npm run verify
```

Focused checks:

```bash
npm run lint
npm run typecheck
npm run build
npm run test:institutional
npm run test:rbac-contracts
npm run test:institutional-api-contracts
npm run test:institutional-workflows
npm run test:public-safety-contracts
npm run test:css-authority-layers
npm run test:documentation-completeness
npm run test:production-readiness
npm run test:production-evidence
```

The institutional suite protects API contracts, workflow wiring, signed-session RBAC, tenant rules, public-safety rules, CSS authority layers and documentation completeness.

## Browser E2E Tests

Playwright E2E tests live under:

```txt
tests/e2e
playwright.config.mjs
```

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

The browser suite starts the app with signed-session authentication enabled and tests anonymous, viewer, reviewer and admin access boundaries.

## Authentication and RBAC

Default demo mode:

```env
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_REQUIRE_AUTH=false
MUNI_DEV_ROLE=admin
```

Supported roles:

```txt
public
viewer
analyst
reviewer
admin
super_admin
```

For signed-session testing:

```env
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_REQUIRE_AUTH=true
MUNI_SESSION_SECRET=replace-with-at-least-32-random-characters
```

Generate a development token:

```bash
npm run auth:dev-token -- --role reviewer
```

See `docs/AUTH_RBAC.md` for the role matrix, permission model, tenant isolation and future Firebase ID-token exchange flow.

## Firebase and GCP Preparation

This repo is prepared for a cheap/free-first Firebase and GCP path:

- Firebase Hosting / App Hosting config: `firebase.json`, `apphosting.yaml`
- Firestore rules and indexes: `firestore.rules`, `firestore.indexes.json`
- Storage rules for evidence files: `storage.rules`
- Environment template: `.env.example`
- Cost-control notes: `docs/COST_CONTROL.md`
- Deployment guide: `docs/FIREBASE_GCP_DEPLOYMENT.md`

## Workflow Persistence

The current active write path is local JSON, suitable for prototype review only. The workflow-store abstraction prepares a clean switch to Firestore once Firebase Admin credentials, tenant claims, Auth role claims, rules and smoke tests are ready.

Prepared providers:

- `local_json`: current deterministic prototype store
- `firestore`: hosted workflow target for review decisions, production gate reviews, draft actions and audit logs

## API Documentation

- Human-readable route summary: `/docs-api`
- OpenAPI source: `docs/openapi.yaml`
- Endpoint catalogue: `/v1/munidata`
- Developer API summary: `docs/API_REFERENCE.md`

Core API families include municipalities, case files, intervention queue, findings, AGSA documents, source search, assistant query, validation, production readiness, production evidence and MuniCheck.

## Prototype Notice

A prototype notice is shown when `NEXT_PUBLIC_DEMO_MODE=true`. See `/disclaimer` for the public data-use statement.

Important boundaries:

- Risk scores are prioritisation aids, not legal findings.
- Treasury/Municipal Money telemetry remains gated until validation passes.
- Exact municipality-level audit outcomes require official annexure validation where unresolved.
- Public MuniCheck profiles must not expose internal workflow notes or restricted evidence.
- The signed-session/RBAC foundation still requires Firebase ID-token exchange, revocation, administrator-managed claims and privileged-role MFA before production authentication is complete.
