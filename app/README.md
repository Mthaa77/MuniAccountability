# App Folder Guide

This folder contains the Next.js App Router routes, layouts and API handlers.

## Important files

```txt
layout.tsx
```

Root layout. Imports global CSS layers and renders the product shell.

```txt
page.tsx
```

Main command centre/homepage.

```txt
api/v1/[...resource]/route.ts
```

Main prototype API route for the `/v1/*` API family.

## Important route groups

```txt
actions/             Action Board, Action Studio and Evidence Intake Desk
admin/               Production/admin/readiness screens
admin/agsa-review/   AGSA Review Cockpit
intervention-queue/  Priority queue
municipalities/      Municipality list and dossiers
sources/             Source library and source document viewer
search/              Source-locked search
municheck/           Public-safe profiles
munidata/            API/export entry point
docs-api/            Human-readable API documentation page
```

## Page conventions

Prefer this pattern:

```tsx
export default function Page() {
  return (
    <div className="atlas-page-stack">
      {/* hero */}
      {/* sections */}
    </div>
  );
}
```

Workflow-heavy pages may use:

```txt
atlas-workflow-console
atlas-admin-console
```

## Adding a new route

1. Create `app/your-route/page.tsx`.
2. Use Atlas components from `components/atlas/foundation.tsx` where possible.
3. Add navigation in `components/app-shell.tsx` if this route should be discoverable.
4. Add docs if the route is a product module.
5. Test desktop and mobile.

## API route caution

`api/v1/[...resource]/route.ts` is large and central. When adding API behavior:

- keep route matching clear
- validate payloads
- update `docs/API_REFERENCE.md`
- update types in `lib/types.ts`
- avoid mixing production-only behavior with demo mode without flags
