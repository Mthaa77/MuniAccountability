# Workflow Migration Evidence

## Provider And Tenant Model

- Provider:
- Environment:
- Tenant model:
- Credentials location: configured outside repository
- Secret handling: do not paste credentials, connection strings or tokens into this evidence file

## Migration Execution

- SQL file applied: `db/workflow/001_workflow_persistence.sql`
- Applied by:
- Applied at:
- Migration transaction/result:

## Backfill Evidence

- Backfill manifest: `data/agsa/generated/workflow-backfill-manifest.json`
- Review decision row count:
- Draft action row count:
- Backfill applied at:

## API Parity Smoke

- `GET /api/v1/agsa/review-decisions`:
- `GET /api/v1/actions/drafts`:
- `POST /api/v1/actions/drafts/{id}/transition`:
- `POST /api/v1/actions/drafts/{id}/evidence`:

## Approval

- Reviewer:
- Decision:
- Notes:
