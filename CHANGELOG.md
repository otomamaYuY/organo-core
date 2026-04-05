# Changelog

All notable changes to **organo-core** are documented in this file.

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
