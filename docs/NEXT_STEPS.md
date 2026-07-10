# Next Steps Roadmap

This document summarizes the recommended next development path.

## Current status

Built and stabilized:

1. Free Source-Locked Assistant
2. Action Studio
3. Evidence Intake Desk
4. AGSA Review Cockpit
5. Premium layout/device/button polish
6. Developer documentation hub

Still needed before production:

- durable persistence
- authenticated reviewer identity
- RBAC
- evidence file upload
- production readiness cockpit
- more tests
- CSS consolidation

## Step 5: Production Readiness Command Centre

Suggested priority: **highest**

Target route:

```txt
/admin
```

Purpose:

Show exactly what is production-ready, what is still prototype-only, and what must be completed before institutional use.

Suggested files:

```txt
components/atlas/production-readiness-cockpit.tsx
components/atlas/atlas-production-readiness.css
app/admin/page.tsx
```

Suggested UI sections:

- Production gate hero
- Environment readiness cards
- Auth/RBAC readiness
- Workflow persistence readiness
- Evidence storage readiness
- AGSA source review readiness
- Treasury/Municipal Money unlock readiness
- Deployment promotion checklist
- Commands and required env vars

Suggested backend routes to use:

```txt
GET /v1/readiness
GET /v1/production-readiness
GET /v1/production-evidence
GET /v1/production-evidence/reviews
```

## Step 6: Evidence Graph Explorer

Purpose:

Visualize the relationships between:

- municipalities
- audit findings
- source documents
- citations
- actions
- evidence attachments
- AGSA review decisions

Suggested route:

```txt
/sources/graph
```

Start simple with cards and connector lines. Avoid bringing in a heavy graph library until needed.

## Step 7: Create Action From Assistant

Purpose:

Connect Step 1 and Step 2.

Flow:

```txt
Assistant answer
  ↓
Evidence result selected
  ↓
Create action
  ↓
Action Studio opens prefilled
```

Suggested work:

- add “Create action” button to assistant result cards
- pass selected result/citation context
- prefill draft action payload
- save through `/v1/actions/drafts`

## Step 8: Durable Persistence

Purpose:

Replace local JSON stores with production-grade persistence.

Suggested requirements:

- tenant ID
- actor ID
- created/updated timestamps
- audit events
- role-aware writes
- migration from existing JSON files

Candidate stores:

- Firestore
- Postgres/Cloud SQL
- Supabase/Postgres

## Step 9: Evidence File Upload

Purpose:

Replace URL-only evidence with real file uploads.

Suggested requirements:

- object storage bucket
- file metadata model
- upload UI
- signed URL access
- retention policy
- scan/validation placeholder
- source/evidence relationship model

## Step 10: Paid Analyst Mode

Purpose:

Add paid AI only after source-locked Evidence Mode is stable.

Requirements:

- environment flag
- billing/usage guardrails
- citations required
- no unsupported claims
- refusal behavior preserved
- clear UI distinction between Evidence Mode and Analyst Mode

## Technical cleanup roadmap

### CSS consolidation

Current CSS is safe but layered heavily.

Future target:

```txt
atlas-tokens.css
atlas-shell.css
atlas-components.css
atlas-workflows.css
atlas-responsive.css
atlas-motion.css
```

Do this gradually.

### Component organization

Future target:

```txt
components/atlas/
  shell/
  primitives/
  workflows/
    assistant/
    actions/
    evidence/
    agsa-review/
  styles/
```

Move files only when build verification is available.

### Store organization

Future target:

```txt
lib/stores/
lib/search/
lib/readiness/
lib/api/
lib/types/
```

## Product roadmap themes

- Evidence graph
- Source ingestion pipeline
- Review workflow
- Briefing generation
- Public-safe profile publishing
- Institutional role management
- Multi-tenant data separation
- Cost-controlled GCP/Firebase deployment

## Immediate recommended next prompt for Codex

```txt
Implement Step 5: Production Readiness Command Centre. Use docs/NEXT_STEPS.md and CODEX_CONTINUATION.md. Preserve existing mobile and desktop layout. Do not move files. Add a dedicated production-readiness cockpit component and CSS layer. Use existing /v1/readiness, /v1/production-readiness and /v1/production-evidence routes. Update docs after implementation.
```
