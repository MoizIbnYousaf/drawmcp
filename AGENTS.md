# DrawMCP agent instructions

## Mission

Build a credible human-agent shared canvas that proves why WebMCP is different
from a separately installed MCP server. Preserve the ordinary Excalidraw user
experience while giving browser agents a small, reliable, and inspectable tool
surface over the same live state.

## Source ownership

- DrawMCP application code lives in `src/`.
- Project decisions live in `docs/` and source-backed analysis in `research/`.
- `vendor/excalidraw` and `vendor/excalidraw-mcp` are pinned, read-only Git
  submodules. Never edit, reformat, or commit changes inside them.
- Depend on `@excalidraw/excalidraw`; do not fork the editor unless the plan is
  explicitly amended with a source-backed reason.
- Do not copy upstream implementation wholesale. Preserve attribution and cite
  the exact upstream file when adapting a pattern.

## Exact Excalidraw API boundary

Production code must build on the published `@excalidraw/excalidraw` API. The
installed `0.18.1` boundary is `excalidrawAPI`, `getSceneElements`, `getAppState`,
`getFiles`, `convertToExcalidrawElements`, `updateScene`, `scrollToContent`,
`onChange`, and `CaptureUpdateAction`. Do not import private component state,
call undocumented editor internals, or maintain a source fork for the MVP. The
newer vendored master uses `onExcalidrawAPI`; do not use that name until the
installed package exports it.

## Architecture rules

1. The mounted Excalidraw editor is the single source of truth.
2. Human controls and WebMCP tools call the same typed canvas service.
3. Register WebMCP tools imperatively from the top-level document.
4. Feature-detect `document.modelContext`; the app must work without it.
5. Tie every tool registration to component lifetime with an `AbortSignal`.
6. Agent mutations must be visible, immediately undoable, and revision-aware.
7. Never register tools from an iframe. ChatGPT's in-app browser does not
   discover iframe tools as of the dated OpenAI guide in `research/snapshots/`.
8. Do not introduce a backend merely to implement WebMCP. Add persistence or a
   server only when a user-facing requirement needs it.

## Tool contract rules

- Tool names are stable `snake_case` identifiers.
- Use closed JSON Schemas with `additionalProperties: false`.
- Constrain string lengths, array sizes, coordinates, and element counts.
- Describe observable effects and preconditions, not implementation trivia.
- Mark only genuinely read-only tools with `readOnlyHint: true`.
- Mark responses containing canvas/user-authored text with
  `untrustedContentHint: true` when supported.
- Accept the execution callback's cancellation signal for expensive work.
- Return a structured verification receipt: revision before/after, affected
  element IDs, counts, and a concise summary.
- Never expose arbitrary JavaScript, selectors, URLs, file paths, or raw DOM
  execution as tool parameters.

## State and conflict rules

- Increment a scene revision for every accepted human or agent mutation.
- Mutation tools accept an optional expected revision. Reject stale writes with
  current revision and recovery guidance; never silently overwrite.
- Read selection from `appState.selectedElementIds` at execution time.
- Preserve IDs unless a tool explicitly creates new elements.
- Use Excalidraw's skeleton conversion for agent-authored shapes, then pass
  fully qualified elements to `updateScene`.
- Use `CaptureUpdateAction.IMMEDIATELY` for agent mutations so undo/redo works.
- Preserve deleted elements when an Excalidraw API requires them for history;
  never splice state in ways that bypass editor invariants.

## Security rules

- Treat tool names, descriptions, inputs, canvas text, and results as untrusted
  data at every trust boundary.
- Reuse the application's authorization and validation path; tools never bypass
  a check the visible UI performs.
- Read-only state tools must minimize returned data. Do not include image
  payloads, private metadata, or unrelated application state by default.
- Any future export, upload, share, or external navigation tool must be
  separated from local canvas mutation and documented as an external effect.
- Keep all current tools local to the page for the MVP.

## Verification rules

Before calling a tool complete:

1. Unit-test schema rejection and canvas-service behavior.
2. Verify registration and unregistration with a fake `modelContext`.
3. Verify human edits followed by agent edits against the same canvas.
4. Verify undo/redo after every mutating tool.
5. Verify the app without WebMCP support.
6. Build and lint locally.
7. Deploy a Vercel preview and test it in ChatGPT's in-app browser.

Tests, local builds, preview deployments, production deployments, DNS, and live
WebMCP calls are separate proof levels. Report them separately.

## Required reading

- `docs/APPROACH.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/WEBMCP_GUIDELINES.md`
- `docs/PROOF_PLAN.md`
- `docs/UPSTREAM_CONTRIBUTION.md`
- `research/EXCALIDRAW_ARCHITECTURE.md`
- `research/EXCALIDRAW_MCP_AUDIT.md`
