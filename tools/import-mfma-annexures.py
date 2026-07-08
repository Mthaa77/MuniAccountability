from __future__ import annotations

import csv
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "agsa" / "generated" / "annexure-import-manifest.json"
REQUIRED_COLUMNS = [
    "municipality_code",
    "municipality_name",
    "financial_year",
    "audit_outcome",
    "movement",
    "source_document",
    "source_page",
]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
      for chunk in iter(lambda: handle.read(1024 * 1024), b""):
          digest.update(chunk)
    return digest.hexdigest()


def read_rows(path: Path) -> list[dict[str, Any]]:
    if path.suffix.lower() == ".csv":
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            return list(csv.DictReader(handle))
    if path.suffix.lower() == ".json":
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, list):
            return [row for row in data if isinstance(row, dict)]
        if isinstance(data, dict) and isinstance(data.get("rows"), list):
            return [row for row in data["rows"] if isinstance(row, dict)]
    raise ValueError("Supported annexure import formats are CSV and JSON. Export XLSX annexures to CSV first.")


def normalize_row(row: dict[str, Any]) -> dict[str, Any]:
    return {key: str(row.get(key, "")).strip() for key in REQUIRED_COLUMNS}


def build_manifest(source_path: Path) -> dict[str, Any]:
    rows = [normalize_row(row) for row in read_rows(source_path)]
    missing_columns = [column for column in REQUIRED_COLUMNS if rows and column not in rows[0]]
    unmatched = [row for row in rows if not row["municipality_code"] or not row["audit_outcome"]]
    matched = [
        {
            "municipalityCode": row["municipality_code"],
            "municipalityName": row["municipality_name"],
            "financialYear": row["financial_year"],
            "auditOutcome": row["audit_outcome"],
            "movement": row["movement"],
            "sourceDocument": row["source_document"],
            "sourcePage": row["source_page"],
        }
        for row in rows
        if row not in unmatched
    ]

    return {
        "schemaVersion": "mfma-annexure-import-v0.1",
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "blocked" if missing_columns or unmatched else "imported",
        "sourceFiles": [
            {
                "path": str(source_path.relative_to(ROOT)) if source_path.is_relative_to(ROOT) else str(source_path),
                "sha256": sha256(source_path),
                "rowCount": len(rows),
            }
        ],
        "expectedInputs": [
            {
                "id": "mfma_2024_25_municipality_outcomes",
                "label": "MFMA 2024-25 municipality-level audit outcome annexure",
                "acceptedFormats": ["csv", "json"],
                "requiredColumns": REQUIRED_COLUMNS,
                "status": "imported" if not missing_columns else "missing",
                "notes": "Imported from operator-provided official AGSA annexure export." if not missing_columns else f"Missing columns: {', '.join(missing_columns)}",
            }
        ],
        "importedRows": len(rows),
        "matchedOutcomes": matched,
        "unmatchedRows": unmatched,
        "operatorNotes": [
            "Review matched outcomes before promoting cohort-derived mappings to exact.",
            "Every promoted mapping must retain source_document and source_page evidence.",
        ],
    }


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python tools/import-mfma-annexures.py <official-annexure.csv|json>", file=sys.stderr)
        return 2

    source_path = Path(sys.argv[1]).resolve()
    if not source_path.exists():
        print(f"Input file not found: {source_path}", file=sys.stderr)
        return 2

    manifest = build_manifest(source_path)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)} with {manifest['importedRows']} imported row(s).")
    return 0 if manifest["status"] == "imported" else 1


if __name__ == "__main__":
    raise SystemExit(main())
