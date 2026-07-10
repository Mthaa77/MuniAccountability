# Frontend Guide

This document explains how the frontend is organized and how developers should add new UI without breaking the shell, mobile view or workflow modules.

## Framework

The frontend uses Next.js App Router with React components.

Important root files:

```txt
app/layout.tsx
app/page.tsx
components/app-shell.tsx
```

## App shell

The app shell lives in:

```txt
components/app-shell.tsx
```

It controls:

- desktop sidebar
- mobile menu sheet
- command search modal
- topbar actions
- source health pill
- page transition indicator
- global Ask MuniAtlas assistant

When changing navigation, update `navGroups` in `components/app-shell.tsx`.

When adding a key workflow page, add it to:

1. sidebar `navGroups`,
2. `quickActions` if it should appear in command search,
3. footer links if it supports evidence trust or review.

## Page structure

Most pages follow this pattern:

```tsx
export default function PageName() {
  return (
    <div className="atlas-page-stack">
      <AtlasHero ... />
      <section>...</section>
    </div>
  );
}
```

For workflow-heavy pages, use a more specific wrapper:

```txt
atlas-workflow-console
atlas-admin-console
```

## Atlas primitives

Reusable premium presentation components live in:

```txt
components/atlas/foundation.tsx
```

Useful primitives include:

- `AtlasHero`
- `AtlasMetricTile`
- `AtlasStatusPill`
- `AtlasEvidenceChip`

Prefer these before creating new hero/metric/card structures.

## Workflow components

Current premium workflow components:

```txt
components/atlas/free-assistant.tsx
components/atlas/action-studio.tsx
components/atlas/evidence-attachment-drawer.tsx
components/atlas/agsa-review-desk.tsx
```

These are not generic UI components. They are product modules tied to the municipal accountability workflow.

## UI primitives

Generic primitives live in:

```txt
components/ui.tsx
components/ui/dialog.tsx
components/ui/sheet.tsx
components/ui/command.tsx
components/ui/feedback.tsx
```

Use these for base elements such as badges, modals, sheets and command menus.

## API usage from frontend

Use:

```txt
lib/client-api.ts
```

Example:

```ts
const payload = await apiGet<{ actions?: DraftAction[] }>("/v1/actions/drafts");
```

Do not hardcode `/api/v1` in components. Use `/v1` and let `client-api` normalize it.

## Client component guidance

Use `"use client"` only when the component needs:

- state
- effects
- event handlers
- browser APIs
- API calls from UI interactions

Keep static pages as server components when possible.

## Button system

Final button styling is centralized in:

```txt
components/atlas/atlas-button-system.css
```

Preferred classes:

```txt
primary-action
secondary-action
text-action
icon-button
```

Avoid inventing new button classes unless there is a strong reason.

## Responsive behavior

Mobile and desktop behavior is protected by final CSS layers. Before changing layout classes, read:

```txt
docs/CSS_LAYERS.md
```

Key rule: do not remove final shell/device CSS layers unless you manually test desktop, laptop, mobile and phone desktop-site mode.

## Adding a new page

1. Add `app/your-route/page.tsx`.
2. Use `AtlasHero` and established card/grid patterns.
3. Add route to `components/app-shell.tsx` if it should be navigable.
4. Add API helpers in `lib` if needed.
5. Add or update docs.
6. Verify desktop and mobile layouts.

## Manual frontend QA checklist

After frontend changes, test:

- sidebar desktop navigation
- mobile menu navigation
- topbar actions
- command search
- Ask MuniAtlas drawer
- desktop/laptop homepage
- mobile homepage
- `/actions`
- `/admin/agsa-review`
- `/sources`
- `/search`

## Common pitfalls

- Adding global CSS too early in the import order and expecting it to win.
- Moving Atlas components without updating imports.
- Forgetting mobile “Desktop site” mode on phones.
- Adding UI claims that are not source-backed.
- Hardcoding `/api/v1` instead of using `/v1` through `client-api`.
