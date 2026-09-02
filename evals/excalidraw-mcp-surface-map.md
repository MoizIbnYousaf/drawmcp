# Excalidraw MCP surface map

Pinned baseline: `vendor/excalidraw-mcp` at `157aa23ceb1976008aadc89eb05e3444060f09d6`.

The server registers five tools. `read_me` and `create_view` are model-visible;
`export_to_excalidraw`, `save_checkpoint`, and `read_checkpoint` are app-only.

| Official MCP surface                              | Source                                   | DrawMCP treatment                                                                              | Proof                                 |
| ------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------- |
| `read_me` format guide                            | `src/server.ts`                          | Tool schemas and descriptions are self-describing; `/docs` will provide the human guide        | Schema tests and tool-selection evals |
| `create_view` generation tool                     | `src/server.ts`                          | Decomposed into read, add, update, delete, focus, and organize page tools                      | Unit tests and live WebMCP calls      |
| Five-megabyte raw input cap                       | `src/server.ts`                          | Replaced with per-tool array, text, ID, coordinate, dimension, and spacing limits              | AJV rejection tests                   |
| `cameraUpdate` pseudo-elements                    | `src/server.ts`, `src/mcp-app.tsx`       | `fit_to_content` is a visible page UI tool; camera scripting is not accepted as element data   | Focus tests and live viewport call    |
| `delete` pseudo-elements                          | `src/server.ts`                          | `delete_elements` acts on current stable IDs and owned bound text                              | Delete and bound-text tests           |
| `restoreCheckpoint` pseudo-elements               | `src/server.ts`                          | Replaced by the current page revision and stale-write precondition                             | Revision and stale-write tests        |
| Widget HTML resource                              | `src/server.ts`, `src/mcp-app.html`      | Replaced by the top-level DrawMCP website and mounted Excalidraw editor                        | In-app-browser discovery              |
| Partial tool-input streaming                      | `src/mcp-app.tsx`                        | Explicit contrast: current WebMCP execution is final-call based; no fake streaming             | Documented non-parity                 |
| SVG draw-on animation                             | `src/mcp-app.tsx`, `global.css`          | Deferred to the later website comparison; not part of core mutation semantics                  | Scope boundary                        |
| Fullscreen Excalidraw editing                     | `src/mcp-app.tsx`                        | The normal page is already the full editor                                                     | Canvas smoke and screenshot           |
| Human edit diff to model context                  | `src/edit-context.ts`                    | Current selection, summary, revision, and structured receipts are available through page tools | Human-agent continuity eval           |
| Local-storage checkpoint cache                    | `src/edit-context.ts`                    | Use a versioned browser-local non-file recovery snapshot; do not claim server or history parity | Reload integration test               |
| File, memory, and Redis checkpoints               | `src/checkpoint-store.ts`                | Not applicable to the local core; no backend canonical state                                   | Architecture assertion                |
| `save_checkpoint` and `read_checkpoint` app tools | `src/server.ts`                          | Replaced by revision-aware live state; no private widget tool tier                             | Tool-list proof                       |
| `export_to_excalidraw` upload                     | `src/server.ts`, `src/mcp-app.tsx`       | Deferred external side effect; core tools do not upload or navigate                            | Network-effect audit                  |
| Streamable HTTP and stdio transports              | `src/main.ts`                            | Not applicable; WebMCP tools are registered by the opened page                                 | Protocol comparison                   |
| `/mcp` Vercel handler and root redirect           | `api/mcp.ts`, `vercel.json`              | Replaced by ordinary Vercel page deployment and HTTPS                                          | Preview deployment proof              |
| MCP App CSP and resource domains                  | `src/server.ts`                          | DrawMCP uses the page's CSP/asset policy; no MCP App iframe resource                           | Build and browser console audit       |
| Screenshot model context                          | `src/mcp-app.tsx`                        | Not required for structured state; visual screenshot remains a proof artifact                  | Receipt-versus-image comparison       |
| Pencil audio and camera motion                    | `src/pencil-audio.ts`, `src/mcp-app.tsx` | Deferred presentation polish                                                                   | Scope boundary                        |
| Dev mock and standalone widget harness            | `src/dev-mock.ts`, `src/dev.tsx`         | Replaced by fake model-context unit tests and real in-app-browser tools                        | Test and live proof layers            |
| Build pipeline                                    | `scripts/build.mjs`                      | DrawMCP uses TypeScript, Vite, unit tests, CI, and Vercel preview gates                        | Verification contract                 |
| `create_view` mutation annotation                 | `src/server.ts`                          | Upstream marks a checkpoint-creating tool read-only; prepare a narrow annotation correction     | Upstream contract test                |
