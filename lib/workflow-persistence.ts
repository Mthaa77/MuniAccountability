import "server-only";

import path from "node:path";

export type WorkflowPersistenceProvider = {
  id: "local_json" | "database";
  label: string;
  status: "active" | "not_configured";
  durability: "prototype_local" | "production_durable";
  storePaths: string[];
  limitations: string[];
  migrationGates: string[];
};

const generatedDataRoot = path.join(process.cwd(), "data", "agsa", "generated");

export const workflowPersistence = {
  activeProvider: "local_json",
  productionReady: false,
  providers: [
    {
      id: "local_json",
      label: "Local JSON workflow store",
      status: "active",
      durability: "prototype_local",
      storePaths: [
        path.join(generatedDataRoot, "agsa-review-decisions.json"),
        path.join(generatedDataRoot, "draft-actions.json")
      ],
      limitations: [
        "Single-workspace writes only",
        "No tenant isolation",
        "No concurrent write protection",
        "No hosted backup or retention policy",
        "Suitable for prototype review and deterministic local tests only"
      ],
      migrationGates: [
        "Choose hosted database provider",
        "Create review decision and draft action tables",
        "Add tenant/user audit columns",
        "Backfill current JSON records",
        "Run API parity checks before disabling local JSON writes"
      ]
    },
    {
      id: "database",
      label: "Durable tenant workflow database",
      status: "not_configured",
      durability: "production_durable",
      storePaths: [],
      limitations: [],
      migrationGates: [
        "Provider credentials configured outside the repository",
        "Migrations applied",
        "Write path switched behind the store adapter",
        "Smoke tests verify review decisions, draft actions, transitions and evidence attachments"
      ]
    }
  ] satisfies WorkflowPersistenceProvider[]
};
