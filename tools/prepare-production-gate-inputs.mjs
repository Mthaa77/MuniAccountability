#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const defaultOutDir = "data/agsa/generated/production-gate-inputs.local";
const templates = [
  {
    id: "mfma_annexure_mapping",
    source: "docs/templates/mfma-annexure-template.csv",
    target: "mfma-annexure-input.csv"
  },
  {
    id: "treasury_financial_pulse_unlock",
    source: "docs/templates/treasury-schema-snapshot-template.json",
    target: "treasury-schema-snapshot.json"
  },
  {
    id: "durable_workflow_store",
    source: "docs/templates/workflow-migration-evidence-template.md",
    target: "workflow-migration-evidence.md"
  }
];

function parseArgs(argv) {
  const args = { outDir: defaultOutDir };

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
    "Usage: node tools/prepare-production-gate-inputs.mjs [--out-dir path]",
    "",
    "Copies production gate input templates into a local ignored workspace.",
    `Default output: ${defaultOutDir}`
  ].join("\n");
}

function buildManifest(outDir, copiedFiles) {
  return {
    schemaVersion: "production-gate-inputs-v0.1",
    generatedAt: new Date().toISOString(),
    outDir,
    status: "local_templates_only",
    warning: "These templates do not unlock production readiness. Replace sample values with reviewed official evidence before promotion.",
    copiedFiles,
    nextCommands: [
      "python tools/import-mfma-annexures.py data\\agsa\\generated\\production-gate-inputs.local\\mfma-annexure-input.csv --dry-run",
      "node tools/build-treasury-validation-manifest.mjs --schema-snapshot data\\agsa\\generated\\production-gate-inputs.local\\treasury-schema-snapshot.json --connector-status validated --dry-run",
      "node tools/build-production-evidence-pack.mjs --out-dir data\\agsa\\generated\\production-evidence-pack.local",
      "npm run verify"
    ]
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(usage());
    return;
  }

  const absoluteOutDir = path.resolve(root, args.outDir);
  fs.mkdirSync(absoluteOutDir, { recursive: true });

  const copiedFiles = templates.map((template) => {
    const sourcePath = path.join(root, template.source);
    const targetPath = path.join(absoluteOutDir, template.target);
    fs.copyFileSync(sourcePath, targetPath);

    return {
      gateId: template.id,
      template: template.source,
      path: path.relative(root, targetPath)
    };
  });
  const manifest = buildManifest(args.outDir, copiedFiles);
  const manifestPath = path.join(absoluteOutDir, "production-gate-inputs-manifest.json");
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`Production gate input templates written:\n${[...copiedFiles.map((file) => file.path), path.relative(root, manifestPath)].map((file) => `- ${file}`).join("\n")}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
