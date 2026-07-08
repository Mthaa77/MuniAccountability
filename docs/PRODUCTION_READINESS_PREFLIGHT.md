# Production readiness preflight

The AGSA platform now has one read-only preflight command for the remaining production gates. It does not unlock anything by itself; it consolidates evidence so operators can see whether the product is ready to move beyond the AGSA-backed prototype state.

## Run the preflight

```powershell
node tools/run-production-readiness-preflight.mjs
```

To write a review artifact:

```powershell
node tools/run-production-readiness-preflight.mjs --out data\agsa\generated\production-readiness-preflight.local.json
```

The `.local.json` suffix keeps local evidence out of committed generated data unless the team intentionally promotes a compact artifact.

## Current baseline

The committed baseline should report `productionReady: false`.

That is expected. The platform has working AGSA-backed product flows, but these production gates still require external evidence:

- official machine-readable AGSA MFMA municipality-level annexure CSV or JSON;
- validated Treasury / Municipal Money connector, reuse permission, schema fingerprint, formula versions and freshness evidence;
- hosted workflow database provider, applied migration, backfill and API parity smoke evidence.

## Gate meanings

### MFMA annexure mapping

This gate confirms whether exact municipality-level audit outcomes have been imported from the official AGSA MFMA annexure.

It reads:

- `data/agsa/generated/annexure-import-manifest.json`
- `tools/import-mfma-annexures.py`
- `lib/annexure-overlays.ts`

Do not treat cohort-derived or manually mapped outcomes as exact until this gate passes.

### Treasury Financial Pulse unlock

This gate confirms whether Treasury / Municipal Money can power Financial Pulse.

It reads:

- `data/treasury/validation/municipal-money-validation-manifest.json`
- `data/treasury/validation/financial-pulse-formulas.json`
- `tools/build-treasury-validation-manifest.mjs`
- `lib/treasury-validation.ts`

Financial Pulse remains gated until every connector, reuse, schema, formula and freshness check passes.

### Durable workflow store

This gate confirms whether workflow writes can move from local JSON to a production database.

It reads:

- `db/workflow/001_workflow_persistence.sql`
- `tools/build-workflow-backfill-manifest.mjs`
- `data/agsa/generated/workflow-backfill-manifest.json`
- `lib/workflow-persistence.ts`

Do not switch the workflow adapter while `local_json` is still the active provider.

## Verification

Run the focused verifier:

```powershell
npm run test:production-readiness
```

The full verification chain also includes it:

```powershell
npm run verify
```
