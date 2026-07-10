# Components Folder Guide

This folder contains shared React components.

## Major areas

```txt
app-shell.tsx         Global product shell: sidebar, topbar, command search, mobile menu and assistant mount
interactive.tsx       Legacy/shared interactive workflow widgets
atlas/                Premium MuniAtlas-specific components and CSS layers
ui.tsx                Shared UI helpers and labels
ui/                   Dialog, sheet, command, feedback and other primitives
```

## Component categories

### Product shell

```txt
components/app-shell.tsx
```

Controls the global frame of the app.

Edit this when changing:

- sidebar navigation
- topbar actions
- command search entries
- mobile menu content
- global assistant/page transition mounts

### Atlas product components

```txt
components/atlas/
```

Use this folder for premium MuniAtlas-specific product workflows and layout components.

### Generic UI primitives

```txt
components/ui.tsx
components/ui/*
```

Use these for generic primitives such as badges, dialogs, sheets and command menus.

## Rule of thumb

If a component is specific to municipal accountability, evidence review, actions, AGSA workflows or MuniAtlas visual identity, put it under `components/atlas`.

If a component is generic and could be used in any app, put it under `components/ui`.

## Avoid

- Adding workflow logic to generic UI primitives.
- Adding global CSS from random component files.
- Creating one-off button styles instead of using `primary-action`, `secondary-action`, `text-action`, or `icon-button`.
