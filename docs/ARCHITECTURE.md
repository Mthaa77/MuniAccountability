# Architecture Notes

MuniAccountability Command is implemented as a Next.js App Router prototype with a BFF-style `/v1` API rewrite. The current data layer is static and typed, but shaped to match the future warehouse and workflow services.

## Intended Production Stack

- Next.js + TypeScript strict mode for institutional and public web surfaces.
- BigQuery datasets for raw, staging, core, marts, and ops analytical data.
- Cloud SQL for tenant workflow state: actions, decisions, permissions, comments, and approvals.
- Cloud Storage for raw AGSA reports, source artifacts, evidence, and generated briefings.
- Firebase Auth / Identity Platform for institutional access with RBAC and SSO-ready tenant boundaries.
- Source adapters with health checks, artifact hashes, schema fingerprints, validation events, and fixture tests.

## Data Trust Rules

- No headline value appears without source, period, quality state, and freshness.
- AGSA findings, Treasury submissions, client-entered updates, and platform calculations remain visually distinct.
- Treasury telemetry is marked as pending validation until connector and reuse checks pass.
- Scores are operational prioritisation aids, not legal findings, credit ratings, or corruption labels.
