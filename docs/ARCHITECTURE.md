# Architecture Overview

MuniAccountability Command is a Next.js municipal oversight platform with an AGSA-first evidence model.

The architecture is optimized for a premium MVP/prototype:

- fast local data iteration
- typed domain models
- source-locked evidence behavior
- workflow actions and review decisions
- public-safe publishing boundaries
- future migration to durable tenant storage

## High-level architecture

```txt
User Interface
  ↓
App Shell and Pages
  ↓
Client API Helper
  ↓
/api/v1/[...resource]
  ↓
Domain helpers, typed pilot data and local stores
```

## Current implementation

The app is implemented as a Next.js App Router prototype with a BFF-style `/v1` API family handled by:

```txt
app/api/v1/[...resource]/route.ts
```

The current data layer is mostly static and typed, but shaped to match a future warehouse and workflow-service architecture.

## User interface layer

The UI layer is built with Next.js app router pages and React components.

Core UI shell:

```txt
components/app-shell.tsx
```

The shell owns:

- sidebar navigation
- mobile menu sheet
- command search
- topbar actions
- page transition loader
- global free assistant mount

Premium workflow components live in:

```txt
components/atlas/
```

These are product-specific and should not be treated as generic UI primitives.

## API layer

The main API route is:

```txt
app/api/v1/[...resource]/route.ts
```

It routes multiple `/v1/*` API families from one flexible route handler.

The frontend should call prototype API endpoints through:

```txt
lib/client-api.ts
```

Use:

```ts
apiGet("/v1/actions/drafts")
apiPost("/v1/agsa/review-decisions", payload)
apiPatch("/v1/actions/drafts/:id", payload)
```

The helper turns `/v1/*` into `/api/v1/*` for the Next.js route.

## Domain/data layer

Typed prototype data lives in:

```txt
lib/pilot-data.ts
```

Primary domain types live in:

```txt
lib/types.ts
```

When adding new fields, update types first, then the relevant pilot data, stores and UI.

## Persistence layer

Current active persistence is prototype/local JSON.

Important stores:

```txt
lib/draft-action-store.ts
lib/agsa-review-store.ts
```

These store data under:

```txt
data/agsa/generated/
```

This is good enough for deterministic prototype review, but not for production.

Future production persistence should add:

- tenant ID
- authenticated actor ID
- timestamps
- durable audit trail
- object storage for evidence files
- role-based access control
- migration path from local JSON

## Source-locked search and assistant

Source search and free assistant logic are centered around:

```txt
lib/source-search.ts
components/atlas/free-assistant.tsx
```

The assistant should never invent claims. It should either:

1. answer from source-backed results, or
2. refuse unsupported claims.

The current assistant is free/local Evidence Mode. Paid Analyst Mode is only a future UI affordance.

## Workflow modules

The core workflow modules are:

| Step | Module | Main file | Route |
| --- | --- | --- | --- |
| 1 | Free Assistant | `components/atlas/free-assistant.tsx` | global |
| 2 | Action Studio | `components/atlas/action-studio.tsx` | `/actions` |
| 3 | Evidence Intake Desk | `components/atlas/evidence-attachment-drawer.tsx` | `/actions` |
| 4 | AGSA Review Cockpit | `components/atlas/agsa-review-desk.tsx` | `/admin/agsa-review` |

## Public-safe boundary

The public MuniCheck experience must not leak internal notes.

Public-safe routes include:

```txt
/municheck
/municheck/[municipalityId]
```

Before public output expands, ensure it respects AGSA review decisions and source confidence.

## Design system architecture

Atlas design assets currently live in many global CSS files under:

```txt
components/atlas/*.css
```

This was necessary during rapid stabilization. The final authority layers are imported last in `app/layout.tsx`.

Important final layers:

```txt
atlas-compact-desktop-rescue.css
atlas-desktop-shell-fix.css
atlas-device-polish.css
atlas-button-system.css
```

See [`CSS_LAYERS.md`](./CSS_LAYERS.md) before changing layout CSS.

## Intended production stack

- Next.js + TypeScript strict mode for institutional and public web surfaces.
- BigQuery datasets for raw, staging, core, marts and ops analytical data.
- Cloud SQL or Firestore for tenant workflow state: actions, decisions, permissions, comments and approvals.
- Cloud Storage for raw AGSA reports, source artifacts, evidence and generated briefings.
- Firebase Auth / Identity Platform for institutional access with RBAC and SSO-ready tenant boundaries.
- Source adapters with health checks, artifact hashes, schema fingerprints, validation events and fixture tests.

## Data trust rules

- No headline value appears without source, period, quality state and freshness.
- AGSA findings, Treasury submissions, client-entered updates and platform calculations remain visually distinct.
- Treasury telemetry is marked as pending validation until connector and reuse checks pass.
- Scores are operational prioritisation aids, not legal findings, credit ratings or corruption labels.

## Current architecture boundary

This app is a strong MVP/prototype, not a finished institutional production system.

Do not market prototype values as verified official findings. Treat scores as prioritization aids until official source validation is complete.
