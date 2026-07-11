# Contributing Guide

This guide explains how to contribute safely to MuniAccountability Command.

## Before you start

Read:

```txt
docs/README.md
docs/CODEBASE_MAP.md
docs/CSS_LAYERS.md
docs/TESTING_STRATEGY.md
CODEX_CONTINUATION.md
```

## Local setup

```bash
npm install
npm run dev
```

## Verification before committing

Run:

```bash
npm run test:institutional
npm run lint
npm run build
```

Before promoting or merging, run the full verification chain:

```bash
npm run verify
```

## Development rules

### 1. Preserve the trust rule

No proof, no public claim.

Internal workflow notes are not exposed publicly.

Do not add public-facing claims unless source, confidence and review state are clear.

### 2. Use existing architecture

- Pages live in `app`.
- Product-specific components live in `components/atlas`.
- Generic primitives live in `components/ui`.
- Domain types and helpers live in `lib`.
- Docs live in `docs`.

### 3. Avoid risky file moves

This repo has many imports. Do not move files casually.

If moving a file:

1. update every import
2. run build
3. manually test key pages
4. update docs

### 4. Use the API helper

Frontend components should call `/v1/*` through:

```txt
lib/client-api.ts
```

Do not hardcode `/api/v1` in components.

### 5. Respect CSS authority layers

Before editing global CSS, read:

```txt
docs/CSS_LAYERS.md
```

Final layers protect desktop, mobile and phone Desktop site mode.

### 6. Keep buttons consistent

Use:

```txt
primary-action
secondary-action
text-action
icon-button
```

Do not create one-off button styles unless required.

### 7. Update documentation

If you change any of these, update docs:

- API routes
- workflow modules
- navigation
- CSS layer strategy
- persistence behavior
- production readiness logic
- assistant/source-lock behavior
- test coverage or QA expectations

### 8. Keep institutional tests current

If you add a critical workflow, API family, public route, layout authority layer or documentation expectation, add or update a matching verification script under:

```txt
scripts/verify-*.mjs
```

Then wire it into `package.json` and `.github/workflows/verify.yml`.

## Manual QA checklist

Test:

```txt
/
/actions
/admin
/admin/agsa-review
/sources
/search
/intervention-queue
/municheck
```

Device modes:

- laptop desktop
- large desktop
- phone mobile
- phone Desktop site mode

Interactions:

- sidebar navigation
- mobile menu
- command search
- Ask MuniAtlas
- Action Studio modal
- Evidence Intake drawer
- AGSA Review decision save

## Prototype boundaries

This is not production-ready yet.

Known gaps:

- local JSON persistence
- no production RBAC
- no evidence file upload storage
- hardcoded prototype reviewer in AGSA Review Cockpit
- source ingestion pipeline is not productionized

## Recommended next work

Follow:

```txt
docs/NEXT_STEPS.md
```

The next major product build is Step 5: Production Readiness Command Centre.
