# Repository Maintenance Guide

This guide explains how to keep the repository clean as the platform grows.

## Current organization strategy

The repo has been organized through documentation and folder-level guides instead of moving source files.

Reason:

- many imports cross between `app`, `components`, `components/atlas` and `lib`
- CSS import order is currently important
- moving files without local build verification could break functionality

## Current key folders

```txt
app/                    Next.js routes and API handler
components/             shared React components
components/atlas/       premium product components and CSS layers
lib/                    types, data, stores, source search and readiness helpers
docs/                   developer documentation
```

## Safe cleanup rules

### 1. Document before moving

Before reorganizing files, document the current structure and target structure.

### 2. Move one feature at a time

Do not reorganize all Atlas workflows in a single commit.

Safe order:

1. Assistant
2. Action Studio
3. Evidence Intake
4. AGSA Review
5. shell/navigation
6. CSS consolidation

### 3. Preserve public routes

Do not rename app routes unless you also update:

- navigation
- command search
- docs
- any hardcoded links

### 4. Preserve API behavior

Do not split `app/api/v1/[...resource]/route.ts` until tests exist.

### 5. Protect final CSS layers

Do not remove:

```txt
atlas-compact-desktop-rescue.css
atlas-desktop-shell-fix.css
atlas-device-polish.css
atlas-button-system.css
```

until a verified CSS consolidation pass replaces them.

## Recommended future structure

A long-term structure could be:

```txt
components/
  atlas/
    shell/
      app-shell-nav.tsx
      app-shell-topbar.tsx
    primitives/
      atlas-hero.tsx
      atlas-metric.tsx
      atlas-status.tsx
    workflows/
      assistant/
      actions/
      evidence/
      agsa-review/
    styles/
      tokens.css
      shell.css
      components.css
      workflows.css
      responsive.css
      motion.css
  ui/
lib/
  api/
  data/
  stores/
  search/
  readiness/
  types/
docs/
  product/
  architecture/
  operations/
```

## Cleanup checklist for each moved file

When moving a file:

```txt
[ ] Update imports
[ ] Run npm run build
[ ] Run npm run lint
[ ] Test affected route
[ ] Test mobile
[ ] Test desktop
[ ] Update docs
[ ] Commit with a narrow message
```

## Documentation maintenance

Update docs when changing:

- routes
- API endpoints
- workflow modules
- CSS layers
- persistence model
- production readiness logic
- navigation
- assistant behavior
- public safety rules

## Git workflow recommendation

As the project grows, move away from direct commits to `main`.

Recommended flow:

```bash
git checkout -b feature/short-description
# make changes
npm run lint
npm run build
git push origin feature/short-description
# open PR
```

Use the PR template in `.github/pull_request_template.md`.

## Labels worth creating later

```txt
type:feature
type:bug
type:docs
type:design-system
type:workflow
type:api
type:deployment
area:assistant
area:actions
area:evidence
area:agsa-review
area:css
area:auth
area:persistence
```
