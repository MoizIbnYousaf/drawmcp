# WebMCP conformance reference

Audit date: 2026-09-02

Specification source: `webmachinelearning/webmcp@41d12f057167ccf5954dbcf49d99502cb6c84491`

Application baseline: `195afe3975c47d8f63eb4b7505905547d8c2660a`

## Status and authority

WebMCP is a Draft Community Group Report dated 26 August 2026. It is not a W3C Standard and is not on the W3C Standards Track. DrawMCP treats the live draft, Chrome's implementation guidance, and observed host behavior as separate evidence sources.

The normative interface currently exposes `document.modelContext` only in a secure context. `ModelContext` is an `EventTarget` with Promise-returning `registerTool`, `getTools`, and `executeTool` methods plus the `toolchange` event. DrawMCP needs only `registerTool` in production, but tests use discovery and direct execution where the browser exposes them.

## Imperative registration contract

| Contract | DrawMCP rule | Proof owner |
| --- | --- | --- |
| Tool registration returns a Promise | Await every registration and surface a rejected registration as an error state. | `src/webmcp/register-tools.test.ts` |
| Names are stable and unique | Keep the seven snake-case names and treat duplicate registration as an error. | `src/webmcp/tool-contracts.test.ts` |
| Input is described with JSON Schema | Export the exact production schemas and validate inputs again in the handler. | `src/webmcp/tool-contracts.ts`, `evals/tools.json` |
| Execution receives an AbortSignal | Honor aborts before an editor commit. Do not claim rollback after a synchronous commit begins. | `src/webmcp/tool-handlers.test.ts`, `src/excalidraw/canvas-service.test.ts` |
| Registration accepts an AbortSignal | Abort the shared registration lifecycle on unmount and settle the start path. | `src/webmcp/register-tools.ts` |
| Default origin policy is self | Do not set `exposedTo`; send `Permissions-Policy: tools=(self)` in production. | `vercel.json`, production headers |
| Read-only is an effect hint | Mark viewport changes and scene mutations as not read-only. | `src/webmcp/tool-contracts.test.ts` |
| Untrusted output is author-relative | Mark every result that can contain page-authored text or identifiers as untrusted. | `src/webmcp/tool-contracts.test.ts` |
| Tool output is agent input | Keep each serialized result within the project's 1,536-character budget and paginate scene reads. | `src/webmcp/tool-results.ts`, browser evals |

The 1,536-character result budget is a DrawMCP release rule derived from Chrome's recommendation. It is not a normative WebMCP limit.

## Security model

- Tool names, titles, descriptions, and schemas are static source-controlled metadata.
- Canvas text is untrusted data. Reading text must not turn that text into a new instruction or an implicit write.
- Tools accept no code, HTML, URL, selector, filesystem path, credential, or arbitrary options object.
- Canvas mutations use the mounted page's editor API and make no network request.
- The page remains usable when WebMCP is unavailable.
- Cross-origin exposure is disabled. Local persistence remains browser-local and has a documented clear path.

## Evaluation layers

| Layer | What it proves | What it does not prove |
| --- | --- | --- |
| Unit and component tests | Local schemas, lifecycle, mutation, result, and persistence logic. | Browser implementation or deployed behavior. |
| Chrome Labs smoke | A browser can discover and execute authored calls on a fresh page. | Correct DrawMCP failure receipts or correct final scene. |
| Project browser oracle | Structured result, visible scene effect, console cleanliness, and semantic diagram state. | Model tool choice. |
| Repeated model evals | Tool selection, arguments, ordering, no-tool behavior, and recovery for one recorded model/backend. | Every model or the ChatGPT judged host. |
| In-app-browser proof | The deployed page works in the judged host for the recorded journey. | General statistical reliability. |
| Web Platform Tests | The browser implements the platform API. | DrawMCP application correctness. |

The current Chrome Labs `webmcp-evals@0.0.4` smoke command does not treat DrawMCP's `{ "ok": false }` domain receipt as a tool transport error and does not check expected result constraints in smoke mode. DrawMCP therefore keeps smoke as discovery/execution evidence and owns its result and scene assertions.

The evaluator's Vercel adapter removes `anyOf` and `oneOf` from model-facing schemas. DrawMCP records both the exact production schema hash and any mapped evaluation schema hash so runner limitations are visible.

## Evidence levels

1. Source inspection.
2. Local deterministic tests.
3. Local browser execution with semantic scene assertions.
4. Vercel preview for an exact commit.
5. Production alias and deployment identity.
6. Production WebMCP discovery and execution.
7. Human-agent continuity in the judged host.
8. Repeated model evaluation for a named backend and model.
9. Reproducible benchmark for a named timing boundary.
10. Submitted Devpost record with public repository and video.

A lower level never substitutes for a higher level.

## Primary sources

- <https://webmachinelearning.github.io/webmcp/>
- <https://developer.chrome.com/docs/ai/webmcp>
- <https://developer.chrome.com/docs/ai/webmcp/best-practices>
- <https://developer.chrome.com/docs/ai/webmcp/imperative-api>
- <https://developer.chrome.com/docs/ai/webmcp/evals>
- <https://developer.chrome.com/docs/ai/webmcp/secure-tools>
- <https://developer.chrome.com/docs/ai/webmcp/compare-mcp>
- <https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/webmcp-evals>
- <https://wpt.fyi/results/webmcp>

