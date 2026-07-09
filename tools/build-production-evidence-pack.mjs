#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const preflightTool = path.join(root, "tools", "run-production-readiness-preflight.mjs");

function parseArgs(argv) {
  const args = { outDir: null };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--out-dir") {
      if (!argv[index + 1] || argv[index + 1].startsWith("--")) {
        throw new Error("--out-dir requires a destination directory.");
      }

      args.outDir = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function usage() {
  return [
    "Usage: node tools/build-production-evidence-pack.mjs [--out-dir path]",
    "",
    "Builds a local operator evidence pack from the production readiness preflight.",
    "Without --out-dir, writes the pack JSON to stdout."
  ].join("\n");
}

function runPreflight() {
  return JSON.parse(execFileSync(process.execPath, [preflightTool], {
    cwd: root,
    encoding: "utf8"
  }));
}

function basePack(preflight) {
  return {
    schemaVersion: "production-evidence-pack-v0.1",
    generatedAt: new Date().toISOString(),
    productionReady: preflight.productionReady,
    summary: preflight.summary,
    preflight,
    intakeRequirements: [
      {
        gateId: "mfma_annexure_mapping",
        title: "Official MFMA annexure intake",
        status: preflight.gates.find((gate) => gate.id === "mfma_annexure_mapping")?.status ?? "unknown",
        requiredEvidence: [
          "Official AGSA MFMA municipality-level audit outcome annexure exported to CSV or JSON.",
          "Start from docs/templates/mfma-annexure-template.csv when preparing a local reviewed input.",
          "Columns: municipality_code, municipality_name, financial_year, audit_outcome, movement, source_document, source_page.",
          "Source filename, row count and checksum retained in the import manifest.",
          "Reviewer resolution notes for unmatched or excluded rows."
        ],
        safeValidationCommands: [
          "node tools/prepare-production-gate-inputs.mjs",
          "python tools/import-mfma-annexures.py path\\to\\official-mfma-annexure.csv --dry-run",
          "python tools/import-mfma-annexures.py path\\to\\official-mfma-annexure.csv --out data\\agsa\\generated\\annexure-import-manifest.local.json",
          "npm run test:annexure-importer",
          "npm run test:annexure-overlay"
        ],
        promotionCommand: "python tools/import-mfma-annexures.py path\\to\\official-mfma-annexure.csv",
        promotionGuardrail: "Only promote after the dry-run manifest shows expected row counts and unmatched rows are reviewed."
      },
      {
        gateId: "treasury_financial_pulse_unlock",
        title: "Treasury / Municipal Money validation intake",
        status: preflight.gates.find((gate) => gate.id === "treasury_financial_pulse_unlock")?.status ?? "unknown",
        requiredEvidence: [
          "Successful connector probe timestamp and status.",
          "Reuse and display permission evidence URL or reviewed internal reference.",
          "Start from docs/templates/treasury-schema-snapshot-template.json when preparing a schema snapshot.",
          "Schema snapshot JSON covering every Financial Pulse formula field.",
          "Validated formula versions with reviewed denominator, period alignment and display gate decisions.",
          "Freshness SLA: expected cadence, stale-after threshold and latest successful pull timestamp."
        ],
        safeValidationCommands: [
          "node tools/prepare-production-gate-inputs.mjs",
          "node tools/build-treasury-validation-manifest.mjs --schema-snapshot path\\to\\schema.json --connector-status validated --dry-run",
          "node tools/build-treasury-validation-manifest.mjs --schema-snapshot path\\to\\schema.json --out data\\treasury\\validation\\municipal-money-validation-manifest.local.json",
          "npm run test:treasury-validation",
          "npm run test:treasury-manifest-builder"
        ],
        promotionCommand: "Review and intentionally write data\\treasury\\validation\\municipal-money-validation-manifest.json only after every Treasury gate passes.",
        promotionGuardrail: "Financial Pulse must remain gated while any connector, reuse, schema, formula or freshness check is incomplete."
      },
      {
        gateId: "durable_workflow_store",
        title: "Durable workflow database intake",
        status: preflight.gates.find((gate) => gate.id === "durable_workflow_store")?.status ?? "unknown",
        requiredEvidence: [
          "Hosted PostgreSQL-compatible database provider and tenant model selected.",
          "Provider credentials configured outside the repository.",
          "db/workflow/001_workflow_persistence.sql applied successfully.",
          "Start from docs/templates/workflow-migration-evidence-template.md when recording migration evidence.",
          "Fresh workflow backfill manifest generated from local JSON stores.",
          "Parity smoke evidence for review decisions, draft actions, transitions and evidence attachments."
        ],
        safeValidationCommands: [
          "node tools/prepare-production-gate-inputs.mjs",
          "node tools/build-workflow-backfill-manifest.mjs",
          "npm run test:workflow-migration",
          "npm run test:workflow-persistence"
        ],
        promotionCommand: "Switch workflowPersistence.activeProvider to database only after migration, backfill and parity checks pass.",
        promotionGuardrail: "Do not mark workflowPersistence.productionReady true while local_json remains active."
      }
    ],
    releaseChecklist: [
      "Run node tools/run-production-readiness-preflight.mjs and confirm productionReady is true.",
      "Run npm run verify.",
      "Attach official source evidence and generated local artifacts to the release review.",
      "Confirm Financial Pulse no longer exposes pending_validation only after Treasury unlock is approved.",
      "Confirm workflow writes use the durable store before multi-user or tenant pilots."
    ]
  };
}

function toMarkdown(pack) {
  const lines = [
    "# Production evidence pack",
    "",
    `Generated at: ${pack.generatedAt}`,
    "",
    `Production ready: ${pack.productionReady}`,
    "",
    pack.summary,
    ""
  ];

  for (const requirement of pack.intakeRequirements) {
    lines.push(`## ${requirement.title}`);
    lines.push("");
    lines.push(`Status: ${requirement.status}`);
    lines.push("");
    lines.push("Required evidence:");
    for (const item of requirement.requiredEvidence) {
      lines.push(`- ${item}`);
    }
    lines.push("");
    lines.push("Safe validation commands:");
    for (const command of requirement.safeValidationCommands) {
      lines.push(`- \`${command}\``);
    }
    lines.push("");
    lines.push(`Promotion command: ${requirement.promotionCommand}`);
    lines.push("");
    lines.push(`Guardrail: ${requirement.promotionGuardrail}`);
    lines.push("");
  }

  lines.push("## Release checklist");
  lines.push("");
  for (const item of pack.releaseChecklist) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function writePack(outDir, pack) {
  const absoluteOutDir = path.resolve(root, outDir);
  fs.mkdirSync(absoluteOutDir, { recursive: true });

  const files = {
    "production-readiness-preflight.json": JSON.stringify(pack.preflight, null, 2),
    "production-evidence-pack.json": JSON.stringify(pack, null, 2),
    "production-evidence-checklist.md": toMarkdown(pack)
  };

  for (const [filename, body] of Object.entries(files)) {
    fs.writeFileSync(path.join(absoluteOutDir, filename), `${body.trimEnd()}\n`);
  }

  return Object.keys(files).map((filename) => path.relative(root, path.join(absoluteOutDir, filename)));
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(usage());
    return;
  }

  const pack = basePack(runPreflight());

  if (args.outDir) {
    const files = writePack(args.outDir, pack);
    console.log(`Production evidence pack written:\n${files.map((file) => `- ${file}`).join("\n")}`);
    return;
  }

  process.stdout.write(`${JSON.stringify(pack, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
