# Lib Folder Guide

This folder contains domain types, typed prototype data, search helpers, stores and production-readiness helpers.

## Important files

```txt
types.ts                   Primary domain model types
pilot-data.ts              Typed prototype data
client-api.ts              Frontend API helper
source-search.ts           Source-locked search and assistant answer logic
draft-action-store.ts      Local JSON draft action workflow store
agsa-review-store.ts       Local AGSA review decision store
production-evidence.ts     Production evidence/readiness gate model
```

## Types first

When adding or changing domain fields, start with:

```txt
lib/types.ts
```

Then update:

1. `lib/pilot-data.ts`
2. any relevant store file
3. API route handling
4. frontend component
5. docs

## Client API helper

Use:

```txt
lib/client-api.ts
```

Frontend components should call:

```ts
apiGet("/v1/sources")
apiPost("/v1/actions/drafts", payload)
```

Do not hardcode `/api/v1` in React components.

## Prototype stores

Current stores:

```txt
lib/draft-action-store.ts
lib/agsa-review-store.ts
```

These write to local JSON under:

```txt
data/agsa/generated/
```

This is prototype persistence only.

Production stores should add:

- tenant IDs
- authenticated actor IDs
- durable persistence
- audit events
- role checks
- validation on mutation payloads

## Search and assistant

```txt
lib/source-search.ts
```

This file is central to source-locked behavior.

Keep this rule intact:

> If no evidence supports the answer, refuse the claim.

## Production readiness

```txt
lib/production-evidence.ts
```

Defines production gates, release checklist and evidence requirements.

This should be expanded in Step 5.

## Avoid

- Putting React/UI code in `lib`.
- Adding untyped objects to `pilot-data.ts`.
- Bypassing source-locking logic for assistant answers.
- Treating local JSON stores as production-ready.
