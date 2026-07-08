from __future__ import annotations

import hashlib
import json
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from pypdf import PdfReader
except Exception:  # pragma: no cover - local fallback for older environments
    from PyPDF2 import PdfReader  # type: ignore


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = ROOT / "data" / "agsa" / "generated" / "agsa-report-extract.json"


@dataclass(frozen=True)
class ReportConfig:
    file_name: str
    report_family: str
    report_year: str
    title: str
    scope: str
    priority: str
    initiative_type: str | None = None


REPORTS = [
    ReportConfig("PFMA-GR-2024-25-Interactive.pdf", "PFMA", "2024-25", "Consolidated General Report on National and Provincial Audit Outcomes 2024-25", "national_provincial", "P0"),
    ReportConfig("mfma-2024-25-overall-audit-outcomes-tabling-24-june-2026.pdf", "MFMA", "2024-25", "Local Government Audit Outcomes 2024-25 Tabling Summary", "local_government", "P0"),
    ReportConfig("pfma_report_2023_24_final.pdf", "PFMA", "2023-24", "Consolidated General Report on National and Provincial Audit Outcomes 2023-24", "national_provincial", "P1"),
    ReportConfig("mfma_report_2023_24.pdf", "MFMA", "2023-24", "Consolidated General Report on Local Government Audit Outcomes 2023-24", "local_government", "P1"),
    ReportConfig("6939239458f49212156195.pdf", "special", "2023-24", "Source to Supply: A Shared Responsibility for a Water-Resilient Future", "water_value_chain", "P2", "water"),
    ReportConfig("690b2e8ba7b7d432807575.pdf", "special", "2022", "First Special Report on Flood Relief Funding", "flood_relief", "P2", "disaster_relief"),
    ReportConfig("68f63da297768385697917.pdf", "special", "2022", "Status of Material Irregularities in National, Provincial and Local Government", "material_irregularities", "P2", "material_irregularity"),
    ReportConfig("690b302d8e3d1351247251.pdf", "PFMA", "2022-23", "Consolidated General Report on National and Provincial Audit Outcomes 2022-23", "national_provincial", "P3"),
    ReportConfig("22253B-2021-22-PFMA-General-Report-interactive-V3.pdf", "PFMA", "2021-22", "Consolidated General Report on National and Provincial Audit Outcomes 2021-22", "national_provincial", "P3"),
    ReportConfig("mfma_report_2022_23_final.pdf", "MFMA", "2022-23", "Consolidated General Report on Local Government Audit Outcomes 2022-23", "local_government", "P3"),
    ReportConfig("mfma_report_2021_22_final_31_may_2023.pdf", "MFMA", "2021-22", "Consolidated General Report on Local Government Audit Outcomes 2021-22", "local_government", "P3"),
    ReportConfig("Consolidated-PFMA-General-Report-2020-21-FINAL-interactive-8-December.pdf", "PFMA", "2020-21", "Consolidated General Report on National and Provincial Audit Outcomes 2020-21", "national_provincial", "P4"),
    ReportConfig("agsa-mfma-general-report-2021.pdf", "MFMA", "2020-21", "Consolidated General Report on Local Government Audit Outcomes 2020-21", "local_government", "P4"),
    ReportConfig("Citizens-Report-PFMA-2020-21-V7b.pdf", "citizens", "2020-21", "Citizen's Report on National and Provincial Audit Outcomes 2020-21", "public_summary", "P4"),
]


AUDITEES = [
    {"auditeeId": "ZA_GP_EKU", "canonicalName": "City of Ekurhuleni Metropolitan Municipality", "commonName": "Ekurhuleni", "sphere": "local", "province": "Gauteng", "category": "metro", "sector": "local_government", "highImpact": True, "canonicalCode": "EKU"},
    {"auditeeId": "ZA_GP_JHB", "canonicalName": "City of Johannesburg Metropolitan Municipality", "commonName": "Johannesburg", "sphere": "local", "province": "Gauteng", "category": "metro", "sector": "local_government", "highImpact": True, "canonicalCode": "JHB"},
    {"auditeeId": "ZA_GP_TSH", "canonicalName": "City of Tshwane Metropolitan Municipality", "commonName": "Tshwane", "sphere": "local", "province": "Gauteng", "category": "metro", "sector": "local_government", "highImpact": True, "canonicalCode": "TSH"},
    {"auditeeId": "ZA_GP_MER", "canonicalName": "Merafong City Local Municipality", "commonName": "Merafong City", "sphere": "local", "province": "Gauteng", "category": "local", "sector": "local_government", "highImpact": False, "canonicalCode": "GT484"},
    {"auditeeId": "ZA_WC_CPT", "canonicalName": "City of Cape Town Metropolitan Municipality", "commonName": "Cape Town", "sphere": "local", "province": "Western Cape", "category": "metro", "sector": "local_government", "highImpact": True, "canonicalCode": "CPT"},
    {"auditeeId": "LOCAL_GOVERNMENT", "canonicalName": "South African Local Government", "commonName": "Local government", "sphere": "local", "province": None, "category": "aggregate", "sector": "local_government", "highImpact": True, "canonicalCode": None},
    {"auditeeId": "NATIONAL_PROVINCIAL", "canonicalName": "South African National and Provincial Government", "commonName": "National and provincial government", "sphere": "national_provincial", "province": None, "category": "aggregate", "sector": "public_sector", "highImpact": True, "canonicalCode": None},
    {"auditeeId": "WATER_VALUE_CHAIN", "canonicalName": "Water Value Chain", "commonName": "Water value chain", "sphere": "multi_sphere", "province": None, "category": "initiative", "sector": "water", "highImpact": True, "canonicalCode": None},
    {"auditeeId": "FLOOD_RELIEF", "canonicalName": "Flood Relief Funding Response", "commonName": "Flood relief", "sphere": "multi_sphere", "province": None, "category": "initiative", "sector": "disaster_relief", "highImpact": True, "canonicalCode": None},
]


AUDIT_OUTCOMES = [
    {"auditeeId": "ZA_WC_CPT", "financialYear": "2020-21", "opinion": "clean", "movement": "baseline", "budgetAmount": None, "cleanAuditFlag": True, "correctedMisstatements": False, "notes": "City of Cape Town appears as a sustained clean-audit metro in MFMA reporting.", "citationId": "cit_mfma_2022_23_p18"},
    {"auditeeId": "ZA_WC_CPT", "financialYear": "2024-25", "opinion": "clean", "movement": "stable", "budgetAmount": None, "cleanAuditFlag": True, "correctedMisstatements": False, "notes": "Latest metro cohort shows City of Cape Town as the clean-audit metro comparator.", "citationId": "cit_mfma_2024_25_p6"},
    {"auditeeId": "ZA_GP_EKU", "financialYear": "2022-23", "opinion": "unqualified_with_findings", "movement": "regressed", "budgetAmount": None, "cleanAuditFlag": False, "correctedMisstatements": True, "notes": "Ekurhuleni regressed from clean audit due to procurement and contract-management controls.", "citationId": "cit_mfma_2022_23_p18"},
    {"auditeeId": "ZA_GP_EKU", "financialYear": "2024-25", "opinion": "metro_cohort_under_review", "movement": "watch", "budgetAmount": None, "cleanAuditFlag": False, "correctedMisstatements": None, "notes": "Kept in the critical lane until municipality-specific 2024-25 annexure validation is loaded.", "citationId": "cit_mfma_2024_25_p6"},
    {"auditeeId": "ZA_GP_JHB", "financialYear": "2022-23", "opinion": "unqualified_with_findings", "movement": "stable", "budgetAmount": None, "cleanAuditFlag": False, "correctedMisstatements": True, "notes": "Johannesburg retained an unqualified audit opinion with findings in the 2022-23 metro discussion.", "citationId": "cit_mfma_2022_23_p18"},
    {"auditeeId": "ZA_GP_JHB", "financialYear": "2024-25", "opinion": "metro_cohort_under_review", "movement": "watch", "budgetAmount": None, "cleanAuditFlag": False, "correctedMisstatements": None, "notes": "Latest metro cohort has no clean audits and requires annexure-level validation for exact city outcome.", "citationId": "cit_mfma_2024_25_p6"},
    {"auditeeId": "ZA_GP_TSH", "financialYear": "2022-23", "opinion": "qualified_with_findings", "movement": "improved", "budgetAmount": None, "cleanAuditFlag": False, "correctedMisstatements": True, "notes": "Tshwane improved from adverse to qualified by implementing prior-year recommendations.", "citationId": "cit_mfma_2022_23_p18"},
    {"auditeeId": "ZA_GP_TSH", "financialYear": "2024-25", "opinion": "metro_cohort_under_review", "movement": "watch", "budgetAmount": None, "cleanAuditFlag": False, "correctedMisstatements": None, "notes": "Latest metro cohort has no clean audits and stays in high-priority monitoring.", "citationId": "cit_mfma_2024_25_p6"},
    {"auditeeId": "ZA_GP_MER", "financialYear": "2024-25", "opinion": "qualified_with_findings", "movement": "watch", "budgetAmount": None, "cleanAuditFlag": False, "correctedMisstatements": None, "notes": "Pilot local-municipality support case; municipality-specific annexure validation remains required.", "citationId": "cit_mfma_2024_25_p5"},
]


FINDINGS = [
    {"findingId": "finding_mfma_2024_25_unqualified_findings", "auditeeId": "LOCAL_GOVERNMENT", "financialYear": "2024-25", "findingFamily": "audit", "subtheme": "Unqualified with findings complacency", "severity": "high", "description": "117 municipalities were in the unqualified-with-findings category, managing 50% of the budget.", "impact": "This category can mask weak performance reporting, non-compliance and poor financial health.", "valueAtRisk": 311280000000, "repeatFlag": True, "citationId": "cit_mfma_2024_25_p7"},
    {"findingId": "finding_mfma_2024_25_compliance", "auditeeId": "LOCAL_GOVERNMENT", "financialYear": "2024-25", "findingFamily": "compliance", "subtheme": "Material non-compliance", "severity": "critical", "description": "215 municipalities, 84% of the total, had material findings on compliance with key legislation.", "impact": "High compliance failure weakens accountability and increases risk of irregular expenditure.", "valueAtRisk": None, "repeatFlag": True, "citationId": "cit_mfma_2024_25_p11"},
    {"findingId": "finding_mfma_2024_25_irregular_expenditure", "auditeeId": "LOCAL_GOVERNMENT", "financialYear": "2024-25", "findingFamily": "procurement", "subtheme": "Irregular expenditure", "severity": "critical", "description": "Irregular expenditure across local government reached R145.21bn over four years.", "impact": "Procurement and contract-management failures remain a primary operational risk.", "valueAtRisk": 145210000000, "repeatFlag": True, "citationId": "cit_mfma_2024_25_p12"},
    {"findingId": "finding_mfma_2024_25_infrastructure", "auditeeId": "LOCAL_GOVERNMENT", "financialYear": "2024-25", "findingFamily": "infrastructure", "subtheme": "Infrastructure project failures", "severity": "high", "description": "101 of 130 audited infrastructure projects had findings, including delays, cost issues and poor-quality work.", "impact": "Infrastructure failure directly affects basic services and capital delivery.", "valueAtRisk": None, "repeatFlag": True, "citationId": "cit_mfma_2024_25_p13"},
    {"findingId": "finding_mfma_2024_25_financial_health", "auditeeId": "LOCAL_GOVERNMENT", "financialYear": "2024-25", "findingFamily": "financial", "subtheme": "Financial health pressure", "severity": "critical", "description": "62 municipalities disclosed going-concern uncertainties and 174 had short-term debts greater than available cash.", "impact": "Financial distress limits basic service delivery and raises creditor pressure.", "valueAtRisk": None, "repeatFlag": True, "citationId": "cit_mfma_2024_25_p14"},
    {"findingId": "finding_pfma_2024_25_high_impact", "auditeeId": "NATIONAL_PROVINCIAL", "financialYear": "2024-25", "findingFamily": "audit", "subtheme": "High-impact auditee underperformance", "severity": "critical", "description": "High-impact auditees were responsible for approximately R2tn, 91% of the national and provincial expenditure budget, and continued to underperform.", "impact": "Weaknesses at high-impact auditees directly affect service delivery and fiscal sustainability.", "valueAtRisk": 2000000000000, "repeatFlag": True, "citationId": "cit_pfma_2024_25_p9"},
    {"findingId": "finding_water_value_chain_maintenance", "auditeeId": "WATER_VALUE_CHAIN", "financialYear": "2023-24", "findingFamily": "water", "subtheme": "Water infrastructure maintenance", "severity": "critical", "description": "130 water service authorities, 96%, spent less than the recommended 8% repairs-and-maintenance norm.", "impact": "Maintenance neglect contributes to water disruptions, unsafe effluent, water losses and extended tanker dependence.", "valueAtRisk": 14890000000, "repeatFlag": True, "citationId": "cit_water_p10"},
    {"findingId": "finding_flood_relief_slow_response", "auditeeId": "FLOOD_RELIEF", "financialYear": "2022", "findingFamily": "disaster_relief", "subtheme": "Slow disaster response", "severity": "high", "description": "Flood-relief delivery was too slow, with temporary residential units, mobile units and water tankering not completed by the reporting date.", "impact": "Affected residents and businesses continued to experience hardship months after the floods.", "valueAtRisk": None, "repeatFlag": False, "citationId": "cit_flood_p7"},
]


MATERIAL_IRREGULARITIES = [
    {"miId": "mi_mfma_2024_25_total", "auditeeId": "LOCAL_GOVERNMENT", "notifiedDate": None, "category": "financial_loss", "description": "516 material irregularities were identified in local government, including material financial loss and harm to the public.", "estimatedLoss": 10230000000, "status": "mixed", "recoveredAmount": 710000000, "preventedAmount": 250000000, "referralBody": None, "citationId": "cit_mfma_2024_25_p15"},
    {"miId": "mi_water_pollution", "auditeeId": "WATER_VALUE_CHAIN", "notifiedDate": None, "category": "public_harm", "description": "56 material irregularity notifications were issued at 31 municipalities and two municipal entities relating to pollution of water resources.", "estimatedLoss": None, "status": "active", "recoveredAmount": None, "preventedAmount": None, "referralBody": None, "citationId": "cit_water_p10"},
    {"miId": "mi_status_2022_total", "auditeeId": "NATIONAL_PROVINCIAL", "notifiedDate": "2022-04-15", "category": "financial_loss", "description": "The AGSA was dealing with 327 material irregularities across spheres of government at 15 April 2022.", "estimatedLoss": 14700000000, "status": "mixed", "recoveredAmount": None, "preventedAmount": None, "referralBody": None, "citationId": "cit_mi_status_p5"},
]


INITIATIVES = [
    {"initiativeId": "initiative_water_value_chain", "reportId": "doc_6939239458f49212156195", "initiativeType": "water", "name": "Water value chain", "location": "South Africa", "budget": None, "progressStatus": "under_review", "delayMonths": 32, "qualityIssues": ["delayed projects", "maintenance underspend", "water losses", "pollution-related MIs"], "beneficiaries": None, "responsibleEntities": ["Department of Water and Sanitation", "Water Trading Entity", "water boards", "water service authorities"]},
    {"initiativeId": "initiative_flood_relief", "reportId": "doc_690b2e8ba7b7d432807575", "initiativeType": "disaster_relief", "name": "Flood relief funding response", "location": "KwaZulu-Natal and Eastern Cape", "budget": None, "progressStatus": "delayed", "delayMonths": None, "qualityIssues": ["slow response", "weak coordination", "project-management failures", "procurement red flags"], "beneficiaries": None, "responsibleEntities": ["national government", "provincial departments", "municipalities"]},
    {"initiativeId": "initiative_material_irregularities", "reportId": "doc_68f63da297768385697917", "initiativeType": "material_irregularity", "name": "Material irregularity lifecycle tracking", "location": "South Africa", "budget": None, "progressStatus": "under_review", "delayMonths": None, "qualityIssues": ["slow resolution", "recommendations", "remedial action", "referrals"], "beneficiaries": None, "responsibleEntities": ["accounting officers", "accounting authorities", "oversight bodies"]},
]


RECOMMENDATIONS = [
    {"recommendationId": "rec_mfma_2024_25_governance", "reportId": "doc_mfma_2024_25_overall_audit_outcomes_tabling_24_june_2026", "auditeeId": "LOCAL_GOVERNMENT", "ownerRole": "Mayors, councils, provincial government and legislatures", "action": "Build capable institutions, professionalise local government, and instil ethics and accountability.", "deadline": None, "priority": "p0", "citationId": "cit_mfma_2024_25_p16"},
    {"recommendationId": "rec_water_coordination", "reportId": "doc_6939239458f49212156195", "auditeeId": "WATER_VALUE_CHAIN", "ownerRole": "Water accountability ecosystem", "action": "Improve coordination, planning, budgeting and implementation across the water value chain.", "deadline": None, "priority": "p1", "citationId": "cit_water_p11"},
    {"recommendationId": "rec_flood_preventative_controls", "reportId": "doc_690b2e8ba7b7d432807575", "auditeeId": "FLOOD_RELIEF", "ownerRole": "National, provincial and municipal leadership", "action": "Strengthen disaster management capability and embed preventative controls in future disaster relief spending.", "deadline": None, "priority": "p1", "citationId": "cit_flood_p7"},
]


KEYWORD_PATTERN = re.compile(
    r"clean audit|unqualified with findings|qualified|adverse|disclaimed|material irregularit|irregular expenditure|infrastructure|water|flood|financial health|consequence management|performance report",
    re.IGNORECASE,
)

SAMPLE_PAGES_BY_FILE = {
    "PFMA-GR-2024-25-Interactive.pdf": [1, 2, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    "mfma-2024-25-overall-audit-outcomes-tabling-24-june-2026.pdf": list(range(1, 17)),
    "pfma_report_2023_24_final.pdf": list(range(1, 14)),
    "mfma_report_2023_24.pdf": list(range(1, 15)),
    "6939239458f49212156195.pdf": list(range(1, 14)),
    "690b2e8ba7b7d432807575.pdf": list(range(1, 14)),
    "68f63da297768385697917.pdf": list(range(1, 13)),
    "mfma_report_2022_23_final.pdf": list(range(1, 23)),
}

DEFAULT_SAMPLE_PAGES = list(range(1, 13))

MANUAL_CITATIONS = [
    {"citationId": "cit_mfma_2024_25_p5", "fileName": "mfma-2024-25-overall-audit-outcomes-tabling-24-june-2026.pdf", "pageNumber": 5, "sectionTitle": "Audit outcomes per province"},
    {"citationId": "cit_mfma_2024_25_p6", "fileName": "mfma-2024-25-overall-audit-outcomes-tabling-24-june-2026.pdf", "pageNumber": 6, "sectionTitle": "Audit outcomes of metros"},
    {"citationId": "cit_mfma_2024_25_p7", "fileName": "mfma-2024-25-overall-audit-outcomes-tabling-24-june-2026.pdf", "pageNumber": 7, "sectionTitle": "Complacency evident from stagnation"},
    {"citationId": "cit_mfma_2024_25_p11", "fileName": "mfma-2024-25-overall-audit-outcomes-tabling-24-june-2026.pdf", "pageNumber": 11, "sectionTitle": "Material findings on compliance with key legislation"},
    {"citationId": "cit_mfma_2024_25_p12", "fileName": "mfma-2024-25-overall-audit-outcomes-tabling-24-june-2026.pdf", "pageNumber": 12, "sectionTitle": "High levels of irregular expenditure"},
    {"citationId": "cit_mfma_2024_25_p13", "fileName": "mfma-2024-25-overall-audit-outcomes-tabling-24-june-2026.pdf", "pageNumber": 13, "sectionTitle": "Infrastructure project failures and impact"},
    {"citationId": "cit_mfma_2024_25_p14", "fileName": "mfma-2024-25-overall-audit-outcomes-tabling-24-june-2026.pdf", "pageNumber": 14, "sectionTitle": "Local government financial health"},
    {"citationId": "cit_mfma_2024_25_p15", "fileName": "mfma-2024-25-overall-audit-outcomes-tabling-24-june-2026.pdf", "pageNumber": 15, "sectionTitle": "Material irregularities nature, status and impact"},
    {"citationId": "cit_mfma_2024_25_p16", "fileName": "mfma-2024-25-overall-audit-outcomes-tabling-24-june-2026.pdf", "pageNumber": 16, "sectionTitle": "Call to action"},
    {"citationId": "cit_mfma_2022_23_p18", "fileName": "mfma_report_2022_23_final.pdf", "pageNumber": 18, "sectionTitle": "Metro audit outcomes"},
    {"citationId": "cit_pfma_2024_25_p9", "fileName": "PFMA-GR-2024-25-Interactive.pdf", "pageNumber": 9, "sectionTitle": "Audit outcomes and high-impact auditees"},
    {"citationId": "cit_water_p10", "fileName": "6939239458f49212156195.pdf", "pageNumber": 10, "sectionTitle": "Water infrastructure maintenance"},
    {"citationId": "cit_water_p11", "fileName": "6939239458f49212156195.pdf", "pageNumber": 11, "sectionTitle": "Water value chain call to action"},
    {"citationId": "cit_flood_p7", "fileName": "690b2e8ba7b7d432807575.pdf", "pageNumber": 7, "sectionTitle": "Flood relief key messages"},
    {"citationId": "cit_mi_status_p5", "fileName": "68f63da297768385697917.pdf", "pageNumber": 5, "sectionTitle": "Overall material irregularity status"},
]


def normalize_id(file_name: str) -> str:
    return "doc_" + re.sub(r"[^a-z0-9]+", "_", Path(file_name).stem.lower()).strip("_")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def clean_text(text: str) -> str:
    return " ".join(text.replace("\x00", " ").split())


def section_guess(text: str) -> str | None:
    if not text:
        return None
    words = text.split()
    return " ".join(words[: min(9, len(words))])


def extract_pages(reader: PdfReader, file_name: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    pages: list[dict[str, Any]] = []
    issues: list[dict[str, Any]] = []
    page_numbers = SAMPLE_PAGES_BY_FILE.get(file_name, DEFAULT_SAMPLE_PAGES)
    for page_number in page_numbers:
        if page_number < 1 or page_number > len(reader.pages):
            continue
        page = reader.pages[page_number - 1]
        try:
            text = clean_text(page.extract_text() or "")
        except Exception as exc:  # pragma: no cover - depends on PDF internals
            text = ""
            issues.append({"pageNumber": page_number, "issue": f"text extraction failed: {exc}"})

        matched = bool(KEYWORD_PATTERN.search(text))
        low_confidence = len(text) < 80
        pages.append(
            {
                "pageNumber": page_number,
                "sectionTitle": section_guess(text),
                "textSample": text[:1200],
                "keywordHit": matched,
                "extractionConfidence": "low" if low_confidence else "high",
            }
        )
        if low_confidence:
            issues.append({"pageNumber": page_number, "issue": "low text extraction confidence"})
    return pages, issues


def build_document(config: ReportConfig) -> tuple[dict[str, Any], list[dict[str, Any]], list[dict[str, Any]]]:
    path = DOCS / config.file_name
    if not path.exists():
        raise FileNotFoundError(path)
    reader = PdfReader(str(path))
    meta = reader.metadata or {}
    pages, issues = extract_pages(reader, config.file_name)
    doc_id = normalize_id(config.file_name)
    document = {
        "documentId": doc_id,
        "reportFamily": config.report_family,
        "reportYear": config.report_year,
        "tabledDate": None,
        "title": config.title,
        "issuer": "Auditor-General of South Africa",
        "fileName": config.file_name,
        "filePath": f"docs/{config.file_name}",
        "pageCount": len(reader.pages),
        "scope": config.scope,
        "theme": config.initiative_type or config.scope,
        "priority": config.priority,
        "qualityState": "source_published",
        "sha256": sha256(path),
        "pdfTitle": str(meta.get("/Title") or ""),
    }
    generated_citations = [
        {
            "citationId": f"cit_{doc_id.removeprefix('doc_')}_p{page['pageNumber']}",
            "documentId": doc_id,
            "pageNumber": page["pageNumber"],
            "sectionTitle": page["sectionTitle"],
            "quoteSnippet": page["textSample"][:280],
            "extractionConfidence": page["extractionConfidence"],
        }
        for page in pages
        if page["keywordHit"] or page["pageNumber"] <= 16
    ]
    manual_citations = []
    for citation in MANUAL_CITATIONS:
        if citation["fileName"] != config.file_name:
            continue
        page = next((candidate for candidate in pages if candidate["pageNumber"] == citation["pageNumber"]), None)
        manual_citations.append(
            {
                "citationId": citation["citationId"],
                "documentId": doc_id,
                "pageNumber": citation["pageNumber"],
                "sectionTitle": citation["sectionTitle"],
                "quoteSnippet": (page["textSample"][:280] if page else ""),
                "extractionConfidence": page["extractionConfidence"] if page else "needs_review",
            }
        )
    return document, pages, [{"documentId": doc_id, **issue} for issue in issues] + generated_citations + manual_citations


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    documents: list[dict[str, Any]] = []
    pages_by_document: dict[str, list[dict[str, Any]]] = {}
    extraction_items: list[dict[str, Any]] = []

    for config in REPORTS:
        document, pages, items = build_document(config)
        documents.append(document)
        pages_by_document[document["documentId"]] = pages
        extraction_items.extend(items)

    page_citations = [item for item in extraction_items if "citationId" in item]
    extraction_issues = [item for item in extraction_items if "issue" in item]

    artifact = {
        "schemaVersion": "agsa-extract-v0.1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceRoot": "docs",
        "documents": documents,
        "pagesByDocument": pages_by_document,
        "pageCitations": page_citations,
        "auditees": AUDITEES,
        "auditOutcomes": AUDIT_OUTCOMES,
        "findings": FINDINGS,
        "materialIrregularities": MATERIAL_IRREGULARITIES,
        "initiatives": INITIATIVES,
        "recommendations": RECOMMENDATIONS,
        "extractionIssues": extraction_issues,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(artifact, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)} with {len(documents)} documents and {len(page_citations)} citations")


if __name__ == "__main__":
    main()
