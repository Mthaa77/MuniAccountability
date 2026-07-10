# CSS Layers and Responsive Safety

This file is critical for anyone changing the visual system.

The app currently uses multiple global CSS files in `components/atlas`. They are imported in `app/layout.tsx`.

## Why there are many CSS files

The platform went through rapid design and device stabilization. Instead of risky component rewrites, several final CSS authority layers were added to preserve functionality while fixing:

- mobile readability
- phone “Desktop site” mode
- laptop desktop layout
- large desktop layout
- assistant drawer layout
- Action Studio layout
- Evidence Intake drawer layout
- AGSA Review Cockpit layout
- button consistency

This is not the ideal final CSS architecture, but it is currently safer than moving many files at once.

## Import order matters

CSS imported later wins the cascade.

The most important final imports are at the end of `app/layout.tsx`:

```txt
atlas-compact-desktop-rescue.css
atlas-desktop-shell-fix.css
atlas-device-polish.css
atlas-button-system.css
```

Do not reorder them without testing.

## Critical final layers

### `atlas-compact-desktop-rescue.css`

Protects phone browsers using “Desktop site” mode.

It:

- hides the fixed sidebar below desktop width
- uses floating Menu button
- prevents tiny column layouts
- prevents huge blank right-side spaces
- prevents headings from breaking letter-by-letter

### `atlas-desktop-shell-fix.css`

Restores real desktop/laptop shell behavior.

It:

- defines a proper two-column app layout
- fixes sidebar width
- fixes workspace width
- hides floating Menu button on desktop
- stabilizes topbar and hero sizing

### `atlas-device-polish.css`

Final cross-device visual polish.

It:

- improves desktop/laptop rhythm
- adds premium workspace background
- refines sidebar/topbar/card/hero spacing
- preserves mobile layout

### `atlas-button-system.css`

Final button authority layer.

It:

- upgrades primary/secondary/text/icon buttons
- styles workflow chips and prompt buttons
- styles floating buttons
- adds disabled and focus-visible states
- preserves mobile touch targets

## Workflow-specific layers

### Assistant

```txt
atlas-assistant.css
atlas-assistant-mobile-fix.css
```

The mobile fix prevents assistant prompts from collapsing into tiny columns.

### Action Studio

```txt
atlas-action-studio.css
atlas-action-studio-rescue.css
```

The rescue file fixes summary tiles, toolbar and mobile layout.

### Evidence Intake

```txt
atlas-evidence-drawer.css
atlas-evidence-drawer-upgrade.css
```

The upgrade file styles proof templates, proof meter, filters and source preview.

### AGSA Review Cockpit

```txt
atlas-agsa-review-desk.css
atlas-agsa-review-ultra.css
```

The ultra file styles governance gates, publish-safety score, correction presets and decision preview.

## Device breakpoints

Current important breakpoints:

```txt
max-width: 760px       true mobile
max-width: 1180px      compact desktop/tablet/phone desktop-site rescue
min-width: 1181px      real desktop/laptop
1181px to 1440px       laptop tuning
```

## Testing matrix before changing CSS

Always test:

1. Laptop desktop browser.
2. Large desktop monitor.
3. Phone normal mobile browser.
4. Phone with “Desktop site” enabled.
5. `/` homepage.
6. `/actions` Action Studio and Evidence Intake.
7. `/admin/agsa-review` AGSA Review Cockpit.
8. Assistant drawer open/closed.
9. Mobile menu open/closed.
10. Topbar actions and command search.

## Common CSS hazards

### Hazard: headings break letter-by-letter

Usually caused by overly narrow containers or `word-break`/grid collapse. Check final shell rules first.

### Hazard: desktop has huge empty right space

Usually caused by workspace/sidebar grid mismatch. Check `atlas-desktop-shell-fix.css`.

### Hazard: phone Desktop site view is squeezed

Check `atlas-compact-desktop-rescue.css`.

### Hazard: buttons look inconsistent

Check `atlas-button-system.css` is imported last.

### Hazard: mobile floating buttons cover content

Check bottom padding on workflow containers and floating button offsets.

## Recommended cleanup path

Do not delete all rescue CSS at once. Instead:

1. Pick one page.
2. Move rules into a cleaner canonical layer.
3. Run build.
4. Test all device modes.
5. Remove only the duplicated rules.

Long-term target:

```txt
atlas-tokens.css
atlas-shell.css
atlas-components.css
atlas-workflows.css
atlas-responsive.css
atlas-motion.css
```

Until that refactor is complete, keep the current final authority layers.
