# Workflow Modules

This document explains the major product workflows currently built into MuniAccountability Command.

The workflow direction is evidence-first:

```txt
Question → Source search → Action → Evidence → Review → Public-safe output
```

## Step 1: Free Source-Locked Assistant

Main files:

```txt
components/atlas/free-assistant.tsx
components/atlas/atlas-assistant.css
components/atlas/atlas-assistant-mobile-fix.css
```

Mounted globally in:

```txt
components/app-shell.tsx
```

Backend route:

```txt
POST /v1/assistant/query
```

### What it does

- Provides a floating `Ask MuniAtlas` drawer.
- Uses Evidence Mode by default.
- Keeps Analyst Mode visibly locked for future paid AI.
- Searches the backend source library.
- Refuses unsupported claims.
- Shows citations, evidence found and suggested next steps.
- Supports follow-up continuity by including previous evidence context.

### Developer notes

- Keep it source-locked.
- Do not add free-form AI claims without citations.
- Paid AI should remain optional and gated by config.
- Future action creation should connect assistant answers to Action Studio.

## Step 2: Action Studio

Main files:

```txt
components/atlas/action-studio.tsx
components/atlas/atlas-action-studio.css
components/atlas/atlas-action-studio-rescue.css
```

Mounted in:

```txt
app/actions/page.tsx
```

Backend routes:

```txt
GET   /v1/actions/drafts
POST  /v1/actions/drafts
PATCH /v1/actions/drafts/:id
POST  /v1/actions/drafts/:id/transition
POST  /v1/actions/drafts/:id/evidence
```

### What it does

- Creates draft actions from intervention queue items.
- Opens and edits draft actions.
- Assigns owner, assignee and reviewer.
- Tracks due date, status and escalation rule.
- Records required evidence.
- Attaches evidence.
- Shows readiness score.
- Shows status timeline.
- Shows source chain.

### Developer notes

- The workflow store is local JSON right now.
- Action IDs are deterministic for source queue items.
- Status transitions are saved through backend routes.
- Future production should enforce user roles and audit events.

## Step 3: Evidence Intake Desk

Main files:

```txt
components/atlas/evidence-attachment-drawer.tsx
components/atlas/atlas-evidence-drawer.css
components/atlas/atlas-evidence-drawer-upgrade.css
```

Mounted in:

```txt
app/actions/page.tsx
```

Backend route:

```txt
POST /v1/actions/drafts/:id/evidence
```

### What it does

- Provides a dedicated evidence submission workflow.
- Searches draft actions.
- Filters by proof status.
- Opens a drawer to submit evidence.
- Supports quick proof templates.
- Shows source reference preview.
- Shows required evidence and existing attachments.
- Shows proof packet coverage.

### Developer notes

- Evidence is currently metadata/URL only.
- No object storage upload exists yet.
- Coverage is keyword-based and should not be treated as legal validation.
- Future production should add file upload, scanning and access control.

## Step 4: AGSA Review Cockpit

Main files:

```txt
components/atlas/agsa-review-desk.tsx
components/atlas/atlas-agsa-review-desk.css
components/atlas/atlas-agsa-review-ultra.css
```

Mounted in:

```txt
app/admin/agsa-review/page.tsx
```

Backend routes:

```txt
GET  /v1/agsa/review-decisions
POST /v1/agsa/review-decisions
```

### What it does

- Reviews AGSA extraction issues.
- Shows source document, page number and extracted sample.
- Shows citations on the page.
- Filters review queue by document, decision state, confidence and search.
- Saves accept, correction and exclude decisions.
- Provides rationale templates.
- Provides correction field presets.
- Shows publish-safety score.
- Shows reviewer gates and blockers.
- Shows decision preview for public output.

### Developer notes

- Reviewer is currently hardcoded as `prototype-reviewer`.
- Decisions persist to prototype governance store.
- Needs auth identity and durable persistence for production.
- Future version should include PDF page preview.

## Step 5: Production Readiness Command Centre

Suggested next build.

Target route:

```txt
/admin
```

Goal:

- Turn existing admin/readiness area into a serious production gate cockpit.
- Show what is prototype-only vs production-ready.
- Make Firebase/GCP/Auth/storage/readiness blockers obvious.

Possible files:

```txt
components/atlas/production-readiness-cockpit.tsx
components/atlas/atlas-production-readiness.css
app/admin/page.tsx
```

Recommended capabilities:

- production gate cards
- current blocker list
- environment variable checklist
- Firebase/Firestore readiness
- workflow persistence readiness
- source evidence readiness
- auth/RBAC readiness
- promotion command checklist

## Step 6: Evidence Graph Explorer

Suggested future workflow.

Goal:

- Show relationship between municipalities, findings, source documents, citations, actions, evidence and review decisions.
- Start with simple cards or SVG lines.
- Add a real graph library later only if needed.

## Step 7: Create Action From Assistant

Goal:

- Add “Create action” to assistant answers/results.
- Prefill Action Studio from cited evidence.
- Connect Step 1 directly to Step 2.

## Step 8: Durable Persistence

Goal:

- Replace local JSON stores.
- Add tenant-aware durable workflow state.
- Add audit logs.
- Add authenticated actor identity.

## Step 9: Evidence File Upload

Goal:

- Replace URL-only evidence with real file upload.
- Add object storage.
- Add metadata, versioning and retention rules.

## Step 10: Paid Analyst Mode

Goal:

- Keep Evidence Mode free and source-locked.
- Add paid AI summarization only when configured.
- Preserve citation and refusal rules.

## End-to-end workflow target

The final ideal workflow:

```txt
Ask MuniAtlas
  ↓
Find source-backed evidence
  ↓
Create action from evidence
  ↓
Attach proof
  ↓
Review source/citation quality
  ↓
Generate safe briefing/public summary
```
