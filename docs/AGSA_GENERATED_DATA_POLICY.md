# AGSA generated data policy

This repository intentionally keeps the first AGSA integration local and reviewable. The canonical generated artifacts are committed only while they remain compact enough for code review and useful for deterministic product tests.

## Committed artifacts

- `data/agsa/generated/agsa-report-extract.json`
- `data/agsa/generated/agsa-review-decisions.json`
- `data/agsa/generated/draft-actions.json`
- `data/agsa/generated/annexure-import-manifest.json`
- `data/treasury/validation/municipal-money-validation-manifest.json`

The current extract is a compact structured projection of the PDFs in `docs/`. It includes document metadata, page citations, mapped auditees, audit outcomes, findings, material irregularities, initiatives, recommendations and extraction issues.

## Local-only artifacts

Do not commit raw page dumps, experimental extracts, temporary review output, or large intermediate files. The `.gitignore` excludes:

- `data/agsa/generated/*.local.json`
- `data/agsa/generated/*.tmp.json`
- `data/agsa/generated/*.ndjson`
- `data/agsa/generated/pages/`
- `data/agsa/generated/raw/`

If a future generated artifact becomes too large for normal review, keep it local, document the regeneration command, and commit only a small fixture or manifest required by tests.

## Regeneration

Run the AGSA extraction pipeline from the repository root:

```powershell
python tools/extract-agsa-reports.py
```

After regenerating data, run:

```powershell
npm run verify
```

## MFMA annexure imports

Exact municipality-level audit outcomes must come from an official AGSA annexure export. Export the official workbook/table to CSV or JSON with these columns:

```text
municipality_code, municipality_name, financial_year, audit_outcome, movement, source_document, source_page
```

Then run:

```powershell
python tools/import-mfma-annexures.py path\to\official-mfma-annexure.csv
```

The command updates `data/agsa/generated/annexure-import-manifest.json`. Review the manifest before promoting any cohort-derived or manual mapping to `exact`.

For a safe preflight that does not mutate committed data:

```powershell
python tools/import-mfma-annexures.py path\to\official-mfma-annexure.csv --dry-run
```

To write a review artifact somewhere else first:

```powershell
python tools/import-mfma-annexures.py path\to\official-mfma-annexure.csv --out data\agsa\generated\annexure-import-manifest.local.json
```

## Treasury validation manifest

`data/treasury/validation/municipal-money-validation-manifest.json` is the unlock record for Financial Pulse. Keep `unlockDecision.status` as `locked` until connector access, reuse permission, schema fingerprint, formula versions and freshness SLA are all validated.

Candidate Financial Pulse formulas live in:

```text
data/treasury/validation/financial-pulse-formulas.json
```

These formulas are not publishable while their status is `draft` or their `displayGate` is `blocked_until_validated`. A formula can only contribute to Financial Pulse unlock after the Treasury manifest records the matching validated formula version and the schema fingerprint validates every required field.

To build a review artifact without mutating the committed locked manifest:

```powershell
node tools/build-treasury-validation-manifest.mjs --schema-snapshot path\to\schema.json --connector-status validated --dry-run
```

To write a local review artifact:

```powershell
node tools/build-treasury-validation-manifest.mjs --schema-snapshot path\to\schema.json --out data\treasury\validation\municipal-money-validation-manifest.local.json
```

Only write back to `municipal-money-validation-manifest.json` after connector, reuse, schema, formula and freshness evidence has been reviewed.

## Production readiness preflight

Before promoting any source or workflow gate, run the consolidated read-only preflight:

```powershell
node tools/run-production-readiness-preflight.mjs
```

To create a local evidence artifact without committing it:

```powershell
node tools/run-production-readiness-preflight.mjs --out data\agsa\generated\production-readiness-preflight.local.json
```

The committed baseline should continue to report `productionReady: false` until the official MFMA annexure, Treasury validation evidence and hosted workflow database migration evidence are all present.

## Publication guardrails

- Keep AGSA source citations, document IDs, page numbers and confidence values with every structured claim.
- Do not publish records backed by excluded review decisions.
- Treat correction review decisions as publication blockers until the corrected field is applied or confirmed.
- Keep Treasury/Municipal Money telemetry gated until source-health, reuse, schema, formula and freshness validation passes.
- Platform priority scores are workflow aids, not legal findings.
