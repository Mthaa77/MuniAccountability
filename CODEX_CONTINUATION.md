# Codex Continuation Handoff: MuniAccountability Command

_Last updated: 2026-07-10_

This file is a working handoff for Codex or any future developer continuing the MuniAccountability Command codebase. It documents what was built, why it was built, the step plan, current progress, known risks, and next implementation priorities.

## 1. Project identity

**Repository:** `Mthaa77/MuniAccountability`  
**Default branch:** `main`  
**Application name:** `MuniAccountability Command`  
**Product direction:** `MuniAtlas Evidence Command` / `MuniAccountability Command`  
**Framework:** Next.js 14 app router  
**Current status:** Premium MVP/prototype. Strong workflow and evidence-system foundation, but not production-ready yet.

The app is being shaped into a municipal oversight and accountability command platform. It is not just a dashboard. The intended product feel is:

- institutional
- premium
- readable
- evidence-first
- source-locked
- workflow-oriented
- safe for public claims only after review

The design language moved away from generic glassmorphism and into a more serious command-system interface with opaque cards, a dark institutional sidebar, warm light workspace, emerald/gold/clay accents and stronger content hierarchy.

## 2. Core product rule

The platform follows this trust rule:

> No proof, no public claim.

Every public-facing statement should eventually be tied to:

1. a source document,
2. a citation or page reference,
3. a review state,
4. a confidence or publish-safety signal,
5. and a human decision where required.

This rule drives the assistant, source library, Action Studio, Evidence Intake Desk and AGSA Review Cockpit.

## 3. Existing backend/API capabilities

The main API route is:

```txt
app/api/v1/[...resource]/route.ts
```

It provides a flexible prototype API layer for municipal, AGSA, action, evidence, review and readiness workflows.

Important available routes include:

```txt
GET  /v1/municipalities
GET  /v1/municipalities/:id
GET  /v1/municipalities/:id/case-file
GET  /v1/municipalities/:id/audit-history
GET  /v1/municipalities/:id/financial-pulse
GET  /v1/municipalities/:id/actions
GET  /v1/municipalities/:id/sources

GET  /v1/intervention-queue
GET  /v1/actions
GET  /v1/actions/drafts
POST /v1/actions/drafts
PATCH /v1/actions/drafts/:id
POST /v1/actions/drafts/:id/transition
POST /v1/actions/drafts/:id/evidence

GET  /v1/agsa/documents
GET  /v1/agsa/documents/:id
GET  /v1/agsa/findings
GET  /v1/agsa/outcomes
GET  /v1/agsa/citations
GET  /v1/agsa/extraction-issues
GET  /v1/agsa/extract
GET  /v1/agsa/review-decisions
POST /v1/agsa/review-decisions

GET  /v1/sources
GET  /v1/data-freshness
GET  /v1/search?q=
POST /v1/assistant/query
GET  /v1/readiness
GET  /v1/production-readiness
GET  /v1/production-evidence
GET  /v1/production-evidence/reviews
```

### Important backend files

```txt
lib/client-api.ts
lib/source-search.ts
lib/draft-action-store.ts
lib/agsa-review-store.ts
lib/production-evidence.ts
lib/types.ts
lib/pilot-data.ts
```

### Key backend notes

- `lib/client-api.ts` normalizes `/v1/foo` calls to `/api/v1/foo`.
- `lib/source-search.ts` powers source-locked evidence search and the free assistant.
- `lib/draft-action-store.ts` persists draft actions to local JSON under `data/agsa/generated/draft-actions.json`.
- `lib/agsa-review-store.ts` persists review decisions to the local AGSA governance store.
- `lib/production-evidence.ts` defines production-readiness gates and evidence requirements.

## 4. Major UI architecture

The app shell is:

```txt
components/app-shell.tsx
```

It currently provides:

- dark institutional sidebar navigation
- mobile slide-out menu
- command search modal
- topbar actions
- global free assistant
- global page transition loader

Important global visual layers are imported in:

```txt
app/layout.tsx
```

The later imports intentionally override earlier layers. Many CSS files are currently used as final cascade layers while the design stabilizes.

## 5. Recent critical layout work

The desktop view was previously broken because the shell and hero sizing were unstable across laptop and desktop widths. Several rescue and authority layers were added.

Important final CSS files:

```txt
components/atlas/atlas-compact-desktop-rescue.css
components/atlas/atlas-desktop-shell-fix.css
components/atlas/atlas-device-polish.css
```

### Purpose of these layers

`atlas-compact-desktop-rescue.css`

- fixes phone browsers using “Desktop site” mode
- hides fixed desktop sidebar below 1181px
- uses floating menu instead
- makes workspace full-width
- prevents giant blank right-side areas
- prevents headings from breaking letter-by-letter

`atlas-desktop-shell-fix.css`

- restores proper two-column desktop shell above 1181px
- fixes sidebar column width
- fixes workspace column
- hides floating menu on desktop
- calms desktop hero heading size
- stabilizes topbar layout

`atlas-device-polish.css`

- final visual authority layer loaded last
- improves desktop, laptop, compact desktop and mobile rhythm
- adds premium body background
- refines sidebar, topbar, hero, card shadows and spacing
- adds laptop-specific rules from 1181px to 1440px
- preserves mobile stacked layout

## 6. Step plan and progress

The build plan is currently organized into steps.

### Step 1: Free Source-Locked Assistant

**Status:** Functionally complete.

Main files:

```txt
components/atlas/free-assistant.tsx
components/atlas/atlas-assistant.css
components/atlas/atlas-assistant-mobile-fix.css
```

Mounted globally in:

```txt
components/app-shell.tsx
```

Capabilities built:

- floating `Ask MuniAtlas` button
- source-locked assistant drawer
- Evidence Mode active
- Analyst Mode shown as locked future paid AI mode
- uses backend endpoint `POST /v1/assistant/query`
- refuses unsupported claims via backend logic
- starter prompts
- page-aware prompts
- follow-up prompts
- frontend continuity by passing previous evidence focus, citations and periods into the next query
- reset/new-topic button
- auto-scroll to latest answer
- mobile prompt layout fix

Known Step 1 caveat:

- This is not paid AI memory. It is frontend continuity plus backend source search.
- Future paid AI mode should call a provider only when configured, and should still obey source-locking rules.

Recommended future Step 1 upgrades:

- Add copy-answer button.
- Add “Create action from this evidence” button.
- Add route-aware default context from the current page.
- Add actual paid Analyst Mode behind an environment flag.
- Add audit logging of assistant questions and cited source IDs.

### Step 2: Action Studio Modal

**Status:** Functionally complete and upgraded.

Main files:

```txt
components/atlas/action-studio.tsx
components/atlas/atlas-action-studio.css
components/atlas/atlas-action-studio-rescue.css
```

Mounted in:

```txt
app/actions/page.tsx
```

Capabilities built:

- Action Studio section on Action Board page
- loads draft actions from `/v1/actions/drafts`
- creates draft actions from queue items
- opens existing draft actions in a modal
- edits title, owner, assigned person, reviewer, due date, required evidence, escalation rule, closure note and residual risk
- transitions workflow status through `/v1/actions/drafts/:id/transition`
- attaches evidence through `/v1/actions/drafts/:id/evidence`
- shows source chain
- shows attached evidence
- shows review-readiness score
- search/filter by queue item
- severity filter
- workflow summary tiles
- required evidence coverage checklist
- status timeline
- mobile rescue for stats and toolbar styling

Known Step 2 caveats:

- Persistence is still prototype/local JSON.
- It should eventually use a tenant-aware durable store.
- It does not yet support role-based permissions.
- Current ownership fields are plain text, not user-directory linked.

Recommended future Step 2 upgrades:

- Add owner directory/autocomplete.
- Add due-date picker.
- Add evidence upload/file storage integration.
- Add reviewer approval guardrails.
- Add “escalate to intervention queue” workflow.
- Add action audit log page.

### Step 3: Evidence Intake Desk / Evidence Attachment Drawer

**Status:** Functionally complete and upgraded.

Main files:

```txt
components/atlas/evidence-attachment-drawer.tsx
components/atlas/atlas-evidence-drawer.css
components/atlas/atlas-evidence-drawer-upgrade.css
```

Mounted in:

```txt
app/actions/page.tsx
```

Capabilities built:

- Evidence Intake Desk on Action Board page
- loads draft actions from `/v1/actions/drafts`
- evidence intake stats
- search draft actions
- filters by all, needs proof, with evidence and under review
- opens dedicated evidence drawer
- submits evidence label, optional URL, submitter, reviewer note and source reference
- attaches proof via `/v1/actions/drafts/:id/evidence`
- shows required evidence checklist
- shows source chain
- shows existing attachments
- proof packet meter per action card
- proof packet coverage score in drawer
- quick proof templates:
  - Signed management response
  - AGSA citation confirmation
  - Owner assignment proof
  - Remedial action plan
- selected source preview with quality state, period and location
- better disabled submit state
- mobile-friendly drawer

Known Step 3 caveats:

- Evidence URL is plain text.
- No file upload/storage yet.
- No virus scanning, retention policy or permission checks yet.
- Coverage detection is lightweight keyword matching, not true semantic validation.

Recommended future Step 3 upgrades:

- Add file upload to object storage.
- Add attachment type classification.
- Add reviewer verification checklist per evidence item.
- Add evidence versioning.
- Add source-to-evidence relationship graph.

### Step 4: AGSA Review Cockpit

**Status:** Functionally complete and ultra-upgraded.

Main files:

```txt
components/atlas/agsa-review-desk.tsx
components/atlas/atlas-agsa-review-desk.css
components/atlas/atlas-agsa-review-ultra.css
```

Mounted in:

```txt
app/admin/agsa-review/page.tsx
```

Navbar exposure:

```txt
components/app-shell.tsx
```

Route:

```txt
/admin/agsa-review
```

Capabilities built:

- AGSA Review Cockpit page
- replaces older basic AGSA review component
- loads persisted review decisions from `/v1/agsa/review-decisions`
- review queue with selected item pane
- filters by document, decision state, confidence and search text
- source page viewer
- extracted page sample
- review issue card
- citations on the selected page
- decision stats:
  - Open
  - Accepted
  - Corrections
  - Excluded
  - Publish-safe
- decision controls:
  - Accept
  - Needs correction
  - Exclude
- correction fields:
  - replacement field
  - replacement value
  - reviewer rationale
- rationale templates
- correction field presets:
  - `auditOutcome`
  - `findingDescription`
  - `citationSnippet`
  - `materialIrregularity`
  - `recommendation`
  - `publicSummary`
- publish-safety score
- reviewer gates:
  - Source page inspected
  - Citation trail present
  - Reviewer rationale captured
  - Correction path ready
- blocker detection
- decision preview for public output
- document profile cards
- source document link

Known Step 4 caveats:

- Decisions persist to prototype local store, not durable tenant DB.
- Reviewer is hardcoded as `prototype-reviewer`.
- Source page viewer uses parsed text sample, not a PDF image viewer.
- No side-by-side original PDF page screenshot yet.
- No approval role enforcement yet.

Recommended future Step 4 upgrades:

- Add authenticated reviewer identity.
- Add durable Firestore/Postgres persistence.
- Add PDF/page image preview.
- Add keyboard shortcuts for accept/correct/exclude.
- Add batch review mode.
- Add review export log.
- Add locked public-overlay API response that only emits accepted/corrected claims.

## 7. Navigation changes

The AGSA Review Cockpit is now visible in the sidebar.

Main navigation file:

```txt
components/app-shell.tsx
```

Changes made:

- Added `AGSA Review Cockpit` under the Evidence group.
- Added a `Review` badge.
- Added footer link `AGSA Review`.
- Updated topbar primary action to link to `/admin/agsa-review`.
- Updated command search quick action to surface AGSA review.

## 8. Motion and transitions

Main files:

```txt
components/atlas/page-transition.tsx
components/atlas/atlas-motion.css
```

Mounted in:

```txt
components/app-shell.tsx
```

Capabilities:

- global page transition indicator on internal link clicks
- loading pill / animated progress rail
- workspace fade/slide animation
- sidebar entrance animation
- mobile sheet slide animation
- assistant drawer slide animation
- modal bloom animation
- card soft-rise animation
- reduced-motion support

Known caveat:

- The transition component listens to document clicks and sets a short pending state. It is visual only, not a full Next.js route-progress API.

## 9. Visual system and CSS cascade warning

There are now many CSS files imported globally. This was intentional during rapid product design, but future cleanup should consolidate them.

Current import order matters. Later files override earlier files.

Important final imports at the end of `app/layout.tsx`:

```txt
atlas-compact-desktop-rescue.css
atlas-desktop-shell-fix.css
atlas-device-polish.css
```

Do not remove or reorder these without retesting:

1. phone mobile view,
2. phone “Desktop site” mode,
3. laptop desktop view,
4. large desktop view,
5. Action Board,
6. AGSA Review Cockpit,
7. Assistant drawer,
8. mobile menu drawer.

## 10. Known risks and technical debt

### Build/runtime risks

- No local `npm run verify` was run in this ChatGPT environment.
- Vercel deployment status was repeatedly checked and often pending at response time.
- Final verification should happen locally after pulling.

### CSS debt

- Many rescue layers were added to stabilize mobile/desktop quickly.
- Recommended cleanup is to consolidate Atlas CSS into fewer canonical layers:
  - base tokens
  - shell/layout
  - components
  - workflows
  - responsive
  - motion

### Persistence debt

- Draft actions and AGSA decisions are local prototype stores.
- Need migration to durable tenant-aware persistence.

### Auth/security debt

- Auth middleware work began earlier, but Firebase/Admin role enforcement is not production-grade yet.
- Reviewer identity is hardcoded in AGSA Review Cockpit.
- No proper RBAC yet.

### Product debt

- The platform is a strong MVP/prototype but not production-ready.
- Need real data ingestion, validation, tenant storage, file storage and role-based workflows.

## 11. Recommended next step plan

### Step 5: Production Readiness Command Centre

Suggested route:

```txt
/admin
```

Suggested focus:

- turn existing readiness page into a premium production gate cockpit
- show backend blockers clearly
- show which modules are prototype/local vs production-ready
- show Firebase/Firestore readiness
- show workflow persistence readiness
- show source evidence readiness
- show security/auth readiness
- add “promotion checklist” with commands and required env vars

Potential files:

```txt
components/atlas/production-readiness-cockpit.tsx
components/atlas/atlas-production-readiness.css
app/admin/page.tsx
```

### Step 6: Evidence Graph Explorer

Suggested route:

```txt
/sources/graph
```

Suggested focus:

- visual relationship between municipalities, findings, sources, actions, evidence and review decisions
- start simple with CSS/SVG cards, not heavy graph library
- later upgrade to React Flow or D3 if needed

### Step 7: Create Action From Assistant

Suggested focus:

- assistant answer/result should offer “Create action”
- prefill draft action from cited source and result
- connect Step 1 Assistant to Step 2 Action Studio

### Step 8: Durable persistence

Suggested focus:

- replace local JSON stores with Firestore or Postgres
- tenantId, createdBy, updatedBy, reviewerId, audit events
- migration helper for current JSON data

### Step 9: File evidence upload

Suggested focus:

- storage bucket
- evidence metadata table/document
- upload progress
- virus scanning placeholder
- signed URLs
- retention policy

### Step 10: Paid Analyst Mode

Suggested focus:

- keep Evidence Mode free and source-locked
- add paid AI summarization only when env is configured
- never let paid AI invent unsupported claims
- require citations in final answer
- add billing guardrails later

## 12. Local pull instructions

From your local workspace:

```bash
git status
```

If you have no local changes:

```bash
git checkout main
git pull origin main
npm install
npm run dev
```

If you have local changes you want to keep:

```bash
git status
git stash push -m "local work before pulling MuniAccountability updates"
git checkout main
git pull origin main
git stash pop
npm install
npm run dev
```

Then verify:

```bash
npm run lint
npm run build
```

If `npm run build` fails, inspect the exact TypeScript or CSS import error first. Most likely issues would come from type mismatches in newer workflow components or missing CSS import paths.

## 13. Screens to manually test after pulling

Test these screens:

```txt
/
/actions
/admin/agsa-review
/sources
/search
/intervention-queue
/municheck
/admin
```

Test these modes:

1. laptop desktop browser
2. large desktop browser
3. phone normal mobile browser
4. phone browser with “Desktop site” enabled
5. sidebar/menu opening and closing
6. Ask MuniAtlas opening and follow-up questions
7. Action Studio modal opening and saving
8. Evidence Intake Drawer opening and evidence submission
9. AGSA Review Cockpit decision save

## 14. Most recent work summary

The most recent design/dev work focused on:

- fixing broken desktop shell layout
- adding stable desktop/laptop sizing
- preserving mobile experience
- exposing AGSA Review Cockpit in navigation
- adding final device polish layer
- preparing this handoff file for Codex continuation

Latest final CSS authority file:

```txt
components/atlas/atlas-device-polish.css
```

Latest handoff file:

```txt
CODEX_CONTINUATION.md
```

## 15. Guidance for Codex

When continuing:

1. Start by running `npm install`, `npm run lint`, and `npm run build`.
2. Do not add more global CSS rescue files unless absolutely necessary.
3. Prefer consolidating visual rules into existing final layers.
4. Keep source-backed trust logic intact.
5. Avoid unsupported public claims.
6. Preserve mobile and desktop testing before shipping.
7. Continue with Step 5 unless the user requests more visual fixes first.

The next best development move is **Step 5: Production Readiness Command Centre**.
