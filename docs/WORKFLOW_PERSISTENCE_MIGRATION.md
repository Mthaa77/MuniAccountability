# Workflow persistence migration

The current workflow store is intentionally local JSON. It is useful for prototype review, deterministic tests and single-workspace demos, but it is not production-durable.

## Current provider

- Provider: `local_json`
- Review decisions: `data/agsa/generated/agsa-review-decisions.json`
- Draft actions: `data/agsa/generated/draft-actions.json`
- Status: active for prototype use only

## Durable target

The durable target is a tenant-scoped PostgreSQL-compatible database. The initial schema lives at:

```text
db/workflow/001_workflow_persistence.sql
```

It defines:

- `workflow_review_decisions`
- `workflow_draft_actions`
- `workflow_persistence_migrations`

## Backfill plan

Generate a reviewable backfill manifest from the local stores:

```powershell
node tools/build-workflow-backfill-manifest.mjs
```

This updates:

```text
data/agsa/generated/workflow-backfill-manifest.json
```

The manifest records source file hashes, row counts, normalized rows and required API parity checks.

## Migration gates

- Select the hosted database provider and tenant model.
- Apply `db/workflow/001_workflow_persistence.sql`.
- Backfill review decisions and draft actions from `workflow-backfill-manifest.json`.
- Run parity checks for:
  - `/api/v1/agsa/review-decisions`
  - `/api/v1/actions/drafts`
  - `/api/v1/actions/drafts/{id}/transition`
  - `/api/v1/actions/drafts/{id}/evidence`
- Switch the store adapter only after parity passes.

## Guardrail

Do not mark `workflowPersistence.productionReady` as `true` while `activeProvider` is `local_json`.
