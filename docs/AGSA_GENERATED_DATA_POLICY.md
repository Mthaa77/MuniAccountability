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

## Treasury validation manifest

`data/treasury/validation/municipal-money-validation-manifest.json` is the unlock record for Financial Pulse. Keep `unlockDecision.status` as `locked` until connector access, reuse permission, schema fingerprint, formula versions and freshness SLA are all validated.

## Publication guardrails

- Keep AGSA source citations, document IDs, page numbers and confidence values with every structured claim.
- Do not publish records backed by excluded review decisions.
- Treat correction review decisions as publication blockers until the corrected field is applied or confirmed.
- Keep Treasury/Municipal Money telemetry gated until source-health, reuse, schema, formula and freshness validation passes.
- Platform priority scores are workflow aids, not legal findings.
