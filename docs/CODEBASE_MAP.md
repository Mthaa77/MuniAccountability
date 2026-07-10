# Codebase Map

This document explains where code lives and how the repository is organized.

## Root folders and files

```txt
app/                    Next.js app router pages, route handlers and layout
components/             Shared UI, interactive workflow components and Atlas design system
components/atlas/       Premium MuniAtlas-specific components and CSS layers
data/                   Generated/local prototype data stores
lib/                    Domain data, API helpers, stores, search, validation and typed models
docs/                   Developer documentation and platform guides
public/                 Public/static assets where applicable
CODEX_CONTINUATION.md   Detailed continuation handoff for Codex and future development
README.md               Project overview and local setup
```

## App folder

```txt
app/layout.tsx
```

Global root layout. Imports global CSS layers and renders:

- `PrototypeNotice`
- `AppShell`
- page children

Do not reorder CSS imports casually. Final imports are layout authority layers.

```txt
app/api/v1/[...resource]/route.ts
```

Main prototype API route. This powers most `/v1/*` backend behavior including municipalities, actions, AGSA routes, assistant query, review decisions, readiness and search.

Important app routes:

```txt
app/page.tsx                         Command centre home
app/actions/page.tsx                  Action Board, Action Studio and Evidence Intake Desk
app/admin/page.tsx                    Production/readiness admin gate
app/admin/agsa-review/page.tsx        AGSA Review Cockpit
app/admin/data-quality/page.tsx       Source/data quality checks
app/search/page.tsx                   Source-locked evidence search
app/sources/page.tsx                  Source library
app/sources/[documentId]/page.tsx     Source document viewer
app/intervention-queue/page.tsx       Intervention queue
app/municipalities/page.tsx           Municipality listing
app/municipalities/[id]/page.tsx      Municipality dossier
app/municheck/page.tsx                Public-safe MuniCheck list
app/municheck/[municipalityId]/page.tsx Public-safe municipality profile
app/munidata/page.tsx                 API/export entry point
app/docs-api/page.tsx                 Human-readable API docs page
```

## Components folder

```txt
components/app-shell.tsx
```

Global product shell:

- sidebar navigation
- mobile menu sheet
- command search
- topbar
- page transition loader
- `FreeAssistant`

```txt
components/interactive.tsx
```

Legacy and shared interactive widgets. Some newer workflow modules have been extracted to `components/atlas`.

```txt
components/ui.tsx
components/ui/*
```

Reusable UI primitives such as badges, dialog, sheet, command UI and feedback/skeleton helpers.

## Atlas components

```txt
components/atlas/foundation.tsx
```

Reusable Atlas presentation primitives such as hero, status pills, metric tiles and evidence chips.

```txt
components/atlas/free-assistant.tsx
```

Step 1 free source-locked assistant drawer.

```txt
components/atlas/action-studio.tsx
```

Step 2 Action Studio workflow component.

```txt
components/atlas/evidence-attachment-drawer.tsx
```

Step 3 Evidence Intake Desk and evidence drawer.

```txt
components/atlas/agsa-review-desk.tsx
```

Step 4 AGSA Review Cockpit.

## Lib folder

```txt
lib/types.ts
```

Primary domain model types. Start here when adding data fields.

```txt
lib/pilot-data.ts
```

Typed prototype data powering AGSA, municipality, queue, source, findings and workflow examples.

```txt
lib/client-api.ts
```

Frontend API helper. Normalizes `/v1/foo` to `/api/v1/foo`.

```txt
lib/source-search.ts
```

Source-locked search and assistant answer logic.

```txt
lib/draft-action-store.ts
```

Local JSON draft action persistence.

```txt
lib/agsa-review-store.ts
```

Local AGSA review decision persistence.

```txt
lib/production-evidence.ts
```

Production evidence/readiness gate definitions.

## Data folder

Local JSON prototype stores live under:

```txt
data/agsa/generated/
```

These are not production stores. Treat them as deterministic prototype persistence for demo and testing.

## Safe organization strategy

The repo currently has many imports across routes and components. To avoid breakage:

- Do not physically move source files unless you also update every import and run `npm run build`.
- Prefer adding folder-level README files before restructuring.
- When consolidating CSS, move one layer at a time and verify mobile and desktop.
- Keep `components/atlas` as the home for premium MuniAtlas-specific UI.
- Keep domain logic in `lib` rather than components.

## Suggested future folder cleanup

Once build verification is stable, consider this long-term structure:

```txt
components/
  atlas/
    workflows/
      assistant/
      actions/
      evidence/
      agsa-review/
    shell/
    primitives/
    styles/
  ui/
lib/
  api/
  data/
  stores/
  search/
  readiness/
  types/
docs/
  architecture/
  product/
  operations/
```

Do not jump to this in one large commit. Move gradually with tests.
