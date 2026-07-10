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
WORKFLOW_STORE_PROVIDER=local_json
DISABLE_EXPENSIVE_JOBS=true
```

## Verification commands

Run these before shipping meaningful changes:

```bash
npm run lint
npm run build
```

If available, run the project verification chain:

```bash
npm run verify
```

Focused checks listed in README:

```bash
npm run typecheck
npm run test:production-readiness
npm run test:production-evidence
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
- Ask MuniAtlas open/close
- Ask MuniAtlas follow-up question
- Action Studio modal open
- Evidence Intake drawer open
- AGSA Review Cockpit decision save
- page transition loader on link clicks

## Working conventions

### Source-backed behavior

Do not add public claims without source/review/confidence context.

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

- Improve Step 5 Production Readiness Command Centre.
- Add tests for action/evidence/review API routes.
- Add file upload design for evidence.
- Add reviewer identity to AGSA decisions.
- Consolidate CSS layers carefully.

## What not to do first

- Do not move many files at once.
- Do not delete final CSS authority layers without testing.
- Do not wire paid AI without source-lock guardrails.
- Do not expose internal notes on public MuniCheck routes.
- Do not turn prototype scores into legal findings.
