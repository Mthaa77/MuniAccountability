# Atlas Components and Styles

This folder contains the MuniAtlas-specific premium UI system.

It includes both React components and global CSS layers.

## Main React components

```txt
foundation.tsx                    Reusable Atlas hero, metric, status and evidence primitives
free-assistant.tsx                Step 1 source-locked assistant
action-studio.tsx                 Step 2 action workflow studio
evidence-attachment-drawer.tsx    Step 3 evidence intake desk
agsa-review-desk.tsx              Step 4 AGSA review cockpit
page-transition.tsx               Global route transition indicator
```

## Important CSS layers

Base and page layers:

```txt
atlas.css
atlas-pages.css
atlas-public.css
atlas-admin.css
atlas-workflow.css
atlas-components.css
atlas-type.css
```

Navigation and shell layers:

```txt
atlas-nav.css
atlas-cockpit.css
atlas-access.css
```

Motion and interaction layers:

```txt
atlas-motion.css
atlas-button-system.css
atlas-elegance.css
atlas-navigation-revamp.css
```

Workflow-specific layers:

```txt
atlas-assistant.css
atlas-assistant-mobile-fix.css
atlas-action-studio.css
atlas-action-studio-rescue.css
atlas-evidence-drawer.css
atlas-evidence-drawer-upgrade.css
atlas-agsa-review-desk.css
atlas-agsa-review-ultra.css
```

Responsive/layout authority layers:

```txt
atlas-compact-desktop-rescue.css
atlas-desktop-shell-fix.css
atlas-device-polish.css
atlas-elegance.css
atlas-navigation-revamp.css
```

## Import order warning

Global CSS is imported in `app/layout.tsx`.

Later imports override earlier imports.

The final authority layers are intentionally imported last:

```txt
atlas-compact-desktop-rescue.css
atlas-desktop-shell-fix.css
atlas-device-polish.css
atlas-button-system.css
atlas-elegance.css
atlas-navigation-revamp.css
```

Do not reorder without testing desktop, laptop, mobile and phone Desktop site mode.

## When adding a new Atlas workflow

1. Add the component in `components/atlas`.
2. Add CSS in `components/atlas/atlas-feature-name.css` only if existing layers cannot support it.
3. Import CSS in `app/layout.tsx` near related workflow files.
4. Add navigation in `components/app-shell.tsx` if needed.
5. Add documentation in `docs/WORKFLOW_MODULES.md`.

## Design guidance

- Use existing button classes.
- Use Atlas hero/metric/evidence primitives where possible.
- Keep text readable.
- Use warm, institutional surfaces.
- Make source/review/confidence state visible.
- Preserve mobile and desktop layouts.

## Refactor warning

This folder has grown through rapid iteration. A future cleanup can group files into:

```txt
components/atlas/
  shell/
  primitives/
  workflows/
  styles/
```

Do that gradually and run build after each move.
