# Atlas Design System

The visual identity of MuniAccountability Command is the Atlas design system.

The intended product feel is:

- premium
- institutional
- calm
- readable
- evidence-first
- serious enough for public-sector stakeholders

## Visual principles

1. **Readable before decorative**  
   Never sacrifice text clarity for visual effects.

2. **Evidence-first hierarchy**  
   Source state, review state and confidence should be visible.

3. **Institutional warmth**  
   The app uses emerald, gold, clay and warm whites instead of cold SaaS blues.

4. **Premium restraint**  
   Shadows, gradients and motion should feel expensive, not noisy.

5. **Mobile and desktop parity**  
   The experience should feel intentional on phones, laptops and desktop monitors.

## Core colors

The current palette is managed through CSS variables across Atlas CSS layers.

Common color concepts:

```txt
emerald       primary institutional action color
gold          emphasis, review, premium highlights
clay          risk, blocker and caution contexts
warm white    workspace/card surfaces
dark green    sidebar and command shell
```

Important final button variables live in:

```txt
components/atlas/atlas-button-system.css
```

## Typography

Typography rules are mainly in:

```txt
components/atlas/atlas-type.css
components/atlas/atlas-elegance.css
```

The final system uses locally bundled Manrope Variable for interface text and Newsreader Variable for selective editorial emphasis. The local font packages avoid runtime font requests and layout shifts. Keep headings confident but avoid letter-by-letter breaking.

Important guidance:

- keep headings readable at every breakpoint
- avoid huge landing-page hero text on workflow-heavy screens
- preserve `.eyeless` uppercase labels, but never verticalize them accidentally

## Buttons

Final button system:

```txt
components/atlas/atlas-button-system.css
```

Use these classes:

```txt
primary-action      main CTA
secondary-action    supporting action
text-action         low-emphasis link/action
icon-button         circular icon action
glass-action        topbar/button variant
```

The button system also styles:

- assistant prompt buttons
- evidence template buttons
- AGSA rationale buttons
- status buttons
- danger/exclude buttons
- floating Menu and Ask MuniAtlas buttons

Do not invent button styling unless the current classes cannot support the interaction.

## Cards and panels

Use existing Atlas card conventions:

```txt
AtlasMetricTile
workflow-principle-card
action-studio-panel
evidence-action-card
agsa-source-card
panel
atlas-tile
```

Cards should generally have:

- visible border
- warm white or cream background
- soft shadow
- strong heading
- subdued body copy
- clear status/pill area

## Hero sections

Prefer `AtlasHero` from:

```txt
components/atlas/foundation.tsx
```

Hero sections should explain:

- what this page does
- why it matters
- what evidence/trust state applies

Avoid turning every workflow screen into a giant marketing page.

## Navigation

Navigation lives in:

```txt
components/app-shell.tsx
```

Desktop sidebar:

- dark institutional surface
- grouped sections
- active item styling
- status card
- trust rule footer

Mobile navigation:

- slide-out sheet
- same content as sidebar
- floating Menu button

When adding important pages, update the sidebar and command search together.

## Motion

Motion lives in:

```txt
components/atlas/atlas-motion.css
components/atlas/page-transition.tsx
```

Motion should be subtle:

- soft rise
- slide-in drawers
- modal bloom
- route loading pill
- hover lift

Always preserve reduced-motion support.

## Responsive design

Final responsive authority layers:

```txt
components/atlas/atlas-compact-desktop-rescue.css
components/atlas/atlas-desktop-shell-fix.css
components/atlas/atlas-device-polish.css
components/atlas/atlas-elegance.css
```

These protect:

- phone mobile view
- phone desktop-site view
- laptop desktop view
- large desktop view

Read [`CSS_LAYERS.md`](./CSS_LAYERS.md) before editing.

## Status and trust indicators

Use status pills, evidence chips and badges consistently.

Common states:

```txt
healthy
watch
risk
under_review
locked
pending
reviewed
```

Avoid using color alone. Pair color with labels.

## Public-safety UI

Any public-facing output should show or imply:

- source state
- confidence state
- review state
- freshness/period where relevant

Internal action notes should not appear on public MuniCheck pages.

## Design debt

The system currently has many CSS layers because it was stabilized quickly across multiple devices. Future cleanup should consolidate carefully, one layer at a time.

Recommended future consolidation:

```txt
atlas-tokens.css
atlas-shell.css
atlas-components.css
atlas-workflows.css
atlas-responsive.css
atlas-motion.css
```

Do not consolidate without visual regression testing.
