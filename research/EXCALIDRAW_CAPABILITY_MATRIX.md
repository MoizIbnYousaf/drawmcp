# Excalidraw capability matrix

Audit date: 2026-09-02

Installed editor: `@excalidraw/excalidraw@0.18.1`

Pinned editor source: `excalidraw/excalidraw@e1bb9ff8f8931e783c11d104abb8967ac6605c9a`

Pinned MCP source: `excalidraw/excalidraw-mcp@157aa23ceb1976008aadc89eb05e3444060f09d6`

## Comparison rule

DrawMCP targets capability parity for the shared diagram journey, not literal transport parity. The normal Excalidraw editor remains broader than the agent tool surface. The official MCP App remains broader in streaming, remote checkpoints, widget resources, and export. Those differences are part of the comparison.

## Editor and agent surface

| Capability | Native editor | DrawMCP agent | Treatment |
| --- | --- | --- | --- |
| Rectangles, ellipses, diamonds | Yes | Yes | Supported through skeleton conversion. |
| Text and shape labels | Yes | Yes | Supported with bounded text. |
| Lines and arrows | Yes | Yes | Supported with bounded points. |
| Bound straight connectors | Yes | Planned release requirement | Use the published skeleton `start` and `end` references. |
| Selection | Yes | Read | Read current IDs and compact projections at execution time. |
| Move, resize, recolor, lock, rotate | Yes | Bounded update | Only allowlisted fields are writable. |
| Delete | Yes | Yes | Delete named live elements plus owned bound text. |
| Viewport fit | Yes | Yes | Page-visible effect, not a read-only tool. |
| Deterministic node layout | No general native API | Yes | DrawMCP-owned layout over a bounded supported subset. |
| Undo and Redo | Yes | Indirect | Agent changes enter native current-session history as one action. |
| Keyboard shortcuts | Yes | Not duplicated | Native Excalidraw handling remains authoritative. |
| Free draw | Yes | Preserve only | Human-created elements survive agent mutations but cannot be created by tools. |
| Images and files | Yes | Out of scope | No binary input or output through WebMCP. |
| Frames, embeddables, libraries | Yes | Preserve only | No agent creation contract in this release. |
| Multiplayer collaboration | App feature | Out of scope | No server or collaboration backend. |
| Reload recovery | Host responsibility | Local non-file scene | Restore a versioned scene, not the previous history stack. |

## Official MCP surface

The official MCP registers five tools. `read_me` and `create_view` are model-visible. `export_to_excalidraw`, `save_checkpoint`, and `read_checkpoint` are app-only.

| MCP capability | DrawMCP equivalent | Classification |
| --- | --- | --- |
| `read_me` element guide | Closed schemas, tool descriptions, `/docs` | Equivalent guidance through different surfaces. |
| `create_view` coarse generation | Read, add, update, delete, fit, organize | Equivalent target outcome with finer page tools. |
| `cameraUpdate` pseudo-elements | `fit_to_content` | Equivalent visible intent, different API. |
| Delete pseudo-elements | `delete_elements` | Equivalent outcome with stable IDs. |
| Restore checkpoint | Live page revision and local reload snapshot | Complementary state model, not transport parity. |
| Partial tool-input streaming | None | Deliberate non-parity. |
| SVG draw-on animation and audio | Homepage explanation only | Presentation non-parity. |
| Fullscreen widget editor | Top-level full editor | Equivalent editing outcome without a widget transition. |
| Human edit model context | Next page read plus revision | Equivalent continuation outcome. |
| Local, memory, and Redis checkpoints | Browser-local non-file recovery only | Remote persistence out of scope. |
| Export and upload | None | External side effect intentionally out of scope. |
| stdio and Streamable HTTP | Document registration | Different protocol boundary. |
| MCP App resource and CSP | Ordinary Vercel page | Different rendering boundary. |

## Upstream contribution candidate

`create_view` persists a checkpoint and creates a visible widget result while advertising `readOnlyHint: true`. A locally validated contribution candidate corrects that annotation and adds a focused contract check. No public submission or remote branch is active; publishing requires the user's explicit review and approval. DrawMCP benchmarking, branding, and page tools do not belong in that contribution.
