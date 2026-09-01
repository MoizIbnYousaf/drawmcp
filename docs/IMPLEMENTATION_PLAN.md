# DrawMCP end-to-end implementation plan

Last updated: 2026-09-01

## Outcome

Ship `drawmcp.dev` as a polished WebMCP Challenge entry that demonstrates a
person and an agent editing one live Excalidraw canvas. Publish the DrawMCP
repository before submission, then prepare a focused contribution to the
official `excalidraw/excalidraw-mcp` repository from the proven integration.

## Hard constraints

- Deadline: September 3, 2026 at 4:00 PM EDT.
- The live URL must work in ChatGPT's in-app browser.
- The submission repository must be public and visibly open source at
  submission time.
- The demo video must be public, under three minutes, and include audio.
- WebMCP tools must register from the top-level page with imperative JavaScript.
- The app must use the exact published `@excalidraw/excalidraw` API rather than
  private internals or a source fork.
- The normal human canvas must work without WebMCP.
- The upstream PR is prepared only after the live product is stable and must be
  scoped to the official MCP repository's goals.

## Delivery map

```text
Upstream audit
    ↓
Published Excalidraw API adapter
    ↓
Shared CanvasService
    ↓
WebMCP tools + human UI
    ↓
Local tests
    ↓
Vercel preview → in-app-browser verification
    ↓
drawmcp.dev production launch
    ↓
Public repository + demo + Devpost submission
    ↓
Focused excalidraw-mcp upstream PR
```

## Phase 0 — Foundation and provenance

### Work

- Create the private `MoizIbnYousaf/drawmcp` repository.
- Pin Excalidraw and Excalidraw MCP as read-only Git submodules.
- Store dated snapshots of the WebMCP specification, Chrome guide, OpenAI
  guide, and OpenAI showcase.
- Add project instructions, licensing, contribution rules, approach, audits,
  and this plan.
- Add continuous integration for install, lint, and build.

### Acceptance

- A fresh clone with submodules reproduces the research workspace.
- The private remote contains one attributable initial commit.
- Upstream code is not copied or presented as DrawMCP-owned source.

## Phase 1 — Exact Excalidraw adapter

### Modules

```text
src/excalidraw/ExcalidrawCanvas.tsx
src/excalidraw/canvas-service.ts
src/excalidraw/element-schema.ts
src/excalidraw/element-projection.ts
src/excalidraw/revision-store.ts
```

### Work

1. Replace the Vite demo with a full-height Excalidraw component.
2. Capture `ExcalidrawImperativeAPI` through the installed `0.18.1` package's `excalidrawAPI` callback.
3. Build a typed `CanvasService` around only these published methods:
   - `getSceneElements`
   - `getAppState`
   - `getFiles`
   - `updateScene`
   - `scrollToContent`
   - `onChange`
4. Convert agent-created skeletons with `convertToExcalidrawElements`.
5. Apply agent mutations using `CaptureUpdateAction.IMMEDIATELY`.
6. Track a local scene revision and last actor (`human` or `agent`).
7. Persist scene data locally with an explicit versioned storage envelope.

### Acceptance

- A human can draw, select, delete, undo, redo, refresh, and recover the scene.
- Programmatic additions and updates are immediately visible and undoable.
- No import reaches into unpublished Excalidraw internals.
- The editor remains usable before the WebMCP API is available.

## Phase 2 — WebMCP registration layer

### Modules

```text
src/webmcp/tool-contracts.ts
src/webmcp/register-tools.tsx
src/webmcp/tool-results.ts
src/webmcp/status.ts
```

### Work

- Use the Chrome-maintained `use-webmcp-tool` hook or an equally small wrapper
  around `document.modelContext.registerTool`.
- Register only while the canvas API is initialized.
- Abort/unregister every tool on unmount.
- Expose a visible status chip with support, registration, revision, and last
  operation state.
- Normalize all tool results into structured receipts.

### Tool contracts

#### `get_canvas_summary`

Read-only. Returns revision, element counts by type, scene bounds, selected
count, and a bounded list of element labels. It does not return files, binary
payloads, or unrelated app state.

#### `get_selection`

Read-only. Resolves `appState.selectedElementIds` at call time and returns a
compact projection of the selected elements.

#### `add_elements`

Mutating. Accepts at most 50 simplified element skeletons and an optional
`expected_revision`. Rejects unsupported element types or excessive text.

#### `update_elements`

Mutating. Accepts ID-addressed patches over an allowlist: position, size,
colors, opacity, text/label, and lock state. Structural binding changes require
a separate deliberate contract.

#### `delete_elements`

Mutating. Accepts at most 100 stable IDs and preserves Excalidraw history
semantics.

#### `fit_to_content`

Visible UI action. Focuses all or selected elements with the published
`scrollToContent` method and reports what was focused.

#### `organize_diagram`

Mutating signature tool. Applies one of a few deterministic layouts to selected
or all supported nodes. It never asks a model to invent coordinates inside the
tool implementation; the agent chooses the layout and the app performs it.

### Acceptance

- ChatGPT's in-app browser discovers all seven tools on the top-level page.
- Every schema rejects unknown properties and out-of-bounds inputs.
- Tool registrations disappear when the canvas route unmounts.
- Read-only annotations match actual effects.
- Canvas-derived text is identified as untrusted content where supported.

## Phase 3 — Human-agent concurrency and integrity

### Work

- Increment revision on both human and agent changes.
- Add `expected_revision` preconditions to mutation tools.
- Return a stale-revision error with current revision and recovery summary.
- Serialize mutation execution through a page-local queue.
- Suppress duplicate revision increments caused by an agent mutation flowing
  back through `onChange`.
- Preserve stable element IDs across patches.
- Add visible operation toasts and a nonintrusive activity history.

### Acceptance

- A human edit made during a delayed agent operation is never silently lost.
- Agent changes appear as one coherent undo step where the API allows.
- A second tool can read the state produced by the first without page reload.
- Manual edits after an agent action are visible to the next read call.

## Phase 4 — Comparison lab and narrative

### Baseline task

Use one reproducible prompt for both systems:

> Draw a rough architecture with a browser, agent, WebMCP tools, and canvas.
> Then let me move one node, and update the diagram without losing my edit.

### Evidence to collect

- required setup steps;
- tool discovery path;
- number of explicit handoffs;
- where canonical state lives;
- whether the human edits the same surface the agent reads;
- how continuation after a human edit works;
- result verification and undo behavior.

### Product surface

Add an “About this experiment” panel containing the concise comparison and
links to the official MCP and WebMCP sources. Do not embed or remotely control
the competing service inside DrawMCP.

### Acceptance

- The demo explains the distinction without claiming WebMCP universally
  replaces MCP.
- The live app can complete the full human-agent-human-agent loop.

## Phase 5 — Test system

### Unit tests

- schema boundaries and unknown-property rejection;
- compact element projection and untrusted text handling;
- revision and stale-write logic;
- add/update/delete service operations;
- deterministic layout output;
- operation receipts and error normalization.

### Component tests

- registration after canvas initialization;
- AbortSignal cleanup on unmount;
- StrictMode registers one live copy of each tool;
- unavailable WebMCP produces a usable canvas and accurate status;
- user changes update the revision and next tool read.

### Browser verification

- Vercel preview loads without console errors.
- ChatGPT in-app browser lists the expected tools.
- Invoke every read and mutation tool at least once.
- Verify visible result, state receipt, undo, and follow-up continuation.
- Verify direct URL refresh and local state recovery.

### Security checks

- large input rejection;
- invalid IDs and element types;
- unsafe URLs and arbitrary HTML are not accepted;
- tool output containing canvas text is bounded and marked untrusted;
- mutation tools cannot call network or upload data.

## Phase 6 — Vercel launch

### Work

1. Create a Vercel project linked to the GitHub repository.
2. Deploy the first preview from a feature branch.
3. Verify the exact revision, build logs, and live preview independently.
4. Merge the release revision to `main`.
5. Attach `drawmcp.dev` and `www.drawmcp.dev` to the production project.
6. Verify DNS propagation, TLS issuance, canonical redirects, cache behavior,
   and direct-load routing.
7. Run the complete in-app-browser script against the production domain.

### Acceptance

- `https://drawmcp.dev` is public and serves the intended production revision.
- TLS is valid and the page loads in the in-app browser.
- WebMCP tools are discoverable and callable on production.
- No claim of production verification rests only on a green local build.

## Phase 7 — Challenge submission

### Repository release

- Remove secrets and private-only notes.
- Confirm upstream snapshot and submodule licensing/attribution.
- Make `MoizIbnYousaf/drawmcp` public.
- Ensure `LICENSE` is visible at repository root.
- Add final setup, architecture, deployment, and testing instructions.
- Create a tagged release matching the demonstrated production revision.

### Demo video, under three minutes

1. Problem: agents guess through visual UIs or require separately configured
   MCP services.
2. Baseline: show the official Excalidraw MCP flow briefly.
3. DrawMCP: open `drawmcp.dev`, draw a rough diagram, and invoke WebMCP.
4. Human moves/edits an element.
5. Agent reads the change and continues on the same canvas.
6. Show tool registration code and architecture in under 20 seconds.
7. Close with the specific WebMCP advantage and repository URL.

### Devpost copy

Answer directly:

- why a shared canvas is a strong WebMCP fit;
- how page-owned tools improve reliability and user control;
- what the person and agent can do together that required a handoff before;
- how the exact Excalidraw API and `document.modelContext.registerTool` are
  connected;
- what was tested in the in-app browser.

## Phase 8 — Official Excalidraw MCP contribution

This is a separate upstream effort after the production launch. The official
repository is an MCP App server, while DrawMCP is a standalone WebMCP site. A
successful contribution must respect that boundary.

### Candidate upstream shapes

Ranked from smallest to largest:

1. Documentation/example explaining MCP App versus WebMCP shared-page use cases
   and linking to a reusable integration example.
2. A framework-agnostic WebMCP registration helper for the fullscreen
   Excalidraw editor if maintainers want the MCP App widget to expose its local
   editor state to browser agents.
3. A reusable package or example extracted from DrawMCP, only if maintainers
   explicitly prefer code in this repository.

### Preparation

- Open a maintainer discussion or issue before a large code change.
- Rebase from the latest official default branch.
- Follow `vendor/excalidraw-mcp/CLAUDE.md` and its pnpm/build conventions.
- Keep the PR limited to an independently useful integration.
- Include tests, screenshots/video, tool schemas, security rationale, and a
  clear statement of what the PR does not change.
- Never include DrawMCP branding, deployment configuration, or private project
  history unless maintainers request it.

### Acceptance

- The upstream branch contains only changes relevant to
  `excalidraw/excalidraw-mcp`.
- All upstream checks pass locally.
- The PR description links the live proof and explains the architectural fit.
- Creating a PR is not described as acceptance or merge; those remain
  maintainer decisions.

## Scope protection

Do not add accounts, server persistence, multiplayer collaboration, generative
AI APIs, billing, or a custom chat UI before the complete challenge submission
path is green. They do not strengthen the core WebMCP proof enough to justify
their deadline risk.

## Release gate checklist

- [ ] Exact Excalidraw API adapter implemented
- [ ] Seven top-level WebMCP tools registered
- [ ] Human-agent conflict protection verified
- [ ] Unit and component tests passing
- [ ] Local lint and build passing
- [ ] Vercel preview verified in the in-app browser
- [ ] Production revision deployed to `drawmcp.dev`
- [ ] DNS and TLS verified
- [ ] Production WebMCP calls verified
- [ ] Repository scrubbed and made public
- [ ] Public demo video under three minutes
- [ ] Devpost submission complete
- [ ] Upstream contribution proposal prepared separately
