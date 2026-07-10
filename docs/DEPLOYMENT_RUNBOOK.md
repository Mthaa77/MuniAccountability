# Deployment Runbook

This runbook helps developers diagnose deployment issues and keep production/preview builds predictable.

## Current hosting target

The project is connected to Vercel through GitHub.

Known Vercel project metadata from the latest failed deployment check:

```txt
project name: muniaccountability-command-git
framework: nextjs
branch: main
target: production
```

## Important note about the latest observed Vercel failure

The latest checked deployment failed before the build started properly.

Observed deployment metadata:

```txt
state: ERROR
errorCode: sts_credentials_fetch_failed
errorStep: build-container-init
```

This points to a Vercel/platform credential or build-container initialization problem, not a TypeScript or Next.js code error. The build log tail only showed cloning starting and did not expose application build errors.

## First response when Vercel fails

1. Check whether Vercel reached the actual build command.
2. If the failure happens at `build-container-init`, investigate Vercel account/project/team authentication and credentials first.
3. If the failure reaches `npm run build`, inspect the TypeScript/Next.js error.
4. Do not assume a docs-only commit broke application code.

## Local verification before blaming Vercel

Run locally:

```bash
npm install
npm run lint
npm run build
```

If these pass locally and Vercel still fails at build-container init, treat it as a deployment environment issue.

## Vercel checks

Use the Vercel dashboard to verify:

- GitHub integration still has access to `Mthaa77/MuniAccountability`
- the project is linked to the correct repository
- team/project permissions are still valid
- environment variables are available
- build image/container initialization is not blocked
- no billing/account/security issue is preventing builds

## Environment variables

Default prototype/demo mode:

```env
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_REQUIRE_AUTH=false
WORKFLOW_STORE_PROVIDER=local_json
DISABLE_EXPENSIVE_JOBS=true
```

Production-prep variables may include Firebase/GCP settings. See:

```txt
.env.example
docs/FIREBASE_GCP_DEPLOYMENT.md
docs/COST_CONTROL.md
```

## Build command expectations

Check `package.json` for exact scripts. Common checks:

```bash
npm run lint
npm run typecheck
npm run build
npm run verify
```

## Manual post-deploy QA

After a successful Vercel deployment, manually test:

```txt
/
/actions
/admin
/admin/agsa-review
/sources
/search
/intervention-queue
/municheck
/munidata
/docs-api
```

Device checks:

- laptop desktop browser
- large desktop monitor
- phone mobile browser
- phone browser with “Desktop site” enabled

Workflow checks:

- open Ask MuniAtlas
- ask a follow-up question
- open Action Studio modal
- open Evidence Intake Drawer
- save an AGSA Review decision
- use command search
- open mobile navigation menu

## If a deployment fails after code changes

Check the failure type:

### TypeScript/build error

Fix the reported file and line. Most likely areas after recent work:

```txt
components/atlas/free-assistant.tsx
components/atlas/action-studio.tsx
components/atlas/evidence-attachment-drawer.tsx
components/atlas/agsa-review-desk.tsx
```

### CSS import/path error

Check `app/layout.tsx` import order and file paths.

### Route/runtime error

Check:

```txt
app/api/v1/[...resource]/route.ts
lib/client-api.ts
lib/types.ts
```

### Vercel build-container error

Check Vercel account/project/GitHub integration instead of application code.

## Recommended deployment policy

Before merging major feature work:

1. run local verification
2. push branch
3. wait for preview deployment
4. test preview manually
5. merge to main
6. test production deployment

This repo currently commits directly to `main`, but a PR workflow is recommended as the team grows.
