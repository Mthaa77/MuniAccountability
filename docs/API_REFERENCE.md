# API Reference

This document summarizes the prototype API surface used by the frontend.

The main route handler is:

```txt
app/api/v1/[...resource]/route.ts
```

The frontend should call API routes through:

```txt
lib/client-api.ts
```

Example:

```ts
await apiGet("/v1/actions/drafts")
await apiPost("/v1/agsa/review-decisions", payload)
```

## API design notes

- The API is a prototype backend-for-frontend layer.
- It is designed to mimic future service boundaries.
- Many reads are backed by typed pilot data.
- Workflow writes currently use local JSON stores.
- API responses are suitable for MVP workflows, not production-grade institutional integration yet.

## Municipal routes

```txt
GET /v1/municipalities
GET /v1/municipalities/:id
GET /v1/municipalities/:id/case-file
GET /v1/municipalities/:id/audit-history
GET /v1/municipalities/:id/financial-pulse
GET /v1/municipalities/:id/actions
GET /v1/municipalities/:id/sources
```

Used by municipality lists, municipality dossier pages and public/private oversight workflows.

## Intervention queue routes

```txt
GET  /v1/intervention-queue
POST /v1/intervention-queue/:id/assign
POST /v1/intervention-queue/:id/escalate
```

The queue ranks risk and work items for oversight attention.

## Action workflow routes

```txt
GET   /v1/actions
GET   /v1/actions/drafts
POST  /v1/actions/drafts
PATCH /v1/actions/drafts/:id
POST  /v1/actions/drafts/:id/transition
POST  /v1/actions/drafts/:id/evidence
PATCH /v1/actions/:id
```

Used by:

```txt
components/atlas/action-studio.tsx
components/atlas/evidence-attachment-drawer.tsx
```

### Draft action lifecycle

Common statuses:

```txt
not_started
in_progress
evidence_submitted
under_review
approved
rejected
overdue
escalated
closed_with_residual_risk
```

### Evidence attachment payload

Typical payload:

```json
{
  "label": "Signed management response",
  "url": "https://example.com/evidence.pdf",
  "submittedBy": "Oversight reviewer",
  "note": "Reviewer should confirm owner and due date.",
  "sourceRefId": "source_123"
}
```

## AGSA routes

```txt
GET /v1/agsa/documents
GET /v1/agsa/documents/:id
GET /v1/agsa/findings
GET /v1/agsa/outcomes
GET /v1/agsa/citations
GET /v1/agsa/extraction-issues
GET /v1/agsa/extract
GET /v1/agsa/review-decisions
POST /v1/agsa/review-decisions
```

Used by:

```txt
/admin/agsa-review
components/atlas/agsa-review-desk.tsx
```

### Review decision statuses

```txt
accepted
correction
excluded
```

### Review decision payload

Typical payload:

```json
{
  "decisionKey": "doc:p1:issue",
  "documentId": "doc_id",
  "pageNumber": 1,
  "issue": "Low confidence extraction",
  "status": "correction",
  "reviewer": "prototype-reviewer",
  "citationIds": ["citation_1"],
  "replacementField": "auditOutcome",
  "replacementValue": "Qualified opinion",
  "rationale": "Correction required after checking page context."
}
```

## Source and search routes

```txt
GET /v1/sources
GET /v1/data-freshness
GET /v1/search?q=
POST /v1/assistant/query
```

Used by:

- Source Library
- Source Search
- Ask MuniAtlas assistant
- topbar source health pill

## Assistant route

```txt
POST /v1/assistant/query
```

The assistant should obey source-locked behavior.

Expected behavior:

- answer only when evidence exists
- refuse unsupported claims
- return citations/results where possible
- keep paid AI optional and future-gated

Current free assistant sends:

```json
{
  "query": "question text",
  "displayQuery": "visible question text",
  "mode": "evidence",
  "continuity": true
}
```

## Validation and readiness routes

```txt
GET /v1/validation
GET /v1/validation/annexures
GET /v1/validation/treasury
GET /v1/readiness
GET /v1/production-readiness
GET /v1/production-evidence
GET /v1/production-evidence/reviews
POST /v1/production-evidence/reviews
```

These support the production readiness and evidence gate model.

## Public/export routes

```txt
GET /v1/municheck
GET /v1/municheck/:id
GET /v1/munidata
GET /v1/changes?since=
```

Public and export routes should never expose restricted internal workflow notes.

## Persistence warning

Current write routes mostly persist to local JSON through helper stores.

This is not production-ready. Before production:

- replace local JSON with durable tenant store
- add authenticated user identity
- add authorization checks
- add audit events
- add validation on all mutation payloads
- add tests for every mutation route

## Adding a new API route

1. Add route handling inside `app/api/v1/[...resource]/route.ts`.
2. Add or update domain types in `lib/types.ts`.
3. Add helper logic in `lib/*` if needed.
4. Add frontend helper calls through `lib/client-api.ts`.
5. Document the route in this file.
6. Add tests or manual verification notes.
