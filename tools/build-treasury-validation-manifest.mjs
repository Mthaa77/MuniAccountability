import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const defaultManifestPath = path.join(root, "data", "treasury", "validation", "municipal-money-validation-manifest.json");
const defaultFormulaPath = path.join(root, "data", "treasury", "validation", "financial-pulse-formulas.json");

function usage() {
  return [
    "Usage: node tools/build-treasury-validation-manifest.mjs [options]",
    "",
    "Options:",
    "  --base <path>                 Existing validation manifest. Defaults to committed manifest.",
    "  --formulas <path>             Formula registry. Defaults to committed registry.",
    "  --schema-snapshot <path>      JSON schema snapshot as an array of field names or an object with fields/columns.",
    "  --connector-status <status>   Connector status, e.g. validated or not_configured.",
    "  --connector-url <url>         Connector base URL or evidence URL.",
    "  --reuse-status <status>       Reuse status, e.g. approved or not_started.",
    "  --reuse-evidence <url>        Reuse evidence URL.",
    "  --freshness-status <status>   Freshness status, e.g. validated or not_started.",
    "  --expected-cadence <value>    Expected pull cadence, e.g. monthly.",
    "  --stale-after-days <number>   Stale threshold.",
    "  --validate-formulas           Register formula versions from the formula registry.",
    "  --unlock-by <name>            Unlock decision approver. Only unlocks when every gate passes.",
    "  --out <path>                  Output path. Defaults to committed manifest.",
    "  --dry-run                     Print manifest JSON without writing."
  ].join("\n");
}

function parseArgs(argv) {
  const args = { dryRun: false, validateFormulas: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--validate-formulas") {
      args.validateFormulas = true;
    } else if (arg.startsWith("--")) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${arg}`);
      }
      args[key] = value;
      index += 1;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function schemaFieldsFromSnapshot(filePath) {
  const snapshot = readJson(filePath);
  if (Array.isArray(snapshot)) return snapshot.filter((field) => typeof field === "string");
  if (Array.isArray(snapshot.fields)) {
    return snapshot.fields
      .map((field) => typeof field === "string" ? field : typeof field?.name === "string" ? field.name : null)
      .filter(Boolean);
  }
  if (Array.isArray(snapshot.columns)) {
    return snapshot.columns
      .map((field) => typeof field === "string" ? field : typeof field?.name === "string" ? field.name : null)
      .filter(Boolean);
  }
  if (snapshot.properties && typeof snapshot.properties === "object") return Object.keys(snapshot.properties);
  throw new Error("Schema snapshot must be an array, {fields}, {columns}, or JSON schema {properties}.");
}

function assertReviewedSchemaSnapshot(filePath) {
  const snapshotText = fs.readFileSync(filePath, "utf8");
  const snapshot = JSON.parse(snapshotText);
  const markerText = snapshotText.toUpperCase();
  const reviewEvidence = snapshot.reviewEvidence ?? {};
  const hasPlaceholderMarker = markerText.includes("REPLACE_WITH") || markerText.includes("SAMPLE_ONLY");
  const missingFreshnessEvidence = reviewEvidence && (
    reviewEvidence.lastSuccessfulPullAt === null ||
    reviewEvidence.staleAfterDays === null ||
    String(reviewEvidence.reusePermissionReference ?? "").includes("REPLACE_WITH") ||
    String(reviewEvidence.freshnessCadence ?? "").includes("REPLACE_WITH")
  );

  if (hasPlaceholderMarker || missingFreshnessEvidence) {
    throw new Error(
      "Schema snapshot appears to be a template/sample input. Replace placeholders with reviewed Treasury reuse, freshness and schema evidence before building a validation manifest."
    );
  }
}

function requiredFormulaFields(formulas) {
  return Array.from(new Set(formulas.formulas.flatMap((formula) => formula.requiredFields ?? []))).sort();
}

function canUnlock(manifest, formulas) {
  const validatedFields = new Set(manifest.schemaFingerprint.validatedFields);
  const requiredFields = requiredFormulaFields(formulas);
  const allFieldsPresent = requiredFields.every((field) => validatedFields.has(field));
  const formulaMetrics = new Set(manifest.formulaVersions.map((formula) => formula.metric));
  const allFormulasRegistered = formulas.formulas.every((formula) => formula.status === "validated" && formulaMetrics.has(formula.metric));

  return (
    manifest.connector.status === "validated" &&
    manifest.reuseReview.status === "approved" &&
    manifest.schemaFingerprint.status === "validated" &&
    allFieldsPresent &&
    allFormulasRegistered &&
    manifest.freshness.status === "validated"
  );
}

function buildManifest(args) {
  const manifestPath = path.resolve(args.base ?? defaultManifestPath);
  const formulaPath = path.resolve(args.formulas ?? defaultFormulaPath);
  const manifest = readJson(manifestPath);
  const formulas = readJson(formulaPath);
  const next = structuredClone(manifest);

  next.updatedAt = new Date().toISOString();

  if (args.connectorStatus) next.connector.status = args.connectorStatus;
  if (args.connectorUrl) next.connector.baseUrl = args.connectorUrl;
  if (args.connectorStatus === "validated") {
    next.connector.lastProbeAt = next.updatedAt;
    next.connector.lastProbeStatus = "validated by operator manifest input";
  }

  if (args.reuseStatus) next.reuseReview.status = args.reuseStatus;
  if (args.reuseEvidence) next.reuseReview.evidenceUrl = args.reuseEvidence;

  if (args.schemaSnapshot) {
    const schemaSnapshotPath = path.resolve(args.schemaSnapshot);
    assertReviewedSchemaSnapshot(schemaSnapshotPath);
    const fields = schemaFieldsFromSnapshot(schemaSnapshotPath);
    const requiredFields = requiredFormulaFields(formulas);
    const missing = requiredFields.filter((field) => !fields.includes(field));
    next.schemaFingerprint.status = missing.length ? "not_started" : "validated";
    next.schemaFingerprint.fingerprint = sha256(JSON.stringify(fields.sort()));
    next.schemaFingerprint.requiredFields = requiredFields;
    next.schemaFingerprint.validatedFields = fields.sort();
  }

  if (args.validateFormulas) {
    next.formulaVersions = formulas.formulas
      .filter((formula) => formula.status === "validated")
      .map((formula) => ({
        id: formula.id,
        metric: formula.metric,
        version: formula.version,
        expression: formula.expression
      }));
  }

  if (args.freshnessStatus) next.freshness.status = args.freshnessStatus;
  if (args.expectedCadence) next.freshness.expectedCadence = args.expectedCadence;
  if (args.staleAfterDays) next.freshness.staleAfterDays = Number(args.staleAfterDays);
  if (args.freshnessStatus === "validated") next.freshness.lastPulledAt = next.updatedAt;

  const unlockable = canUnlock(next, formulas);
  next.status = unlockable && args.unlockBy ? "unlocked" : "blocked";
  next.unlockDecision = {
    ...next.unlockDecision,
    status: unlockable && args.unlockBy ? "unlocked" : "locked",
    decidedBy: unlockable && args.unlockBy ? args.unlockBy : null,
    decidedAt: unlockable && args.unlockBy ? next.updatedAt : null,
    rationale: unlockable
      ? "All Treasury connector, reuse, schema, formula and freshness gates are validated."
      : "Financial Pulse remains gated until connector, reuse, schema, formulas and freshness gates pass."
  };

  return next;
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const manifest = buildManifest(args);
    const output = JSON.stringify(manifest, null, 2);

    if (args.dryRun) {
      console.log(output);
      return;
    }

    const outPath = path.resolve(args.out ?? defaultManifestPath);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${output}\n`, "utf8");
    console.log(`Wrote ${path.relative(root, outPath)} with status ${manifest.status}.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error(usage());
    process.exit(2);
  }
}

main();
