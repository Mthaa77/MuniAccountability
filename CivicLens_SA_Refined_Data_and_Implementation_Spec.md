# CivicLens SA — Refined Data, Product and Implementation Specification
## Codex build handoff • Version 1.0 • Research verification date: 2 July 2026

> **Build objective:** Create a trustworthy, source-linked South African civic intelligence platform that helps users explore municipal financial health, procurement activity, governance, service-delivery context, geography and election data.
>
> **Non-negotiable:** CivicLens must never present an unsupported claim, an invented statistic, or an unexplained score. Every visible number, chart, flag and summary must trace back to a source, period, geographic unit and quality state.

---

## 1. Executive directive for Codex

Read this full specification before writing code. Build CivicLens SA as a production-minded MVP, not as a static dashboard mock-up.

Use:
- **Next.js + TypeScript** for the web application and API/BFF layer.
- **Firebase Authentication** for user authentication.
- **Firestore** for users, saved views, watchlists, alert preferences and light application metadata.
- **BigQuery** as the analytics warehouse.
- **Cloud Storage** as the immutable raw-document and source-artifact archive.
- **Cloud Run Jobs** for scheduled ingestion and transformations.
- **Cloud Scheduler** to trigger jobs.
- **Secret Manager** for credentials and source secrets.
- **Terraform** for infrastructure-as-code.
- **Dataform or BigQuery SQL** for reproducible warehouse transformations.
- **MapLibre GL** for interactive maps; do not make the MVP dependent on a paid map provider.
- **Tailwind CSS + shadcn/ui** or an equivalent accessible component system.

The product must launch with a narrow, reliable data scope. Build the architecture to support all modules, but fully implement only the verified MVP sources first.

### Do not do these things

1. Do not hardcode fake tenders, supplier records, audit outcomes or municipal financial data in production views.
2. Do not claim that an official portal has a public API unless the connector has independently passed a source health check.
3. Do not scrape a portal if its terms, technical controls or access policy prohibit it.
4. Do not expose personal information, supplier-sensitive information, credentials, user IDs or personally identifiable beneficiary data.
5. Do not call a CivicLens score an official government score, credit rating, audit result, fraud finding or legal conclusion.
6. Do not compare two geographies unless their boundary and reporting periods are compatible.
7. Do not display an LLM-generated summary without links to its source records and a visible **AI-assisted summary** label.
8. Do not overbuild an agent, vector database, graph database, streaming system or data mesh in the MVP.

---

## 2. What CivicLens SA is

CivicLens SA is a public-interest, data-provenance-first platform for understanding how South African municipalities are financed, governed, planned and experienced.

The platform must answer questions such as:

- Which municipalities show worsening creditor, debtor, cash-flow or audit signals?
- Which tenders are newly advertised, closing soon, cancelled or awarded?
- How does a municipality’s spending, grants, audit record and service-delivery context compare with peers?
- What were the stated priorities in an IDP or SDBIP, and what evidence is available in financial or performance reports?
- Which wards have different election results, demographic context, infrastructure exposure or public-service risks?
- Which datasets are fresh, verified, incomplete, out of date or restricted?

### Primary product modules

| Module | User value | MVP status |
|---|---|---|
| **MunicipalLens** | Financial health, budget, revenue, expenditure, debtors, creditors, grants, capital and audit context | Build in MVP |
| **TenderLens** | Discover tender notices, closing dates, procurement plans, awards and structured source links | Build in MVP with official-download/manual adapter fallback |
| **GovernanceLens** | Audit outcomes, governance indicators, source documents and risk explanations | Build in MVP |
| **GeoLens** | Municipality, ward, province and boundary-aware map context | Build in MVP |
| **ElectionLens** | Historical election turnout, votes, support and ward/municipal comparisons | Build in MVP after geography layer |
| **DocumentLens** | Searchable municipal IDPs, budgets, SDBIPs, annual reports, council records and source evidence | Controlled MVP feature |
| **ServiceLens** | Water, sanitation, education, health, safety and social-support indicators | Phase 2 |
| **ClimateLens** | Municipal climate risk and resilience context | Phase 2 |
| **PolicyLens** | Gazette, legislation, policy and budget-change tracker | Phase 3 |

---

## 3. The corrected data-source position

The original CivicLens reference identified the correct broad pillars: procurement, municipal finance, demographics, spatial/electoral information, service delivery, safety and audit outcomes. The source list must now be treated as a **governed registry**, not just a collection of links.

### 3.1 Corrections that must be implemented

| Original assumption | Correct implementation rule |
|---|---|
| `ocds-api.etenders.gov.za` is a confirmed production dependency | Treat it as **unverified** until an integration test confirms current access, documentation, schema and terms. Use the official eTenders portal and official downloads/manual imports as the MVP fallback. |
| CSD can be treated as a public supplier database | CSD is official, but detailed supplier data and verification workflows are not a public bulk-data source by default. Use only explicitly public outputs, such as published restricted-supplier/tender-defaulter reports, and seek permission for deeper integration. |
| All “ward-level” demographic data can be used directly | Census small-area data, wards and municipal boundaries can differ by geography version. Store the source geography and map only through a documented crosswalk. |
| IEC API is ready for MVP | Use official downloadable result reports and dashboards first. Add an API connector only after official registration, credentials and documentation are verified. |
| DWS Blue/Green Drop data is real-time operational telemetry | Treat it as periodically published compliance/performance reporting unless a validated machine-readable feed proves otherwise. |
| DBE EMIS includes a reliable school-infrastructure condition feed | Use it first for masterlists, identifiers, locations and public metadata. Add condition/infrastructure indicators only when a current, documented dataset is acquired. |
| SASSA data is a straightforward municipal/ward feed | Do not include it in MVP. Use only aggregated, non-personal, officially published statistics after grain, terms and frequency are verified. |
| Health Systems Trust data is guaranteed facility-level telemetry | Treat it as a candidate benchmarking source. Confirm current downloadable datasets, granularity, permissions and update cadence before implementation. |
| A dashboard alone is enough evidence | Every dashboard value must retain raw source artifact, extraction timestamp, report period, method and source link. |

### 3.2 Source verification classes

| Class | Meaning | Product treatment |
|---|---|---|
| **A — Verified machine-readable** | Official source with currently reachable structured endpoint or documented CSV/JSON export | Automate ingestion |
| **B — Verified public document/download** | Official source is public, but ingestion is report/download/document based | Schedule controlled import and archive artifacts |
| **C — Official but access/reuse constrained** | Official source exists but requires registration, agreement, permissions or a controlled portal workflow | Do not automate beyond permitted public outputs |
| **D — Candidate source** | Institution/source is credible, but current schema, terms, update cadence or granularity still needs validation | Research and pilot before user-facing use |
| **E — Unsupported for product use** | Not official, insufficiently documented, prohibited, or cannot be sourced reliably | Exclude from production |

---

## 4. Authoritative source registry

This table is the initial canonical registry. Persist it in BigQuery and expose a filtered version in the application’s public **Sources** page.

### 4.1 MVP core sources

| Source ID | Source owner | Access class | Data and value | Expected grain | Ingestion approach | MVP decision |
|---|---|---:|---|---|---|---|
| `municipal_money` | National Treasury / OpenUp | A | Municipal financial data derived from Section 71 submissions: income, expenditure, cash flow, debtors, creditors, grants, capital, financial position, audit opinions and UIFW expenditure | Metro, district and local municipality; financial year and reporting period | Automated API connector | **Implement first** |
| `nt_section71_reports` | National Treasury | B | Official quarterly Section 71 reports and related local-government financial-health publications | Municipality, province, national; quarter/year | Download/archive/validate against API | **Implement first** |
| `etenders_portal` | National Treasury / OCPO | B initially | Tender notices, closing status, procurement plans and public tender information | Issuing institution/tender | Official export/download when available; controlled manual uploader; API adapter only after verification | **Implement first** |
| `vulekamali` | National Treasury / OpenUp | A/B | National and provincial budgets, allocations, budget documents, data portal datasets and fiscal context | National, province, vote/programme, year | API/export connector after source contract validation | **Implement first** |
| `dora` | National Treasury | B | Annual Division of Revenue schedules, equitable share and conditional grant allocations | National/province/municipality; financial year | Annual document/data ingestion | **Implement first** |
| `agsa_mfma` | Auditor-General South Africa | B | Municipal audit outcomes, audit reports and governance evidence | Municipality; audit year | Official report ingestion + structured curation | **Implement first** |
| `stats_sa_census` | Statistics South Africa | B | Census 2022, municipal profiles, demographic/service context and statistical tools | Census geography, municipality, province, small area where permitted | Curated official downloads and documented transformations | **Implement first** |
| `mdb_boundaries` | Municipal Demarcation Board | B | Municipal and ward boundary geometries; boundary changes | Municipality/ward; effective boundary version | Curated GIS import, versioned geometry archive | **Implement first** |
| `iec_results` | Electoral Commission of South Africa | B | Historical national, provincial, municipal and by-election results in reports, dashboards, CSV/Excel | Province, municipality, ward, voting district depending report | Official download connector | **Implement first** |
| `saps_crime_stats` | South African Police Service | B | Quarterly crime statistics and releases | Police station/precinct and period | Download/archive; geographic crosswalk required | **Implement first, clearly labelled** |
| `municipal_documents` | Individual municipalities | B/D | IDPs, SDBIPs, budgets, annual reports, AFS, SCM reports, council agendas/minutes and performance reports | Municipality/document/reporting period | Whitelisted official-site ingestion or controlled upload | **Implement first for a small pilot list** |

### 4.2 Phase 2 sources

| Source ID | Source owner | Access class | Data and value | Important constraint |
|---|---|---:|---|---|
| `dws_blue_green_drop` | Department of Water and Sanitation | B/D | Drinking-water and wastewater performance/compliance reports | Treat as periodic reports; verify machine-readable outputs |
| `dbe_emis` | Department of Basic Education | B | ECD/school masterlists, identifiers and public directory/location information | Do not infer infrastructure condition from masterlist alone |
| `hst_district_health_barometer` | Health Systems Trust | D | District health-system benchmarking | Validate data licence, current availability and granularity |
| `sassa_aggregated_stats` | SASSA / DSD | C/D | Aggregated social-grant context | No beneficiary data; validate municipal grain and publication route |
| `greenbook_climate` | CSIR GreenBook | D | Municipal climate hazard, exposure, vulnerability and resilience context | Integrate only after reuse terms and downloadable-data route are confirmed |
| `gazette_policy` | Government Printing Works / official departments | B/D | Gazette notices, regulations, policy changes and consultations | Use official publications; source each item individually |
| `restricted_suppliers` | CSD / OCPO | C | Published restricted supplier and tender-defaulter reports | Never imply a person/company is restricted unless the current official report is directly linked and dated |
| `openstreetmap_basemap` | OpenStreetMap contributors | B | Basemap and supplemental geographic context | Not an official government source; use required attribution and do not use it as legal boundary authority |

### 4.3 Source references for the implementation team

Use these as the source registry’s starting URLs. Before enabling any connector, record the verification date, relevant terms, authentication requirement, source owner and schema fingerprint.

```text
Municipal Money API:       https://municipaldata.treasury.gov.za/api
Municipal Money docs:      https://municipaldata.treasury.gov.za/docs
Municipal Money cubes:     https://municipaldata.treasury.gov.za/api/cubes
MFMA / Section 71:         https://mfma.treasury.gov.za/
National eTenders:         https://www.etenders.gov.za/
Central Supplier Database: https://www.csd.gov.za/
Vulekamali:                https://vulekamali.gov.za/
Vulekamali data portal:    https://data.vulekamali.gov.za/
National Treasury:         https://www.treasury.gov.za/
Stats SA Census:           https://census.statssa.gov.za/
Stats SA:                  https://www.statssa.gov.za/
Municipal Demarcation Bd:  https://www.demarcation.org.za/
IEC results:               https://results.elections.org.za/
SAPS crime statistics:     https://www.saps.gov.za/services/crimestats.php
Auditor-General SA:        https://www.agsa.co.za/
DWS:                       https://www.dws.gov.za/
DBE EMIS downloads:        https://www.education.gov.za/Programmes/EMIS/EMISDownloads.aspx
Health Systems Trust:      https://www.hst.org.za/
CSIR GreenBook:            https://greenbook.co.za/
Government eGazette:       https://www.gpwonline.co.za/
```

---

## 5. The Municipal Money foundation

Municipal Money is the first and most valuable CivicLens source. Its documentation says it publishes municipal financial information in a machine-friendly format and is based on Section 71 submissions to National Treasury. It is updated in quarterly snapshots and warns that data completeness and trustworthiness depend on municipal submissions.

### 5.1 Required cubes

Prefer the newer `v2` cubes where they replace legacy versions:

```text
municipalities
officials
incexp_v2
financial_position_v2
cflow_v2
grants_v2
capital_v2
repmaint_v2
aged_debtor_v2
aged_creditor_v2
audit_opinions
uifwexp
demarcation_changes
```

### 5.2 Important data rules

1. Preserve `amount_type` exactly. It may represent budget, actual, audited actual or another reporting state.
2. Preserve financial year, period and period length.
3. Never mix budget, actual and audited actual in a chart without a visibly clear series label.
4. Treat the API as a source snapshot, not as an immutable historical truth. A municipal submission may be corrected through adjustments in a later period.
5. Store the source response hash and ingestion timestamp for every run.
6. Validate selected figures against published Section 71 reports and report discrepancies as data-quality issues, not as platform bugs.
7. Keep raw data and normalised data separate.
8. Use municipal demarcation codes as core entity keys, not name-only matching.

### 5.3 First MunicipalLens measures

Implement these only when their denominator is valid and clearly documented:

| Measure | Formula concept | User-facing label | Caveat |
|---|---|---|---|
| Cash coverage | Cash / selected current obligations | Cash coverage context | Not a statutory solvency determination |
| Debtor ageing pressure | Debt older than a chosen threshold / total debtors | Long-outstanding debtor pressure | Must show threshold, source period and amount type |
| Creditor ageing pressure | Creditors older than a chosen threshold / total creditors | Long-outstanding creditor pressure | Not a finding of non-payment or default |
| Repairs intensity | Repairs and maintenance / relevant operating expenditure or asset proxy | Repairs and maintenance context | Formula version must be visible |
| Capital delivery context | Capital acquisition by infrastructure category and period | Capital investment context | Do not equate expenditure with completed project delivery |
| Grant reliance | Grants / total selected revenue | Grant reliance | Define revenue series precisely |
| Audit trend | Ordered audit opinions across years | Audit trend | Use AGSA source report links |
| UIFW context | Reported unauthorised, irregular, fruitless and wasteful expenditure values | Reported UIFW expenditure | Do not present as fraud allegation |

---

## 6. Geographic integrity rules

Geography is not a visual decoration. It is a primary data-governance requirement.

### 6.1 Core geography entities

```text
Country
Province
District municipality
Local municipality
Metropolitan municipality
Ward
Voting district
Police station / precinct
Census small area
Health district
School / facility point
```

### 6.2 Boundary versioning

Every geography-bound record must retain:

```text
geography_type
geography_code
geography_name
boundary_version
boundary_effective_from
boundary_effective_to
source_geography_type
crosswalk_method
crosswalk_confidence
```

### 6.3 No false joins

- A police-station crime statistic is **not** automatically a ward statistic.
- A census small-area value is **not** automatically a current ward value.
- A ward changed in a later demarcation cycle cannot be compared directly with a historical ward without a documented crosswalk.
- A municipality can be renamed, merged, disestablished or newly established. Retain history and use `demarcation_changes`.
- When a crosswalk is approximate, show a visible badge: `Approximate geographic allocation`.

### 6.4 Geometry storage

- Store authoritative boundary geometries in Cloud Storage as original GeoJSON/GPKG/ZIP artifacts.
- Load simplified display geometry into BigQuery GIS and/or a map tile service.
- Preserve the original geometry checksum.
- Generate multiple display simplification levels; never replace original legal/reference geometry with simplified geometry.
- Enable map click-through to the geography source and effective boundary period.

---

## 7. Data architecture

### 7.1 High-level flow

```text
Official API / Download / PDF / Official webpage
                  |
                  v
       Source Adapter + Contract Validation
                  |
                  +--> Cloud Storage raw artifact archive
                  |
                  v
        BigQuery RAW dataset (append-only)
                  |
                  v
  BigQuery STAGING dataset (typed, standardised)
                  |
                  v
  BigQuery CORE dataset (entities, facts, lineage)
                  |
                  v
 BigQuery MARTS dataset (safe product-facing views)
                  |
                  v
 Next.js API/BFF -> CivicLens web experience
```

### 7.2 GCP architecture

```text
Browser
  -> Firebase Auth
  -> Next.js web app on Cloud Run
  -> Protected API route/BFF
  -> BigQuery product views
  -> Firestore user data

Cloud Scheduler
  -> Cloud Run Job / ingestion runner
  -> Source adapter
  -> Cloud Storage raw source artifact
  -> BigQuery raw tables
  -> Dataform / BigQuery transformations
  -> Source health + data quality events
  -> Firestore / BigQuery alert records
```

### 7.3 Cost-conscious MVP rules

- Start in one GCP project with dev and prod environments separated by project or strict naming.
- Use BigQuery partitioning and clustering from day one.
- Use Cloud Run Jobs rather than always-on VMs.
- Use Cloud Scheduler at sensible cadence; do not poll hourly for datasets published quarterly.
- Keep original artifacts in Standard Storage initially, then apply lifecycle rules.
- Avoid Vertex AI, Document AI, managed vector search and graph databases in the first release.
- Use public-source links and stored document snippets before adding embeddings.
- Use BigQuery materialised or scheduled tables only where measurement supports the cost.
- Set budget alerts and per-service cost labels.

---

## 8. Repository structure

```text
civiclens-sa/
├── apps/
│   ├── web/                         # Next.js App Router
│   └── ingestor/                    # Node/TypeScript Cloud Run Job runner
├── packages/
│   ├── contracts/                   # Zod schemas, types, source contracts
│   ├── domain/                      # Domain types, score logic, shared utilities
│   ├── ui/                          # Shared UI components
│   └── config/                      # Source registry/configuration
├── dataform/                        # SQLX or BigQuery transformation definitions
│   ├── definitions/
│   └── includes/
├── infra/
│   └── terraform/
│       ├── modules/
│       ├── envs/dev/
│       └── envs/prod/
├── docs/
│   ├── ADR/
│   ├── DATA_DICTIONARY.md
│   ├── SOURCE_REGISTRY.md
│   ├── SCORING_METHODS.md
│   └── RUNBOOK.md
├── scripts/
│   ├── seed-dev.ts
│   └── validate-source-contracts.ts
├── .github/workflows/
├── pnpm-workspace.yaml
├── docker-compose.yml
├── Makefile
└── README.md
```

### 8.1 Required technical standards

- TypeScript strict mode.
- Zod runtime validation for every inbound source payload and API response.
- ESLint, Prettier and commit hooks.
- Unit tests with Vitest.
- API/integration tests using mocked source fixtures.
- Playwright end-to-end tests for core user journeys.
- Terraform format/validate/plan in CI.
- No secrets in code, `.env` files, screenshots or test fixtures.
- Structured logs with `source_id`, `run_id`, `artifact_id`, `municipality_code` when applicable.
- OpenTelemetry-compatible trace IDs where practical.
- Accessibility target: keyboard usable, responsive, semantic headings, clear focus states, contrast-safe colours.

---

## 9. Warehouse design

### 9.1 BigQuery datasets

```text
civiclens_raw
civiclens_staging
civiclens_core
civiclens_marts
civiclens_ops
```

### 9.2 Essential tables

#### Operations and lineage

```sql
CREATE TABLE civiclens_ops.source_registry (
  source_id STRING NOT NULL,
  source_name STRING NOT NULL,
  source_owner STRING,
  official_base_url STRING,
  access_class STRING,
  access_method STRING,
  cadence_expected STRING,
  public_use_status STRING,
  terms_url STRING,
  data_classification STRING,
  status STRING,
  last_verified_at TIMESTAMP,
  notes STRING,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE civiclens_ops.ingestion_runs (
  run_id STRING NOT NULL,
  source_id STRING NOT NULL,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  status STRING NOT NULL,
  trigger_type STRING,
  rows_read INT64,
  rows_written INT64,
  artifacts_created INT64,
  schema_fingerprint STRING,
  error_code STRING,
  error_message STRING,
  correlation_id STRING,
  metadata JSON
)
PARTITION BY DATE(started_at)
CLUSTER BY source_id, status;

CREATE TABLE civiclens_ops.source_artifacts (
  artifact_id STRING NOT NULL,
  source_id STRING NOT NULL,
  run_id STRING NOT NULL,
  artifact_type STRING NOT NULL,
  source_url STRING,
  gcs_uri STRING NOT NULL,
  content_type STRING,
  content_sha256 STRING,
  retrieved_at TIMESTAMP NOT NULL,
  published_at TIMESTAMP,
  coverage_start DATE,
  coverage_end DATE,
  geographic_coverage STRING,
  terms_snapshot_uri STRING,
  metadata JSON
)
PARTITION BY DATE(retrieved_at)
CLUSTER BY source_id, artifact_type;
```

#### Core reference and fact tables

```sql
CREATE TABLE civiclens_core.dim_geography (
  geography_key STRING NOT NULL,
  geography_type STRING NOT NULL,
  official_code STRING,
  name STRING NOT NULL,
  parent_geography_key STRING,
  boundary_version STRING,
  effective_from DATE,
  effective_to DATE,
  geometry_wkt GEOGRAPHY,
  source_id STRING,
  source_artifact_id STRING,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
CLUSTER BY geography_type, official_code;

CREATE TABLE civiclens_core.dim_source (
  source_key STRING NOT NULL,
  source_id STRING NOT NULL,
  source_name STRING NOT NULL,
  source_owner STRING,
  official_url STRING,
  access_class STRING,
  last_verified_at TIMESTAMP,
  active BOOL
);

CREATE TABLE civiclens_core.dim_metric (
  metric_id STRING NOT NULL,
  name STRING NOT NULL,
  definition STRING NOT NULL,
  calculation_version STRING NOT NULL,
  unit STRING,
  directionality STRING,
  caveat STRING,
  active BOOL
);

CREATE TABLE civiclens_core.fact_financial_observation (
  observation_id STRING NOT NULL,
  source_id STRING NOT NULL,
  artifact_id STRING,
  municipality_code STRING NOT NULL,
  financial_year INT64,
  financial_period INT64,
  period_length STRING,
  amount_type_code STRING,
  amount_type_label STRING,
  cube_name STRING,
  item_code STRING,
  item_label STRING,
  amount NUMERIC,
  currency_code STRING,
  published_at TIMESTAMP,
  retrieved_at TIMESTAMP,
  data_quality_status STRING,
  source_record_hash STRING,
  raw_payload JSON
)
PARTITION BY DATE(published_at)
CLUSTER BY municipality_code, cube_name, financial_year, item_code;

CREATE TABLE civiclens_core.fact_procurement_notice (
  notice_id STRING NOT NULL,
  source_id STRING NOT NULL,
  artifact_id STRING,
  external_notice_id STRING,
  issuing_entity_name STRING,
  issuing_entity_code STRING,
  title STRING,
  description STRING,
  status STRING,
  category STRING,
  published_at TIMESTAMP,
  closing_at TIMESTAMP,
  award_date TIMESTAMP,
  source_url STRING,
  geography_key STRING,
  raw_payload JSON,
  retrieved_at TIMESTAMP,
  source_record_hash STRING
)
PARTITION BY DATE(published_at)
CLUSTER BY status, issuing_entity_name, closing_at;

CREATE TABLE civiclens_core.fact_audit_outcome (
  audit_outcome_id STRING NOT NULL,
  source_id STRING NOT NULL,
  artifact_id STRING,
  municipality_code STRING,
  audit_year INT64,
  opinion_code STRING,
  opinion_label STRING,
  report_url STRING,
  published_at TIMESTAMP,
  retrieved_at TIMESTAMP,
  data_quality_status STRING
)
CLUSTER BY municipality_code, audit_year;

CREATE TABLE civiclens_core.fact_document (
  document_id STRING NOT NULL,
  source_id STRING NOT NULL,
  artifact_id STRING,
  municipality_code STRING,
  document_type STRING,
  title STRING,
  report_period STRING,
  published_at TIMESTAMP,
  source_url STRING,
  gcs_uri STRING,
  content_sha256 STRING,
  parse_status STRING,
  page_count INT64,
  extraction_method STRING,
  rights_status STRING,
  created_at TIMESTAMP
)
CLUSTER BY municipality_code, document_type;

CREATE TABLE civiclens_core.fact_document_chunk (
  chunk_id STRING NOT NULL,
  document_id STRING NOT NULL,
  page_number INT64,
  heading STRING,
  text STRING,
  char_start INT64,
  char_end INT64,
  citation_label STRING,
  created_at TIMESTAMP
)
CLUSTER BY document_id, page_number;
```

### 9.3 Raw, staging, core and mart responsibilities

| Layer | Purpose | Mutation rule |
|---|---|---|
| `raw` | Immutable captured source records and file-derived tables | Append-only; never manually “fix” source data |
| `staging` | Typed columns, schema normalisation, dedupe and parsing | Rebuildable |
| `core` | Canonical entities, facts, source lineage and valid crosswalks | Controlled transformations only |
| `marts` | Product-safe aggregates, trend views, score inputs and public API views | Rebuildable and versioned |
| `ops` | Source registry, ingestion health, artifacts, validation failures and alerts | Append-only where auditability matters |

---

## 10. Source adapter contract

Every source adapter must conform to this interface conceptually:

```ts
export interface SourceAdapter {
  sourceId: string;
  healthCheck(): Promise<SourceHealthResult>;
  discover(context: DiscoverContext): Promise<SourceArtifactDescriptor[]>;
  fetch(artifact: SourceArtifactDescriptor, context: FetchContext): Promise<FetchedArtifact>;
  validate(artifact: FetchedArtifact): Promise<ValidationResult>;
  parse(artifact: FetchedArtifact): Promise<ParsedSourceRecord[]>;
  normalise(records: ParsedSourceRecord[]): Promise<NormalisedRecord[]>;
  persist(records: NormalisedRecord[], context: PersistContext): Promise<PersistResult>;
}
```

### 10.1 Minimum health-check result

```ts
type SourceHealthResult = {
  sourceId: string;
  checkedAt: string;
  status: "healthy" | "degraded" | "blocked" | "unknown";
  officialUrlReachable: boolean;
  authRequired: boolean;
  exportDetected: boolean;
  schemaFingerprint?: string;
  termsCheckedAt?: string;
  notes: string[];
};
```

### 10.2 Connector requirements

Every connector must:
- Write an `ingestion_runs` row before work begins.
- Persist original response/file bytes to Cloud Storage before transformation.
- Create a SHA-256 hash.
- Record source URL and retrieval timestamp.
- Use idempotency keys.
- Detect schema drift.
- Fail safely when source access fails.
- Never silently substitute an alternative source.
- Emit validation errors into an operations table.
- Support `dryRun`, `since`, `sourceId` and `limit` flags.
- Be testable against saved fixtures.
- Use retries with exponential backoff only where appropriate.
- Respect source rate limits, robots directives and terms.

---

## 11. Source-specific ingestion plans

### 11.1 Municipal Money

**Cadence:** daily source-health check; quarterly full refresh; optional light periodic check for newly available data.

**Steps:**
1. Call `/api/cubes`.
2. Confirm required cube names exist.
3. Fetch each supported cube with a controlled page/window strategy.
4. Store original JSON response per request/window.
5. Validate against Zod schema.
6. Load raw tables.
7. Transform to canonical financial observation records.
8. Build municipality-period-cube completeness report.
9. Validate selected records against published Section 71 artifacts.
10. Publish only successful validated marts.

**Failure policy:** If a cube schema changes, mark source `degraded`, retain last successful user-facing data, show freshness date, and block release of incompatible transformations.

### 11.2 eTenders

**MVP access policy:** Do not assume a stable public API. Build three modes:

```text
Mode 1 — Official structured API adapter (disabled until verified)
Mode 2 — Official export/download adapter (preferred MVP)
Mode 3 — Admin-reviewed import of an official downloaded CSV/XLSX/PDF
```

**Required fields where available:**

```text
external_notice_id
title
description
issuing_entity_name
issuing_entity_code
procurement_method
status
published_at
closing_at
award_date
estimated_value
currency
category
contact_channel
source_url
source_artifact_id
```

**Tender safety rules:**
- Use status wording exactly as supplied by the official source.
- Never infer bid award, supplier relationship, fraud, irregularity or cancellation reason.
- Store the page/download snapshot that supports each displayed tender.
- Warn users when a closing time lacks timezone or source confirmation.
- Offer saved search and expiry alerts only after source freshness is known.

### 11.3 Vulekamali and DORA

**Purpose:** funding context, fiscal allocations, budget documents and national/provincial comparators.

**Cadence:** annual full release ingestion with monitored updates around the budget cycle.

**Rules:**
- Retain fiscal-year labels exactly.
- Store schedule/table/document page citations for DORA values.
- Separate equitable share, conditional grants, allocations, actual expenditure and budgeted expenditure.
- Do not show a local-government allocation as a municipality’s own expenditure.

### 11.4 AGSA

**Purpose:** audit-opinion history and audit-report source evidence.

**Rules:**
- Store audit year, report URL, opinion and report artifact.
- Use neutral labels.
- A trend chart may show `improved`, `unchanged`, `deteriorated` only by a transparent ordered opinion mapping documented in `SCORING_METHODS.md`.
- Any audit narrative shown in a UI must link to the exact report and page/section.

### 11.5 Stats SA

**Purpose:** demographic, socioeconomic and service context.

**Rules:**
- Preserve release name, release year, census/survey type, geography type and source table.
- Do not use Census 2022 data as a “current live population” estimate without clear wording.
- Never aggregate small-area data into wards without recording method and boundary vintage.
- Build municipality profile cards first; add ward aggregation only after a reviewed crosswalk.

### 11.6 MDB boundary data

**Purpose:** authoritative municipal/ward geometry and boundary versioning.

**Rules:**
- Source and retain original geometry package.
- Validate geometry.
- Avoid changing a boundary’s identifier in-place; create versioned records.
- Map style must state boundary version/effective date where relevant.
- Use MDB code as a canonical municipality key; reconcile aliases separately.

### 11.7 IEC results

**Purpose:** user-accessible historical electoral context, not predictive polling.

**Rules:**
- Use official Excel/CSV/PDF reports downloaded from the IEC results portal.
- Record election type, election date, ballot type, geography level and report artifact.
- Give voters/results data a distinct time label.
- Never conflate registered voters with population.
- Never show live or incomplete results as final.
- API integration stays disabled until official access and documentation are confirmed.

### 11.8 SAPS crime statistics

**Purpose:** crime context by reporting geography and period.

**Rules:**
- Treat SAPS crime reporting geography as police station/precinct unless the source defines otherwise.
- Do not label a value “municipal crime rate” simply because the map places it inside a municipality.
- Use a documented station-to-municipality/ward crosswalk, and tag allocations as exact or approximate.
- Store category, reporting period, source release and artifact.
- Do not provide “safety rankings” in MVP.

### 11.9 Municipal documents

**Pilot municipalities:** start with City of Tshwane, City of Johannesburg, Ekurhuleni, City of Cape Town and eThekwini, subject to official-source availability.

**Document types:**
- Integrated Development Plan (IDP)
- Medium-Term Revenue and Expenditure Framework / budget
- Adjustment budget
- Service Delivery and Budget Implementation Plan (SDBIP)
- Annual report
- Audited annual financial statements (AFS)
- SCM deviations
- Bid specifications, awards and adjudication records
- Council agenda/minutes/resolutions
- Infrastructure project lists
- Performance reports

**Ingestion rules:**
- Use a municipality whitelist; no broad web crawl.
- Only index documents hosted on official municipal domains or an explicitly approved government repository.
- Archive original document and extracted text.
- Extract page-aware chunks.
- Use OCR only for a scanned document where no text layer is available, and mark `extraction_method = OCR`.
- Document summaries must cite pages.
- Before AI summarisation, retrieve only chunks from the selected document; no unsupported narrative additions.
- Search results must display document title, date, municipality, type and source link.

---

## 12. Public source provenance model

Every product-facing record needs a compact provenance payload.

```json
{
  "sourceId": "municipal_money",
  "sourceName": "Municipal Money",
  "sourceOwner": "National Treasury / OpenUp",
  "sourceUrl": "https://municipaldata.treasury.gov.za/api/cubes/incexp_v2",
  "artifactId": "art_01J...",
  "publishedAt": "2026-06-30T00:00:00Z",
  "retrievedAt": "2026-07-02T08:00:00Z",
  "coveragePeriod": "2025/26 Q4",
  "geography": {
    "type": "local_municipality",
    "code": "TSH",
    "name": "City of Tshwane",
    "boundaryVersion": "2026"
  },
  "qualityStatus": "source_published",
  "validationStatus": "passed",
  "calculationVersion": null
}
```

### 12.1 User-facing data badges

| Badge | Meaning |
|---|---|
| `Audited actual` | Source identifies the number as audited actual |
| `Reported actual` | Source identifies the number as reported actual |
| `Budget` | Planned/budget value, not actual performance |
| `Calculated` | CivicLens calculation from linked source values |
| `Source published` | Published by the named source, not independently audited by CivicLens |
| `Provisional` | The source marks the value or release as preliminary/provisional |
| `Needs review` | Pipeline found an issue; do not use in scores |
| `Approximate geography` | Value is allocated through a documented geographic crosswalk |

---

## 13. Product information architecture

### 13.1 Public routes

```text
/
/municipalities
/municipalities/[municipalityCode]
/municipalities/[municipalityCode]/finance
/municipalities/[municipalityCode]/governance
/municipalities/[municipalityCode]/documents
/municipalities/[municipalityCode]/map
/tenders
/tenders/[noticeId]
/compare
/elections
/map
/documents
/sources
/methodology
/data-freshness
/about
```

### 13.2 Authenticated routes

```text
/app
/app/watchlists
/app/alerts
/app/saved-comparisons
/admin
/admin/sources
/admin/ingestions
/admin/documents
/admin/review-queue
```

### 13.3 Municipality overview page

The overview must include:

1. Municipality identity: official name, code, type, province, boundary version.
2. “What is new” panel: fresh tenders, new reports, changed quality flags.
3. Finance summary: selected trend indicators with amount type and period.
4. Governance summary: audit history and report links.
5. Funding context: grants/DORA where available.
6. Demographic/context cards: release year and source.
7. Map context: boundary and layer selectors.
8. Document evidence: latest IDP/budget/annual-report items.
9. Source provenance drawer: explicit source links, dates and caveats.
10. “Compare” action.
11. “Watch municipality” action for registered users.

### 13.4 TenderLens page

Required features:
- Search by keyword, organ of state, province, category, status and closing date.
- “Closing soon” view.
- Source status/freshness.
- Tender detail page with official source link, downloaded artifact reference and current status.
- Saved searches and alerts for authenticated users.
- Clear disclaimer: CivicLens is a discovery and intelligence tool, not the tender issuer or legal procurement authority.

### 13.5 Design direction

Use a clean, civic, premium visual system:
- Bright white and warm light-grey surfaces.
- Subtle use of South African green, gold, red and blue accents.
- Rounded cards, restrained shadows and simple motion.
- No dark navy/purple “vibe-coded” dashboard aesthetic.
- Dense data is acceptable only with good whitespace, tooltips and progressive disclosure.
- Colour must never be the sole carrier of meaning.
- Every chart needs title, source, period, units and accessible text summary.

---

## 14. Product API design

Use a BFF layer. Never query raw tables directly from browser code.

```text
GET /api/v1/municipalities
GET /api/v1/municipalities/:code
GET /api/v1/municipalities/:code/finance
GET /api/v1/municipalities/:code/governance
GET /api/v1/municipalities/:code/documents
GET /api/v1/tenders
GET /api/v1/tenders/:noticeId
GET /api/v1/elections
GET /api/v1/map/layers
GET /api/v1/sources
GET /api/v1/data-freshness
GET /api/v1/methodology/metrics/:metricId
```

### 14.1 API response requirements

Every response must include:

```json
{
  "data": {},
  "meta": {
    "requestId": "req_...",
    "generatedAt": "2026-07-02T08:00:00Z",
    "filters": {},
    "pagination": {},
    "freshness": {},
    "sources": [],
    "warnings": []
  }
}
```

### 14.2 Query safety

- Parameterise all BigQuery queries.
- Allow-list sortable/filterable fields.
- Enforce pagination.
- Cache only product-safe marts with a clearly defined TTL.
- Rate-limit public expensive endpoints.
- Use row-level restrictions in the BFF for admin-only fields.
- Do not expose raw API payloads to public users.

---

## 15. Scoring and explanations

### 15.1 MVP score policy

Build **component indicators**, not a single all-powerful municipality rating.

The initial UI may calculate a `Municipal Financial Context Index`, but it must:
- be clearly labelled as a CivicLens analytical indicator;
- be versioned;
- show its exact input values and weights;
- never be used as a credit rating;
- exclude records flagged `needs_review`;
- allow the user to inspect source evidence.

### 15.2 Initial score components

```text
Financial sustainability context
  - creditor ageing context
  - debtor ageing context
  - cash-flow context
  - selected liabilities / financial-position context
  - grant reliance context

Governance context
  - audit opinion trend
  - reported UIFW expenditure context
  - source/document completeness

Service context (not scored in MVP)
  - water compliance
  - safety
  - education / health
  - population/service context

Resilience context (Phase 2)
  - climate hazard, exposure and vulnerability context
```

### 15.3 Calculation governance

For every calculated metric:
- Give it a stable `metric_id`.
- Maintain `calculation_version`.
- Store numerator, denominator, source records and computation timestamp.
- Put the human-readable definition in `DATA_DICTIONARY.md`.
- Put formula and rationale in `SCORING_METHODS.md`.
- Write unit tests using known fixtures.
- Do not retroactively overwrite past output without a version change.

---

## 16. Security, privacy and legal rules

### 16.1 Data classifications

| Classification | Examples | Rule |
|---|---|---|
| Public official data | Published reports, public tenders, municipal finance aggregates | Store with source lineage and reuse review |
| Restricted public-access data | Login-controlled CSD information, limited dashboards | Do not ingest without documented permission |
| Personal information | Beneficiary records, contact details not needed for public product | Exclude from analytics and UI |
| Sensitive operational data | Credentials, supplier application workflow information | Never store in civic public datasets |
| User account data | Auth identity, watchlists, alerts | Store in Firebase/Firestore with least privilege |

### 16.2 Required controls

- Firebase Auth with verified email for saved alerts.
- Role-based admin authorization using custom claims or a secure server-side role map.
- Secret Manager for all source credentials.
- Service accounts with least privilege.
- Separate Cloud Run service accounts for web and ingestion.
- BigQuery dataset access separation.
- Cloud Storage bucket policy: raw artifacts private; product-export artifacts controlled.
- Audit logs enabled.
- Request IDs and structured logs.
- Terraform state protected and remote.
- Dependency scanning and secret scanning in CI.
- Data retention/lifecycle policies.
- Terms-of-use review record per source.

### 16.3 Content and defamation safety

- Do not label an organisation, official, supplier or municipality as corrupt, fraudulent or criminal based solely on data signals.
- Use factual, neutral language: “reported”, “published”, “audit opinion”, “appears in current official report”.
- For CSD restricted suppliers/tender defaulters, show the current source report date and link; never rely on a stale cached result alone.
- Provide a correction/contact route for source disputes.

---

## 17. Data quality framework

### 17.1 Freshness service-level targets

| Source class | Expected refresh | Product freshness label |
|---|---|---|
| Municipal Money | Quarterly snapshots; health check more often | `Updated through [period]` |
| eTenders | Source-dependent; aim daily where permitted | `Last checked [timestamp]` |
| DORA/Vulekamali | Annual budget cycle plus revisions | `Budget cycle [year]` |
| AGSA | Annual/report release | `Audit year [year]` |
| Stats SA | Release/survey dependent | `Release year [year]` |
| IEC | Event-driven and historical | `Election date [date]` |
| SAPS | Quarterly release | `Crime period [quarter]` |
| Municipal documents | Monthly/quarterly manual review by pilot municipality | `Document published [date]` |

### 17.2 Quality checks

```text
Schema check
Completeness check
Primary-key uniqueness check
Date-range check
Numeric range / sign check
Reference integrity check
Geography crosswalk validity check
Duplicate artifact hash check
Freshness check
Cross-source validation check
Calculation reconciliation check
Manual-review queue trigger
```

### 17.3 Source-health dashboard

Build an internal admin page with:
- latest success/failure by source;
- last successful ingestion;
- artifact count;
- row counts;
- schema fingerprint;
- freshness SLA;
- validation failures;
- source owner/contact;
- terms reviewed date;
- disabled connector reasons;
- retry controls;
- link to logs and raw artifact.

---

## 18. Development phases

### Phase 0 — Foundation (week 1)

- [ ] Create monorepo and CI.
- [ ] Provision dev GCP infrastructure through Terraform.
- [ ] Create Firebase project/configuration.
- [ ] Configure BigQuery datasets, Storage buckets, Secret Manager and service accounts.
- [ ] Build source registry and ingestion-run tables.
- [ ] Build source adapter interfaces, health-check framework and fixture test harness.
- [ ] Implement base web shell, typography, responsive layout and public source page.
- [ ] Add user authentication and role model.
- [ ] Establish data dictionary, ADR and runbook documents.

### Phase 1 — MunicipalLens MVP (weeks 2–3)

- [ ] Implement Municipal Money connector.
- [ ] Load required v2 cubes.
- [ ] Build raw/staging/core/mart transformations.
- [ ] Implement municipality list, overview and finance screens.
- [ ] Add source provenance drawer.
- [ ] Add finance filters for financial year, period, amount type and municipality.
- [ ] Implement data freshness display.
- [ ] Build unit and integration tests using source fixtures.

### Phase 2 — Governance and geography (weeks 4–5)

- [ ] Import canonical municipal boundaries and municipality dimension.
- [ ] Implement boundary versioning.
- [ ] Add AGSA audit outcome import and governance page.
- [ ] Add official Section 71 report archive/validation workflow.
- [ ] Add compare view.
- [ ] Add map view with authoritative boundaries.
- [ ] Implement initial financial-context indicators with methodology pages.

### Phase 3 — TenderLens and ElectionLens (weeks 6–7)

- [ ] Build eTenders source health checker.
- [ ] Implement official-export/manual-import workflow.
- [ ] Build tender search and tender detail pages.
- [ ] Add saved tender search and alerts.
- [ ] Implement IEC report import.
- [ ] Build election context charts and map layers.
- [ ] Explicitly tag election/report geography.

### Phase 4 — Documents and Phase 2 source pilots (weeks 8–10)

- [ ] Add municipality whitelist and document registry.
- [ ] Ingest pilot municipal IDP/budget/SDBIP/annual reports.
- [ ] Build document extraction, chunking, citation and search.
- [ ] Pilot DWS, DBE EMIS and GreenBook source contracts.
- [ ] Add data-quality review queue.
- [ ] Add administrative health dashboard.

---

## 19. Acceptance criteria

The MVP is ready for a controlled public beta only when all of the following are true:

### Data integrity

- [ ] Municipal Money connector runs idempotently.
- [ ] At least one full financial-year/municipality test sample reconciles against a stored official reference report.
- [ ] Amount type, source period and source URL are visible in financial views.
- [ ] All user-facing financial values have provenance metadata.
- [ ] Boundaries are versioned and map layers do not silently combine incompatible geographies.
- [ ] No tender is displayed without official-source reference and retrieved artifact.
- [ ] No user-facing score uses missing, stale or `needs_review` inputs.
- [ ] All imported documents retain original artifact and page-aware text references.

### Product quality

- [ ] Public pages work on mobile and desktop.
- [ ] Core flows are keyboard-accessible.
- [ ] Charts have accessible summaries.
- [ ] Empty, loading, stale and error states are designed.
- [ ] Every chart has source, period, metric definition and caveat.
- [ ] App has no fake production data.
- [ ] Demo fixtures are visibly marked `Demo data — not live`.

### Security and operations

- [ ] No secrets are in repository history.
- [ ] Least-privilege service accounts are in place.
- [ ] All ingestion runs are observable.
- [ ] Error alerts exist for failed core source runs.
- [ ] Budget alerts are configured.
- [ ] Terraform can create a clean dev environment.
- [ ] CI blocks lint, type, test and Terraform failures.

---

## 20. Environment variables

```bash
# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Google Cloud
GOOGLE_CLOUD_PROJECT=
GOOGLE_CLOUD_REGION=africa-south1
BIGQUERY_PROJECT_ID=
BIGQUERY_RAW_DATASET=civiclens_raw
BIGQUERY_STAGING_DATASET=civiclens_staging
BIGQUERY_CORE_DATASET=civiclens_core
BIGQUERY_MARTS_DATASET=civiclens_marts
BIGQUERY_OPS_DATASET=civiclens_ops
RAW_ARTIFACT_BUCKET=
DOCUMENT_BUCKET=
SOURCE_TERMS_BUCKET=

# Runtime / security
APP_ENV=development
LOG_LEVEL=info
ADMIN_EMAIL_ALLOWLIST=
INGESTION_SERVICE_TOKEN=
SENTRY_DSN=

# Optional connectors — only enable after verification
ETENDERS_API_BASE_URL=
ETENDERS_API_KEY_SECRET_NAME=
IEC_API_BASE_URL=
IEC_API_KEY_SECRET_NAME=
```

---

## 21. Codex execution prompt

Copy the section below into Codex after placing this specification at `docs/CIVICLENS_BUILD_SPEC.md`.

```text
You are the lead staff engineer for CivicLens SA. Read docs/CIVICLENS_BUILD_SPEC.md completely and implement Phase 0 plus Phase 1 first.

Build a production-minded, cost-conscious monorepo using:
- Next.js App Router, TypeScript strict mode, Tailwind and accessible components
- Firebase Authentication and Firestore for users/watchlists/alerts
- BigQuery for analytics
- Cloud Storage for immutable raw source artifacts
- Cloud Run Jobs and Cloud Scheduler for ingestion
- Terraform for all GCP infrastructure
- Zod schemas and Vitest/Playwright tests

Start by creating:
1. a clean pnpm monorepo;
2. architecture decision records;
3. source adapter interface and source registry;
4. BigQuery Terraform resources and SQL/Dataform transformations;
5. Municipal Money source adapter using the verified v2 cube strategy;
6. raw/staging/core/mart tables;
7. source health, ingestion-run and artifact lineage tables;
8. a polished Municipality directory and Municipality Overview page;
9. finance charts with amount type, reporting period, source and methodology;
10. source provenance drawer and data freshness UI;
11. local fixtures for development and a visible DEMO label where fixtures are used;
12. CI checks for lint, types, unit tests and Terraform validation.

Constraints:
- No fake live data.
- No claim that an unverified source has an API.
- Do not build eTenders scraping until a source-contract health check and terms review are implemented.
- Do not expose CSD supplier data or personal information.
- Every user-facing value must provide source, period, retrieval date, quality status and caveat.
- Use light, premium civic design with South African accent colours. Avoid dark navy/purple dashboards.
- Use MapLibre, not a paid-map dependency, for the MVP.
- Keep all score calculations versioned and fully explainable.
- Prefer simple working architecture over unnecessary microservices.
- Run tests after each implementation milestone and update README plus docs.

At the end of Phase 1, provide:
- a runnable local dev setup;
- Terraform plan instructions;
- a source health report;
- a data dictionary;
- a short implementation report listing completed work, deferred work and risks.
```

---

## 22. Research notes and evidence expectations

The first CivicLens source document was directionally strong: it correctly prioritised procurement, municipal finance, social/demographic information, spatial/electoral data, water/service delivery, education/health, SAPS and AGSA. This revised specification keeps those pillars but applies source-access, provenance, geographic-integrity and legal-reuse controls.

The official Municipal Money documentation confirms that the API offers municipal financial data in machine-friendly form, including Section 71-derived information, and documents the current v2 cube replacements. The source itself warns that municipal submission completeness and correctness must be considered, so CivicLens must display data quality rather than hide uncertainty.

The official IEC results portal confirms interactive historical/live result dashboards and downloadable election reports in PDF, Excel and CSV formats. The MVP should consume those official downloads rather than relying on an unverified developer API.

The official DBE EMIS download page currently exposes quarterly ECD masterlist downloads by province and national aggregate. This supports a masterlist/identifier use case, not an assumption of a complete, current school-infrastructure condition database.

The official CSD site confirms it is the government’s central supplier database and points to restricted-supplier/tender-defaulter reporting; it must not be treated as an unrestricted supplier-data API.

The CSIR GreenBook provides municipal climate-risk context, including risk profiles, vulnerabilities, projections, hazard exposure and adaptation planning material. It is a strong Phase 2 candidate pending data-reuse and ingestion-route confirmation.

---

## 23. Final product principle

CivicLens should not try to impress users by putting every South African dataset on one dashboard.

It should win trust by making each answer inspectable:

```text
What does this number mean?
Who published it?
For which period?
For which geography?
Is it audited, reported, budgeted or calculated?
When did CivicLens retrieve it?
What documents support it?
What are the limitations?
```

Build the platform around those questions. That is the defensible moat.
