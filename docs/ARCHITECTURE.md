# Architecture Overview

MuniAccountability Command is a Next.js municipal oversight platform with an AGSA-first evidence model.

The architecture is optimized for a premium MVP/prototype:

- fast local data iteration
- typed domain models
- source-locked evidence behavior
- workflow actions and review decisions
- public-safe publishing boundaries
- signed-session RBAC
- tenant-aware storage rules
- future migration to durable tenant storage

## High-level architecture

```txt
User Interface
  ↓
Role-aware App Shell and Pages
  ↓
Signed Session + Middleware RBAC
  ↓
Client API Helper
  ↓
/api/v1/[...resource]
  ↓
Domain helpers, typed pilot data and local stores
  ↓
Future Firestore / Cloud Storage tenant services
```

## Current implementation

The app is implemented as a Next.js App Router prototype with a BFF-style `/v1` API family handled by:

```txt
app/api/v1/[...resource]/route.ts
```

The current data layer is mostly static and typed, but shaped to match a future warehouse and workflow-service architecture.

## Authentication and access layer

Primary files:

```txt
lib/auth/roles.ts
lib/auth/session-token.ts
lib/auth/server-session.ts
components/auth/access-provider.tsx
middleware.ts
app/access-denied/page.tsx
```

Responsibilities:

- canonical role and permission matrix
- path and HTTP-method policy
- HMAC-signed session verification
- server-side current-user resolution
- middleware `401`/`403` enforcement
- role-aware navigation and controls
- public-safe denial experience

The browser does not supply trusted role headers. Tenant and role are resolved from a signed session. Firestore and Storage rules independently enforce tenant membership and role boundaries.

The current auth layer is a strong foundation, but production still needs Firebase ID-token exchange, session revocation, administrator-managed role claims, privileged-role MFA and security-event logs.

See:

```txt
docs/AUTH_RBAC.md
```

## User interface layer

The UI layer is built with Next.js app router pages and React components.

Core UI shell:

```txt
components/app-shell.tsx
```

The shell owns:

- role-aware sidebar navigation
- mobile menu sheet
- command search
- topbar identity and role badge
- source health
- page transition loader
- assistant visibility based on permission

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

The helper turns `/v1/*` into `/api/v1/*` for the Next.js route. Middleware applies method-aware authorization before the route handler executes.

## Domain/data layer

Typed prototype data lives in:

```txt
lib/pilot-data.ts
```

Primary domain types live in:

```txt
lib/types.ts
```

When adding new fields, update types first, then the relevant pilot data, stores, API contracts, UI and docs.

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

This is suitable for deterministic prototype review, but not production.

Future production persistence should add:

- tenant ID
- authenticated actor ID
- timestamps
- durable audit trail
- object storage for evidence files
- transaction/concurrency behavior
- migration path from local JSON

## Firebase data rules

Prepared security files:

```txt
firestore.rules
storage.rules
```

They enforce:

- `request.auth.token.tenantId` matches the tenant path
- role-based read/write boundaries
- `super_admin` cross-tenant exception
- immutable audit logs
- evidence file size and content-type controls
- deny-by-default fallback rules

Emulator tests are still required before production deployment.

## Source-locked search and assistant

Source search and free assistant logic are centered around:

```txt
lib/source-search.ts
components/atlas/free-assistant.tsx
```

The assistant should never invent claims. It should either:

1. answer from source-backed results, or
2. refuse unsupported claims.

The current assistant is free/local Evidence Mode. Paid Analyst Mode is only a future UI affordance. Assistant queries require analyst-level permission when authentication is enabled.

## Workflow modules

| Step | Module | Main file | Route |
| --- | --- | --- | --- |
| 1 | Free Assistant | `components/atlas/free-assistant.tsx` | global, analyst+ |
| 2 | Action Studio | `components/atlas/action-studio.tsx` | `/actions` |
| 3 | Evidence Intake Desk | `components/atlas/evidence-attachment-drawer.tsx` | `/actions` |
| 4 | AGSA Review Cockpit | `components/atlas/agsa-review-desk.tsx` | `/admin/agsa-review`, reviewer+ |
| 5 | Production Readiness | `app/admin/page.tsx` | `/admin`, admin+ |

## Public-safe boundary

The public MuniCheck experience must not leak internal notes.

Public-safe routes include:

```txt
/municheck
/municheck/[municipalityId]
/disclaimer
```

Before public output expands, ensure it respects AGSA review decisions, publication state and source confidence.

## Design system architecture

Atlas design assets currently live in global CSS files under:

```txt
components/atlas/*.css
```

Final authority layers include device, navigation, button and RBAC polish. Import order in `app/layout.tsx` matters.

See:

```txt
docs/CSS_LAYERS.md
```

## Testing architecture

Deterministic institutional verification:

```bash
npm run verify
```

Browser-level signed-session testing:

```bash
npm run test:e2e
```

The test suite covers API contracts, workflows, source-locking, public safety, CSS authority, RBAC, tenant rules, accessibility smoke checks and production-readiness journeys.

## Intended production stack

- Next.js + TypeScript strict mode for institutional and public web surfaces.
- BigQuery datasets for raw, staging, core, marts and ops analytical data.
- Firestore or Cloud SQL for tenant workflow state.
- Cloud Storage for source artifacts, evidence and generated briefings.
- Firebase Auth / Identity Platform for institutional access with SSO-ready tenant boundaries.
- Server-side Firebase token exchange into short-lived application sessions.
- Source adapters with health checks, hashes, schema fingerprints and validation events.
- Central audit/security event pipeline.

## Data trust rules

- No headline value appears without source, period, quality state and freshness.
- AGSA findings, Treasury submissions, client-entered updates and platform calculations remain visually distinct.
- Treasury telemetry is marked as pending validation until connector and reuse checks pass.
- Scores are operational prioritisation aids, not legal findings, credit ratings or corruption labels.
- No protected route relies on UI hiding alone.

## Current architecture boundary

This app is a strong MVP with institutional security foundations, not a finished production system.

Do not market prototype values as verified official findings. Do not describe authentication as production-complete until Firebase exchange, revocation, MFA, tenant membership administration and security audit logging are operational.
