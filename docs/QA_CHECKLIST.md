# QA Checklist

Use this checklist before shipping visual, workflow or API changes.

## Local commands

```bash
npm install
npm run lint
npm run build
```

Run deterministic institutional checks:

```bash
npm run verify
npm run test:institutional
npm run typecheck
npm run test:production-readiness
npm run test:production-evidence
```

Run browser E2E checks for release candidates, major UI changes and workflow changes:

```bash
npm run test:e2e:install
npm run test:e2e
```

## Core route smoke test

Open each route and confirm it renders without console errors:

```txt
/
/actions
/admin
/admin/agsa-review
/admin/data-quality
/intervention-queue
/municipalities
/sources
/search
/municheck
/munidata
/docs-api
/disclaimer
```

## Device test matrix

Test every major release in:

| Device mode | What to verify |
| --- | --- |
| Laptop desktop | sidebar, topbar, hero, cards and no horizontal overflow |
| Large desktop | content max-width, readable hero size, premium spacing |
| Phone mobile | stacked layout, floating buttons, drawer usability |
| Phone “Desktop site” | no tiny left-column layout, no broken hero text |

## Navigation checks

- Sidebar links work.
- Mobile Menu opens and closes.
- Command search opens with Ctrl/Cmd + K.
- Command search results navigate correctly.
- AGSA Review Cockpit is visible under Evidence.
- Topbar buttons do not overflow.

## Assistant checks

Route: global

- Floating Ask MuniAtlas button is visible.
- Drawer opens and closes.
- Starter prompts work.
- Follow-up questions include continuity context.
- Unsupported claims are refused.
- Citations/results appear when evidence exists.
- Mobile drawer remains usable.

## Action Studio checks

Route:

```txt
/actions
```

Verify:

- Action Studio section renders.
- Workflow stats render as cards.
- Search and severity filter work.
- Queue card opens modal.
- Modal fields are readable.
- Status transition buttons work.
- Evidence attachment form warns when action is not saved.
- Source chain links render.
- Mobile modal is full-screen and usable.

## Evidence Intake checks

Route:

```txt
/actions
```

Verify:

- Evidence Intake Desk renders.
- Intake filters work.
- Search works.
- Proof packet meter displays.
- Drawer opens.
- Quick proof templates fill label/note.
- Source preview appears.
- Attach evidence requires a label.
- Existing attachments display.

## AGSA Review Cockpit checks

Route:

```txt
/admin/agsa-review
```

Verify:

- Review queue renders.
- Selecting queue item updates source viewer.
- Filters work.
- Publish safety score displays.
- Reviewer gates display passed/blocked states.
- Rationale templates populate text.
- Correction field presets work.
- Accept, Needs Correction and Exclude buttons save decisions.
- Decision preview changes based on saved state.

## Browser E2E coverage

The Playwright suite currently covers:

- command shell navigation
- command search to AGSA Review Cockpit
- mobile menu navigation
- assistant source-lock refusal
- source-backed assistant prompt
- Action Studio visibility
- Evidence Intake visibility
- AGSA Review Cockpit governance controls
- public MuniCheck safety boundary

Run it with:

```bash
npm run test:e2e
```

The dedicated CI workflow is:

```txt
.github/workflows/e2e.yml
```

## Layout checks

Watch for:

- headings breaking letter-by-letter
- huge blank space on desktop
- content squeezed into a narrow column
- buttons overlapping content
- topbar overflow
- sidebar hidden on real desktop
- mobile menu hidden on mobile

If any layout issue appears, inspect:

```txt
docs/CSS_LAYERS.md
components/atlas/atlas-compact-desktop-rescue.css
components/atlas/atlas-desktop-shell-fix.css
components/atlas/atlas-device-polish.css
components/atlas/atlas-button-system.css
```

## Public-safety checks

Public pages must not expose:

- internal action notes
- reviewer-only comments
- restricted evidence
- unsupported allegations

Public pages should show source/review/confidence context where applicable.

## Deployment checks

After deployment:

- confirm Vercel build completed beyond container initialization
- open production URL
- test homepage
- test `/actions`
- test `/admin/agsa-review`
- test mobile and desktop
- run or trigger E2E checks for release candidates

If Vercel fails with `sts_credentials_fetch_failed`, check Vercel/GitHub integration and project credentials before debugging app code.
