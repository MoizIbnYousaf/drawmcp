# DrawMCP approach

Last updated: 2026-09-01

## Thesis

DrawMCP is not “Excalidraw with another AI chat box.” It is a protocol
demonstration in which the human interface and the agent tool surface are two
views over one page-owned state machine.

The official Excalidraw MCP App is the comparison baseline. It proves that a
remote MCP server can generate a rich diagram, stream it into an MCP App, allow
fullscreen editing, persist checkpoints, and export into Excalidraw. DrawMCP
asks a different question: what improves when the agent discovers tools simply
because the person opened the drawing website?

## The contrast we will demonstrate

| Dimension | Excalidraw MCP App | DrawMCP WebMCP |
| --- | --- | --- |
| Discovery | Configure or install an MCP service | Open `drawmcp.dev` |
| Tool owner | Remote/local MCP server | Current top-level web page |
| Primary state | Server/widget checkpoint | Mounted Excalidraw canvas |
| Human surface | MCP App widget/fullscreen editor | Normal web application |
| Agent context | Tool arguments plus checkpoint/widget context | Live canvas, selection, viewport, revision |
| Handoff | Export/open in Excalidraw when leaving widget | No handoff; already in the editor |
| Lifetime | Independent of a page being open | Available only while the page owns the state |

Neither model universally replaces the other. The submission should make the
trade-off legible and show the workflow where WebMCP is the better fit.

## Product experience

The first screen is a real, immediately usable Excalidraw canvas. A compact
DrawMCP status surface communicates:

- whether WebMCP is available;
- which tools are registered;
- the current scene revision;
- the last human or agent action;
- whether an agent mutation is currently running.

There is no custom prompt box in the MVP. The user asks Codex or ChatGPT Work in
the host chat, and the agent calls page tools. This keeps the proof about the
browser protocol rather than a bespoke LLM integration.

## State architecture

```text
Human UI event ───────┐
                     v
              CanvasService ─────> ExcalidrawImperativeAPI
                     ^                      |
WebMCP execute ───────┘                      v
                                    onChange / revision receipt
```

`CanvasService` is the only supported mutation boundary. It reads from and
writes through the published `ExcalidrawImperativeAPI`, validates agent-shaped
data, preserves undo history, and emits a compact operation receipt. WebMCP
tools are thin adapters around this service.

## Exact upstream API contract

DrawMCP builds on `@excalidraw/excalidraw`, currently pinned in `package.json`.
The MVP uses only its published surface:

- `onExcalidrawAPI` to capture the live imperative API;
- `getSceneElements`, `getAppState`, and `getFiles` for current state;
- `convertToExcalidrawElements` for simplified skeleton input;
- `updateScene` with `CaptureUpdateAction.IMMEDIATELY` for mutations;
- `scrollToContent` for visible focus changes;
- `onChange` for revision tracking and human-agent continuity.

The full upstream source submodule is evidence and documentation. It is not a
license to depend on private internals or turn DrawMCP into a source fork.

## Element representation

Agent-facing mutation inputs use Excalidraw's simplified element skeleton
format, not the full internal element type. The app calls
`convertToExcalidrawElements(..., { regenerateIds: false })` before applying a
scene update. This choice:

- reduces invalid fields and token cost;
- supports labeled containers and bound arrows;
- follows the current upstream programmatic API;
- keeps Excalidraw's normalization logic in charge.

Read tools return a compact projection by default. Full internal element state
is available only through a deliberately named diagnostic tool if the demo
proves it necessary.

## Tool surface

The MVP exposes small primitives plus one experience-level tool:

1. `get_canvas_summary` — revision, element counts, bounds, and concise labels.
2. `get_selection` — the current human selection and compact element details.
3. `add_elements` — append validated skeleton elements.
4. `update_elements` — patch a narrow allowlist of fields by stable ID.
5. `delete_elements` — mark specific IDs deleted through the editor API.
6. `fit_to_content` — visibly focus the canvas on all or selected elements.
7. `organize_diagram` — deterministic layout over selected/all supported nodes.

`organize_diagram` is the signature proof: a person can make a rough sketch,
select it, and ask the agent to clean it up without serializing the canvas into
a separate service.

## Revision and conflict model

Every scene change updates a monotonically increasing local revision. Mutating
tools may include `expected_revision`:

- matching revision: apply the operation;
- missing revision: apply to the latest state and report both revisions;
- stale revision: reject with the current revision and a compact fresh summary.

This prevents a slow agent call from silently overwriting edits the person made
while it was thinking.

## Why no backend in the MVP

WebMCP executes in the page and can reuse the current signed-in session and
application logic. A backend is unnecessary for the core proof. The MVP uses
local browser persistence for recovery and export. Server persistence,
collaboration, authentication, and accounts remain explicit non-goals unless
time remains after the complete submission path works.

## Brand and attribution

The project is branded DrawMCP, not Excalidraw WebMCP. Product copy may say
“built with Excalidraw” and must link upstream. It must not imply that DrawMCP is
an official Excalidraw product or that Excalidraw endorses the submission.

## Success criteria

The approach succeeds only if a judge can:

1. open a public URL without configuring an MCP server;
2. draw or select something manually;
3. ask the host agent to inspect and modify that exact state;
4. undo the agent change in Excalidraw;
5. edit manually and ask the agent to continue correctly;
6. understand, from the demo, why this differs from the MCP App baseline.
