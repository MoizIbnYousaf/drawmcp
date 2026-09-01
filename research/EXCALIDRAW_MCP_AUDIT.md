# Excalidraw MCP audit

Audit date: 2026-09-01

Pinned upstream: `157aa23ceb1976008aadc89eb05e3444060f09d6`

Live endpoint tested: `https://mcp.excalidraw.com/mcp`

## Verdict

The official Excalidraw MCP App is a sophisticated comparison baseline, not the
implementation base for DrawMCP. It solves remote MCP generation and rich chat
widget rendering. DrawMCP should reuse its lessons—bounded inputs, skeleton
conversion, checkpoints, visible editing, model context updates, and explicit
export confirmation—while replacing the server/widget state split with one
top-level page-owned Excalidraw canvas.

## Source architecture

The pinned repository contains 29 tracked files. The important path is:

```text
src/server.ts            MCP tools, app resource, validation, export proxy
src/main.ts              stdio and Streamable HTTP transports
api/mcp.ts               Vercel MCP handler
src/mcp-app.tsx          SVG streaming and fullscreen Excalidraw editor
src/edit-context.ts      local edit diffing and checkpoint synchronization
src/checkpoint-store.ts  file, memory, and Redis checkpoint stores
src/mcp-entry.tsx        production MCP App entry
scripts/build.mjs        widget/server build pipeline
```

## Live protocol proof

A direct MCP `initialize` call to `/mcp` succeeded with protocol version
`2025-06-18`, server name `Excalidraw`, server version `1.0.0`, and tool/resource
list-change capabilities. The bare host root returned an HTTP 308 redirect to
`/mcp`, which compatible clients may follow but is an interoperability detail
worth retaining in the baseline.

The live `tools/list` response advertised five tools:

| Tool | Audience | Effect |
| --- | --- | --- |
| `read_me` | agent | returns the element-format guide |
| `create_view` | agent | creates a diagram/checkpoint and MCP App result |
| `export_to_excalidraw` | app only | uploads serialized diagram to Excalidraw |
| `save_checkpoint` | app only | persists edited checkpoint state |
| `read_checkpoint` | app only | restores checkpoint state |

The live app resource was `ui://excalidraw/mcp-app.html` with MIME type
`text/html;profile=mcp-app` and approximately 432 KB of self-contained HTML.

The audit successfully called `read_me` and then `create_view`. `create_view`
returned a checkpoint ID and a structured checkpoint receipt. A raw protocol
call proves the server contract, but it does not prove that this Codex task can
render the MCP App widget; that requires the MCP to be loaded at task startup in
a compatible host.

## Server tools

`src/server.ts` registers tools through `registerAppTool` and enforces a 5 MB
string input limit. `read_me` teaches a compact element format. `create_view`:

1. parses the JSON element string;
2. resolves an optional restore checkpoint;
3. processes delete pseudo-elements and bound text;
4. validates viewport aspect-ratio expectations;
5. saves a fully resolved checkpoint;
6. returns the MCP App resource and checkpoint receipt.

The export tool serializes and encrypts a diagram before uploading through an
Excalidraw endpoint. It is intentionally app-only and the widget asks for user
confirmation before upload/open.

## Widget pipeline

The widget receives partial and final MCP tool input. During streaming it:

- parses complete elements from partial JSON;
- converts simplified/raw elements with `convertToExcalidrawElements`;
- renders SVG through `exportToSvg`;
- diffs SVG with `morphdom` so prior shapes do not reanimate;
- animates camera updates and element appearance.

In fullscreen mode it mounts the real `<Excalidraw>` component, reads state via
`getSceneElements` and `getAppState`, and applies updates with `updateScene`.
`edit-context.ts` observes human changes, saves them to local storage and the
checkpoint tool, and sends a compact edit diff back to model context.

## Checkpoint model

The server selects among file, in-memory, and Redis stores. Redis checkpoints
have a 30-day TTL; the widget also keeps a browser-local cache. This solves
continuation across MCP calls without requiring the model to resend the full
diagram.

DrawMCP does not need this two-tier server checkpoint design for the MVP because
the mounted page is already canonical. It should adopt the useful principles:

- version state explicitly;
- give the agent a compact continuation token/revision;
- preserve human edits between calls;
- reject stale mutations;
- persist locally for refresh recovery.

## Strengths to learn from

- clear agent-facing format guide;
- progressive rendering and visible camera motion;
- interactive edit loop rather than static image output;
- checkpoint restore and deletion semantics;
- bounded input sizes;
- app-only visibility for internal tools;
- explicit confirmation before external upload;
- model context updated after human edits;
- live SVG preview followed by full editor access.

## Gaps and comparison opportunities

1. The user must configure an MCP connection or use a host integration; DrawMCP
   tools appear with the opened page.
2. Canonical state spans server checkpoints, widget storage, and fullscreen
   editor state; DrawMCP owns one mounted canvas state.
3. The primary agent tool is coarse (`create_view`); DrawMCP exposes selection-
   aware primitives and deterministic organization.
4. The flow can culminate in “Open in Excalidraw”; DrawMCP starts and stays in
   the editable web canvas.
5. `create_view` advertises `readOnlyHint: true` while it creates persisted
   checkpoint state. This is a useful warning to keep DrawMCP annotations
   semantically exact.
6. The `create_view` result tells the model to use a `read_widget_context` tool,
   but that name is not present in the server's advertised tool list. Host-level
   widget context may supply the intended behavior, but the response contract
   is confusing when audited at raw MCP level.
7. The root-to-`/mcp` redirect is a small client-compatibility variable that
   DrawMCP avoids because WebMCP tools are page-local.

## What not to copy

- Do not run an MCP server just to expose the same page's local canvas.
- Do not render an iframe MCP App inside DrawMCP; ChatGPT does not discover
  iframe-registered site tools in the captured implementation.
- Do not make a giant `create_view` JSON string the only mutation surface.
- Do not mark state-creating operations as read-only.
- Do not introduce Redis/checkpoint infrastructure before the live shared-page
  loop is complete.

## Upstream contribution implications

The official repository is optimized for MCP Apps. A future PR should therefore
be framed as documentation, an example, or an optional integration that adds
value to the widget. DrawMCP's standalone app, domain, Vercel configuration,
and product shell do not belong in the upstream PR.
