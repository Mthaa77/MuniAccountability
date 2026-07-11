# Developer Onboarding

This guide helps a new developer or Codex session start safely.

## Prerequisites

- Node.js compatible with the project lockfile
- npm
- Git
- Access to the GitHub repository

## First local setup

```bash
git clone https://github.com/Mthaa77/MuniAccountability.git
cd MuniAccountability
npm install
npm run dev
```

Open:

```txt
http://127.0.0.1:3000
```

## Environment

Copy the example env file when preparing local config:

```bash
cp .env.example .env.local
```

Default prototype mode should remain cheap/demo-safe:

```env
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_REQUIRE_AUTH=false
MUNI_DEV_ROLE=admin
WORKFLOW_STORE_PROVIDER=local_json
DISABLE_EXPENSIVE_JOBS=true
```

Supported demo roles:

```txt
public
viewer
analyst
reviewer
admin
super_admin
```

Change `MUNI_DEV_ROLE` to inspect role-aware navigation and route access without enabling production authentication.

## Signed-session local testing

To test the real middleware session boundary, configure:

```env
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_REQUIRE_AUTH=true
MUNI_SESSION_SECRET=replace-with-at-least-32-random-characters
WORKFLOW_TENANT_ID=local-tenant
```

Generate a short-lived signed token:

```bash
npm run auth:dev-token -- --role reviewer
```

The command prints a `muni_session` cookie value. Treat it as a secret. Do not commit it or paste it into tickets.

See:

```txt
docs/AUTH_RBAC.md
```

## Verification commands

Run these before shipping meaningful changes:

```bash
npm run lint
npm run build
```

Run the project verification chain:

```bash
npm run verify
```

Focused institutional checks:

```bash
npm run typecheck
npm run test:institutional
npm run test:rbac-contracts
npm run test:production-readiness
npm run test:production-evidence
```

Browser release checks:

```bash
npm run test:e2e:install
npm run test:e2e
```

## Pulling latest changes safely

If you have no local work:

```bash
git checkout main
git pull origin main
npm install
npm run dev
```

If you have local work:

```bash
git status
git stash push -m "local work before pulling MuniAccountability updates"
git checkout main
git pull origin main
git stash pop
npm install
npm run dev
```

## Manual QA checklist

Test these routes:

```txt
/
/access-denied
/actions
/admin
/admin/agsa-review
/sources
/search
/intervention-queue
/municipalities
/municheck
/munidata
/docs-api
```

Test these device modes:

1. laptop desktop browser
2. large desktop monitor
3. phone normal mobile browser
4. phone browser with “Desktop site” enabled

Test these interactions:

- sidebar navigation
- mobile menu open/close
- command search
- role identity badge
- role-aware navigation visibility
- anonymous redirect to `/access-denied`
- viewer blocked from AGSA Review
- reviewer allowed into AGSA Review but blocked from readiness administration
- admin access to readiness administration
- Ask MuniAtlas open/close
- Ask MuniAtlas follow-up question
- Action Studio modal open
- Evidence Intake drawer open
- AGSA Review Cockpit decision save
- page transition loader on link clicks

## Working conventions

### Source-backed behavior

No proof, no public claim. Do not add public claims without source/review/confidence context.

### Access control

- Use permission checks instead of scattered role-name checks.
- Keep route policy centralized in `lib/auth/roles.ts`.
- Never trust role or tenant values from client headers or request bodies.
- UI hiding is not authorization. Middleware/API enforcement must remain active.
- Use least privilege.

### API calls

Use `lib/client-api.ts` from frontend code.

### Types first

When adding domain fields:

1. update `lib/types.ts`
2. update `lib/pilot-data.ts`
3. update API route/store if necessary
4. update UI
5. update docs

### CSS caution

Read [`CSS_LAYERS.md`](./CSS_LAYERS.md) before changing global Atlas CSS.

### Persistence caution

Local JSON stores are prototype-only. Do not treat them as production databases.

## Good first tasks

- Implement Firebase ID-token exchange and secure login/logout endpoints.
- Add tenant membership and role-claim management.
- Add session revocation and privileged-role MFA policy.
- Move workflow persistence to Firestore or Postgres.
- Add object-storage evidence uploads.
- Add security audit events.

## What not to do first

- Do not move many files at once.
- Do not delete final CSS authority layers without testing.
- Do not trust `x-muni-role` or client-provided tenant identifiers.
- Do not wire paid AI without source-lock guardrails.
- Do not expose internal notes on public MuniCheck routes.
- Do not turn prototype scores into legal findings.
