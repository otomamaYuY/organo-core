# Changelog

All notable changes to **organo-core** are documented in this file.

---

## [v1.7.1] — 2026-06-08

### Improvements

#### Auto-focus for Key UI Elements

The app now automatically moves focus to the most relevant button or input field at the right moment, so users can act immediately without having to click first.

- **Landing screen** — the Start Free button receives focus with a ripple animation after the welcome screen appears.
- **Onboarding tour** — the Next button is focused at each step, allowing keyboard-only navigation with Enter or Space.
- **Person node sidebar** — the Name field is focused as soon as a person node is selected.
- **Org unit sidebar** — the Unit Name field is focused when an org unit node is selected.

#### Stricter Privacy and Data Safety via Privacy Center

The Privacy Center provides full transparency and control over locally stored data.

- All chart data is stored exclusively in the browser. Nothing is transmitted to any server.
- An always-visible offline badge confirms that the app is running without external network activity.
- Every outbound network request is intercepted and displayed in the Privacy Center, so users can verify that no data leaves the browser at any time.
- A one-click data clear button lets users wipe all locally stored data instantly.

---

## [v1.7.0] — 2026-06-07

### New Features

#### Gemini Nano AI Import (Chrome Built-in AI)

Import organization data from plain text using Google's Gemini Nano model running entirely in Chrome — no API key, no server, no cost.

- Paste any free-form text describing your organization and the model extracts names, roles, departments, and reporting relationships.
- Requires Chrome 138 or later with the Built-in AI / Prompt API origin trial enabled.
- All inference runs locally in the browser; no data leaves the device.
- A preview table lets you review, edit, or remove rows before applying changes to the chart.

#### Privacy Center

A dedicated privacy panel accessible from the toolbar badge.

- Offline badge: a persistent indicator showing that the app is operating without any network transmission.
- Storage viewer: lists all keys stored in localStorage with their sizes.
- Data clear button: removes all app data from the browser in one action.
- Network monitor: intercepts and logs all outbound fetch and XHR requests in real time, so users can confirm that nothing is sent externally.

#### Bilingual Onboarding Tour

The step-by-step onboarding tour now displays Japanese and English side by side in every tooltip. No language toggle is needed — both languages are shown by default.

### Security

- Fixed 7 vulnerabilities identified in an OSS security review, including dependency pinning, Content Security Policy hardening, and removal of unsafe dynamic patterns.

### Maintenance

- Removed dead OpenAI and LLM provider code that was no longer reachable after the AI settings panel was simplified.
- Cleaned up the storage viewer to remove entries that referenced the removed OpenAI integration.

---

## [v1.6.2] — 2026-06-06

### Maintenance

#### Dead Code Removal and Dependency Reduction

Static analysis (knip) identified dead exports, unused dependencies, and unreachable symbols. All removals were verified with TypeScript type-checking and unit tests.

**Unused dependencies removed (3):**
- `framer-motion` — no imports anywhere in `src/`
- `@testing-library/user-event` — no imports in any test file
- `eslint-config-prettier` — not referenced in `eslint.config.js`

**Dead code deleted:**
- `isChromeAiAvailable()` in `services/llm/chrome-ai.ts` — thin wrapper with zero callers; availability check is done directly via `getChromeAiAvailability()`
- Re-export barrel line in `services/llm/index.ts` — neither `isChromeAiAvailable` nor `getChromeAiAvailability` was imported through the barrel; the latter is consumed directly from its source file
- `NodeKind` type in `types/index.ts` — unused union type; the codebase uses the literal string values inline
- `ORG_UNIT_TYPE_LABELS` constant in `types/index.ts` — Japanese label map with no consumers
- `isPersonNode` / `isUnitNode` type guards in `types/index.ts` — unused; `node.data.kind` is checked inline where needed
- `LlmOutput` derived type in `services/llm/schema.ts` — not referenced anywhere
- Redundant `export type { ExtractedPerson }` re-export at the bottom of `AiImportModal.tsx` — the type is available directly from `@/services/llm`

**Internal-only exports narrowed:**
- `orgPersonSchema` / `orgUnitSchema` — these fixed-locale schema instances are only needed for `OrgPersonFormValues` / `OrgUnitFormValues` type inference; the exported symbols were removed while keeping the constants in scope
- `extractedPersonSchema` in `services/llm/schema.ts` — used internally to compose `llmOutputSchema`; no external consumers
- `Toast` interface in `store/useToastStore.ts` — used only inside the store module to type the `toasts` array

---

## [v1.6.1] — 2026-04-12

### Bug Fixes

#### JSON Editor ↔ Canvas Sync Is Now Near-Instant and Collision-Safe
The bidirectional sync between the JSON editor side panel and the visual canvas had three latent issues:

1. **600 ms debounce on editor → store.** Typing in the JSON editor updated the canvas only 0.6 s after the last keystroke, which felt visibly laggy.
2. **Mid-typing overwrite race.** While the user was editing the JSON, any GUI-side store mutation (a node click, a drag, any other action that produced a new `nodes` array reference) ran the store → editor sync effect and silently replaced the user's in-progress text with the canonical serialization. Root cause: the `suppressStoreSync` ref only skipped one effect pass and did not distinguish "user is mid-edit" from "user just committed".
3. **CRLF / LF end-of-line mismatch.** On Windows, Monaco's model defaulted to `\r\n` while `JSON.stringify(..., null, 2)` produces `\n`. Every store update therefore made Monaco believe the `value` prop had changed (string-level inequality) and triggered a spurious `executeEdits` call — potentially causing the caret to jump on every canvas mutation even when the semantic content was identical.

Fixed by a focused rewrite of `JsonSidePanel.tsx`:

- **Debounce cut from 600 ms to 80 ms** and the handler commits the moment the text parses as valid JSON. Invalid JSON never reaches the store; it just shows an inline error bar.
- **`suppressStoreSync` ref replaced with an `editorDirty` state.** While `editorDirty === true` the store → editor effect is a no-op, so an in-progress edit is **never** stomped on by an unrelated canvas action. The flag is cleared only on a successful commit or when the panel closes.
- **Store → editor sync is gated on `isOpen`.** While the panel is hidden no serialization runs at all, eliminating per-drag-frame O(n) cost for users who never open the editor.
- **Panel close discards any uncommitted edit state.** Reopening the panel always shows the live canvas contents, not stale half-written JSON from a previous session.
- **Monaco model's end-of-line is pinned to LF** (`setEOL(EndOfLineSequence.LF)` in `onMount` and re-asserted before each commit). The `value` prop and `editor.getValue()` are now byte-equal for identical content, so Monaco skips the extra `executeEdits` pass and the caret stays put.

Verified with an in-browser test harness: canvas edit → editor reflects in < 1 frame, editor edit → canvas reflects in ~200 ms (80 ms debounce + parse + React commit + DOM reflow), invalid in-progress JSON survives concurrent canvas mutations, and the editor's end-of-line stays LF across close/reopen cycles.

#### Production URL Was Misconfigured in Metadata
`index.html`'s `<link rel="canonical">`, `og:url`, `og:image`, `twitter:image`, JSON-LD `url` / `screenshot`, `public/sitemap.xml`, `public/robots.txt`'s `Sitemap:` directive, and the `public/llms.txt` docs link all referenced `https://organo.pages.dev/` — a completely unrelated third-party site. The project's actual Cloudflare Pages production URL is `https://organo-core.pages.dev/` (with hyphen). All six sources-of-truth now point to the correct domain, and `README.md` surfaces the production URL prominently at the top so the mistake is harder to repeat.

---

## [v1.6.0] — 2026-04-11

### New Features

#### JSON Editor Side Panel with Bidirectional Sync
A new right-side panel powered by **Monaco Editor** lets you view and edit the entire org chart as raw JSON alongside the visual canvas. Edits flow in both directions:
- **GUI → JSON** — any change made in the canvas (add/move/delete nodes, edit fields, drag edges) is reflected in the editor immediately.
- **JSON → GUI** — typing valid JSON in the editor updates the chart after a short debounce. Parse errors are surfaced in an inline error bar at the bottom of the panel without disrupting the canvas state.
- A re-entrancy guard prevents the GUI ↔ JSON sync from looping when the user is the source of the change.

#### Discoverable Vertical Tab Handle for the JSON Panel
The JSON panel's edge trigger was redesigned from an 8 px invisible bar into a **prominent vertical tab handle** anchored to the right edge of the canvas:
- Always visible when the panel is closed, with a chevron, code icon, and vertical "JSON" label so users immediately see "this is clickable, something will slide out".
- A gentle 2.6 s **pulse animation** (accent-colored glow) attracts attention without being noisy; the pulse pauses on hover.
- Hover state slides the tab 4 px to the left, fills it with the accent color, and brightens the icons.
- Slides off-screen smoothly when the panel is open, handing dismissal off to the panel's existing close button.
- Marked up as a real `<button>` with `aria-label` and tooltip for keyboard and screen-reader access.

### Bug Fixes

#### JSON Editor Stuck on "Loading…" in Production
On the deployed Cloudflare Pages site the JSON editor sometimes never finished initialising and remained on the "Loading…" placeholder forever. Root cause: `@monaco-editor/react` injects a `<script>` tag that fetches the Monaco runtime from `https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/loader.js` at runtime. When the jsdelivr CDN was slow or unreachable from the user's network the loader request hung indefinitely and the editor never mounted. Fixed by **self-hosting Monaco**: `monaco-editor@0.55.1` is now a direct dependency, `scripts/copy-monaco.mjs` copies `node_modules/monaco-editor/min/vs` into `public/monaco/vs` during `postinstall` / `predev` / `prebuild`, and `src/main.tsx` calls `loader.config({ paths: { vs: '/monaco/vs' } })` so Monaco is fetched from the same origin as the app. The `public/monaco/` directory is git-ignored — it is regenerated from `node_modules` on every install and build.

---

## [v1.5.0] — 2026-04-05

### New Features

#### Member Count Syncs Automatically with Drag-and-Drop
The **Member Count** field on org-unit nodes now stays accurate without manual updates:
- **Add via drag-and-drop** — connecting a person node to an org unit by dragging from a handle increments the unit's member count by one.
- **Delete a person** — removing a person node that belongs to an org unit decrements the unit's member count (floor 0). Works for single deletion, multi-select deletion, and keyboard Delete.
- **Reconnect an edge** — dragging an existing edge from one org unit to another transfers the count: the old parent decrements and the new parent increments.

#### Head Person Is Now Placed Above the Org Unit
Setting a **Head Person** name on an org-unit node and saving now inserts the person node as the **direct parent** of the org unit (between the org unit and its grandparent), reflecting real-world leadership hierarchy. Previously the person was created as a child beneath the unit. The insertion is idempotent: if a person node with the same name is already the immediate parent, no duplicate is created.

### Bug Fixes

#### Auto-Create Dialog Showed Wrong Node Kind When Both Counts Were Set
When both **Child Unit Count** and **Member Count** were filled and saved, only the org-unit auto-create dialog appeared; the person auto-create dialog was silently skipped. Root cause: `handleUnitSave` returned early after queuing the first dialog, so the second was never reached. Fixed by building a full queue of pending dialogs and advancing through them one at a time — confirming or skipping one dialog now shows the next.

#### Auto-Create Dialog Counter Did Not Reset Between Dialogs
After confirming the org-unit auto-create dialog, the subsequent person dialog displayed the org-unit count instead of the person count. Root cause: React reused the same `GenerateMembersDialog` instance, so `useState(suggestedCount)` was not re-initialised. Fixed by adding a `key` prop tied to `unitId + kind`, forcing a remount with the correct initial count each time the dialog changes.

#### Auto-Create Dialog Showed Stale Unit Name
The unit name displayed inside the auto-create dialog reflected the name before the current edit rather than the newly typed name. Fixed by reading the name from the submitted form `values` instead of the closed-over `selectedNode.data`.

#### Save Button Was Always Disabled on Initial Load
Using `mode: 'onChange'` in react-hook-form means `isValid` starts as `false` and resets to `false` after every `reset()` call, so the save button was permanently disabled until the user touched a field — even when all values were already valid. Fixed by changing the disabled condition from `!isValid` to `Object.keys(errors).length > 0`: the button is enabled while no validation errors are actively shown, and disables only when the user introduces an invalid value.

#### Clearing a Number Field Blocked the Save Button
Selecting all text in the **Member Count** or **Child Unit Count** field and typing a new value momentarily clears the input, causing `valueAsNumber` to produce `NaN`. Zod's `z.number()` rejects `NaN`, which triggered an error and disabled the save button mid-keystroke. Fixed by accepting `NaN` in the schema via `z.union([z.number()…, z.nan().transform(() => 0)])`, coercing any `NaN` to `0`.

#### Empty Employment Type Blocked Saving Person Nodes
The Employment Type select includes a blank placeholder option (value `""`). When a person node had no employment type set, the placeholder was selected by default. Submitting with `""` failed Zod's `z.enum()` check, preventing the save. Fixed by extending the schema with `.or(z.literal(''))` and stripping the empty string to `undefined` before persisting.

---

## [v1.4.0] — 2025-04-05

### New Features

#### Head Person Auto-Populated on Child Org Unit Creation
When an org-unit node is added below a person node (via handle drag, context menu, or auto-generation), the new unit's **Head Person** field is automatically pre-filled with the parent person's name, reflecting the common pattern where a person leads the unit directly beneath them.

### Bug Fixes

#### Top Handle Drag Now Creates a Parent Node
Dragging from the **top connector** of a node and releasing on empty canvas previously created a child node — the same behavior as the bottom connector. The direction is now correct: the newly created node becomes the **parent** and the original node becomes its child, with an edge connecting them in the right direction.

#### Duplicate Head Person Nodes No Longer Created on Re-Save
Saving an org-unit with the same **Head Person** name multiple times created duplicate person nodes under the parent unit. The root cause was a stale React closure: the duplicate check was reading an outdated snapshot of the store's edges rather than the current state. Fixed by reading `getState()` directly from the Zustand store at check time.

#### Member Count and Child Unit Count Default to 0
Newly created org-unit nodes now show **0** in the Member Count and Child Units fields instead of blank, preventing ambiguity and making the auto-generation dialog behave predictably on the first save.

---

## [v1.3.0] — 2025-04-05

### New Features

#### Multi-Select with Right-Click Drag
Hold the right mouse button and drag over the canvas to draw a selection rectangle. All nodes and edges within the area are selected simultaneously. Once selected:
- **Drag** any selected node to move the entire group together.
- Press **Delete** to remove all selected nodes and edges at once.
- Use the **floating action bar** (bottom-center) to delete with a single click.
Right-clicking directly on a node still opens the existing context menu, so single-node operations are unchanged.

#### Child Org Unit Auto-Generation
The **Edit Unit** panel now includes a **Child Units** field. Enter the number of child org units you want under this unit and save — a confirmation dialog appears, then the specified number of org-unit nodes are created and connected automatically.

#### Auto-Populate Department from Parent Org Unit
When a new person node is added under an org-unit node (either manually or via auto-generation), the **Department** field is pre-filled with the parent org unit's name, eliminating repetitive data entry.

#### Head Person Auto-Sync to Parent
Setting a **Head Person** name on an org-unit node and saving automatically creates a person node with that name under the **parent** org unit, reflecting real-world reporting structures without manual node creation.

---

## [v1.2.0] — 2025-04-04

### New Features

#### Member Node Auto-Generation
The **Edit Unit** panel gained a **Member Count** field. After saving a unit with a member count greater than the number of existing children, a dialog asks whether to auto-generate person nodes or child org-unit nodes. The confirmed number of nodes is created and connected with edges in one step.

#### AI Image Import (BYOK — OpenAI GPT-4o Vision)
Upload an organization chart image (PNG / JPG / WebP, up to 20 MB) and let GPT-4o Vision extract names, roles, departments, and reporting relationships automatically.
- Bring Your Own Key: your OpenAI API key is stored only in the browser's local storage and never sent to any server other than OpenAI.
- A preview table lets you review, edit, or delete extracted rows before applying changes to the chart.
- Choose **Append** (merge with existing nodes) or **Replace** (replace all nodes) on import.
- Amazon Bedrock and Azure OpenAI are listed as *Coming Soon* (requires a server-side proxy to work around browser CORS restrictions).

#### LLM Provider Settings Panel
A new settings modal lets you enter and manage your AI provider credentials. The active provider defaults to **OpenAI**. Unsupported providers are visually disabled with a *Coming Soon* label.

### Bug Fixes

- **Default provider reset to OpenAI** — Clearing settings no longer reverts the provider selection to Bedrock.
- **Modal height stability** — Removed an inline success banner inside the settings modal that caused the dialog to jump in height after saving.
- **Provider selector initialization** — Saved provider values that are no longer supported are automatically reset to OpenAI on load.

---

## [v1.1.0] — 2025-04-03

### New Features

- **Onboarding tour** — Step-by-step guide for first-time users, triggered automatically on first visit and accessible via the Help button at any time. Auto-layout runs before the tour begins so nodes are neatly arranged.
- **Landing overlay** — Full-screen welcome screen with a call-to-action that runs auto-layout before dismissing.
- **Autocomplete for role, department, and tags** — Input fields suggest values based on data already present in the chart, including org-unit names as department candidates.
- **Form validation improvements** — Save buttons are disabled when required fields are invalid; error messages reserve space to prevent layout shift; stricter email validation with full-width character normalization.

### Bug Fixes

- **Export edge rendering** — Edges now appear correctly in PNG, SVG, and PDF exports.

---

## [v1.0.0] — 2025-04-01

### Initial Release

- Interactive drag-and-drop org chart editor (React Flow v11)
- Person nodes and Org Unit nodes with full edit forms
- Edge creation, reconnection, and deletion
- Collapse / expand subtrees
- Right-click context menu for quick node actions
- Search and filter nodes by name, role, or department
- Export to JSON, CSV, PNG, SVG, PDF, and HTML
- Dark / Light theme toggle
- Japanese and English UI (i18n)
- Auto-layout powered by Dagre
- Cloudflare Pages deployment
