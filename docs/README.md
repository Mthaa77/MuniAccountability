# MuniAccountability Documentation Hub

This folder is the developer knowledge base for **MuniAccountability Command**.

The project is a premium municipal accountability and oversight prototype built around one rule:

> No proof, no public claim.

Use this documentation hub when onboarding new developers, handing work to Codex, preparing production upgrades, or reviewing the system architecture.

## Recommended reading order

1. [`CODEBASE_MAP.md`](./CODEBASE_MAP.md)  
   Start here. Explains the folder layout and where important code lives.

2. [`ARCHITECTURE.md`](./ARCHITECTURE.md)  
   Explains the platform architecture, data flow and major modules.

3. [`FRONTEND_GUIDE.md`](./FRONTEND_GUIDE.md)  
   Explains the Next.js app shell, pages, workflow components and UI structure.

4. [`API_REFERENCE.md`](./API_REFERENCE.md)  
   Explains the prototype `/v1/*` API families and backend helpers.

5. [`WORKFLOW_MODULES.md`](./WORKFLOW_MODULES.md)  
   Explains Step 1 to Step 4: Assistant, Action Studio, Evidence Intake and AGSA Review Cockpit.

6. [`AUTH_RBAC.md`](./AUTH_RBAC.md)  
   Explains roles, permissions, signed sessions, middleware enforcement and the future Firebase exchange flow.

7. [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md)  
   Explains the Atlas visual system, buttons, cards, navigation and motion.

8. [`CSS_LAYERS.md`](./CSS_LAYERS.md)  
   Critical. Explains why CSS import order matters and how not to break desktop/mobile layouts.

9. [`TESTING_STRATEGY.md`](./TESTING_STRATEGY.md)  
   Defines the institutional test suite, signed-session RBAC checks, Playwright browser checks and readiness gates.

10. [`DEVELOPER_ONBOARDING.md`](./DEVELOPER_ONBOARDING.md)  
   Local setup, verification commands and manual QA checklist.

11. [`QA_CHECKLIST.md`](./QA_CHECKLIST.md)  
   Route, workflow, device, browser E2E and deployment checks before shipping.

12. [`DEPLOYMENT_RUNBOOK.md`](./DEPLOYMENT_RUNBOOK.md)  
   Vercel/deployment debugging, environment checks and post-deploy QA.

13. [`REPO_MAINTENANCE.md`](./REPO_MAINTENANCE.md)  
   Safe cleanup strategy, refactor rules and future folder organization.

14. [`NEXT_STEPS.md`](./NEXT_STEPS.md)  
   Implementation plan from Step 5 onward.

## Important root-level handoff file

The file below is the detailed Codex continuation file:

```txt
CODEX_CONTINUATION.md
```

It contains a longer history of what was built, known caveats, and the step-by-step roadmap.

## Test folder guide

Browser-level tests are documented in:

```txt
tests/README.md
```

The E2E suite lives in:

```txt
tests/e2e
playwright.config.mjs
.github/workflows/e2e.yml
```

## GitHub workflow helpers

Repository templates now exist for future team workflow:

```txt
.github/pull_request_template.md
.github/ISSUE_TEMPLATE/bug_report.md
.github/ISSUE_TEMPLATE/feature_request.md
```

Use them when the project moves from direct commits to branch/PR workflow.

## Verification gates

The main deterministic verification command is:

```bash
npm run verify
```

The institutional safety layer can also be run directly:

```bash
npm run test:institutional
```

The heavier browser E2E layer can be run with:

```bash
npm run test:e2e
```

It checks API contracts, workflow wiring, RBAC/session boundaries, public-safety rules, CSS authority layers, documentation completeness and browser-level user journeys.

## Documentation principles

- Keep docs close to reality.
- Update docs when routes, workflows, CSS layers, authentication or persistence paths change.
- Do not bury critical warnings in chat history. Add them here.
- Document prototype boundaries clearly.
- Treat public-claim safety and access control as product behavior, not just documentation.

## Current high-level status

| Area | Status | Notes |
| --- | --- | --- |
| Free Assistant | Built | Source-locked, frontend continuity, no paid AI yet |
| Action Studio | Built | Draft action creation, workflow transitions, evidence attachment |
| Evidence Intake Desk | Built | Dedicated evidence drawer, proof templates, source preview |
| AGSA Review Cockpit | Built | Review queue, decision persistence, publish-safety gates |
| Desktop/mobile shell | Stabilized | Multiple final CSS authority layers now protect layout |
| Institutional tests | Expanded | Node contract scripts plus signed-session Playwright browser checks |
| Auth/RBAC | Foundation built | Signed sessions, role policy, middleware and role-aware navigation; Firebase exchange and revocation still required |
| Durable persistence | Not complete | Local JSON remains active prototype write path |
| File evidence upload | Not complete | Evidence URL only, no object storage workflow yet |

## When adding new docs

Use short, focused files. Prefer:

```txt
docs/FEATURE_NAME.md
```

Avoid creating a single enormous document unless it is a release handoff.
