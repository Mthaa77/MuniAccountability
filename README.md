# MuniAccountability Command

Premium municipal oversight and recovery operating system for South African institutional users.

The current MVP is an **AGSA-first municipal accountability workspace**. It combines source-backed municipal case files, intervention queues, draft action workflows, public-safe MuniCheck profiles, source health panels, validation gates and production-readiness evidence packs.

## Current Prototype Scope

- Executive Command Centre for a one-province Provincial Treasury-style pilot.
- AGSA-backed municipality profiles, findings, page citations, action workflow, briefing builder and source/data operations panels.
- Public MuniCheck and MuniData entry points.
- Versioned `/v1/*` API family backed by typed AGSA-derived data.
- Source-locked search and assistant query policy: unsupported claims are refused.
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
6. `docs/DESIGN_SYSTEM.md`
7. `docs/CSS_LAYERS.md`
8. `docs/DEVELOPER_ONBOARDING.md`
9. `docs/NEXT_STEPS.md`
10. `CODEX_CONTINUATION.md`

Folder-level guides also exist in:

```txt
app/README.md
components/README.md
components/atlas/README.md
lib/README.md
```

## Local Development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`.

Copy `.env.example` to `.env.local` when preparing Firebase/GCP settings.

## Verification Commands

Run the full platform verification chain before promoting any change:

```bash
npm run verify
```

Focused checks are also available:

```bash
npm run typecheck
npm run build
npm run test:production-readiness
npm run test:production-evidence
```

## Firebase and GCP Preparation

This repo is prepared for a cheap/free-first Firebase and GCP path:

- Firebase Hosting / App Hosting config: `firebase.json`, `apphosting.yaml`
- Firestore rules and indexes: `firestore.rules`, `firestore.indexes.json`
- Storage rules for evidence files: `storage.rules`
- Environment template: `.env.example`
- Cost-control notes: `docs/COST_CONTROL.md`
- Deployment guide: `docs/FIREBASE_GCP_DEPLOYMENT.md`

Default mode remains cheap and demo-safe:

```env
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_REQUIRE_AUTH=false
WORKFLOW_STORE_PROVIDER=local_json
DISABLE_EXPENSIVE_JOBS=true
```

## Workflow Persistence

The current active write path is local JSON, suitable for prototype review only. The workflow-store abstraction now prepares a clean switch to Firestore once Firebase Admin credentials, Auth role claims, rules and smoke tests are ready.

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
