# WebMCP implementation guidelines

Last updated: 2026-09-01

These rules are derived from the dated source snapshots under
`research/snapshots/`. The WebMCP specification is a Community Group draft and
can change. When a live platform and the draft disagree, record the platform
behavior and update this document deliberately.

## Supported surface for DrawMCP

DrawMCP targets ChatGPT's in-app browser first. As of the captured OpenAI guide:

- imperative JavaScript tools registered on the top-level page are supported;
- declarative form tools are not exposed as site tools;
- tools registered inside same-origin or cross-origin iframes are not
  discovered;
- tool availability is tied to the current page and may disappear on
  navigation or close;
- normal browser interaction remains a fallback when a suitable tool is absent.

Therefore, every MVP tool uses:

```ts
await document.modelContext.registerTool(tool, { signal });
```

The app feature-detects the method and remains useful when it is absent.

## Registration lifecycle

- Register only after the canvas service is ready.
- Create one `AbortController` per registration lifecycle.
- Abort registrations on component unmount or when the owning canvas changes.
- Avoid re-registering because React created a new object or callback identity.
- Under StrictMode, exactly one live registration of each name must remain.
- Treat duplicate-name registration as an implementation error.

## Names and descriptions

- Use 1–128-character stable names containing only alphanumerics, `_`, `-`, or
  `.`. DrawMCP standardizes on `snake_case`.
- Use a human-readable title when the host supports it.
- A description states what the tool does, which live state it acts on, and its
  observable effects.
- Descriptions never contain instructions to the agent unrelated to the tool.
- Do not encode permission claims in prose. The host and user decide whether an
  action is authorized.

## Input schemas

Every schema must:

- have `type: "object"` at the root;
- declare `additionalProperties: false`;
- distinguish required and optional fields;
- bound text length, array length, numbers, coordinates, and enumerations;
- accept stable IDs instead of natural-language element guesses when possible;
- avoid broad “options” bags and arbitrary JSON;
- avoid redundant parameters that can leak unnecessary user context.

Schema validation runs again in the `execute` handler. Browser or model-side
validation is not a security boundary.

## Annotations

- `readOnlyHint: true` is used only when execution cannot mutate canvas state,
  viewport state, persistence, network state, or user-visible UI.
- A visible viewport action such as `fit_to_content` is not described as purely
  read-only even though it does not change drawing elements.
- `untrustedContentHint: true` is used for results containing user-authored
  canvas text or other content that could carry prompt injection.
- An annotation is a hint, not proof of behavior or permission.

## Execution

- Read current state inside `execute`; never close over a stale canvas snapshot.
- Honor cancellation through the callback's signal for layout or large
  conversions.
- Serialize mutations to avoid interleaved `updateScene` calls.
- Check `expected_revision` immediately before mutation.
- Reuse the exact application logic that powers the human interface.
- Do not dispatch synthetic clicks when a direct Excalidraw API operation
  exists.
- Do not call external services from a local canvas tool.

## Results and verification

Results should be compact objects rather than prose-only claims. A mutating
receipt contains:

```ts
type MutationReceipt = {
  ok: true;
  operation: string;
  revisionBefore: number;
  revisionAfter: number;
  affectedElementIds: string[];
  elementCount: number;
  summary: string;
};
```

Errors are structured, actionable, and non-secret:

```ts
type ToolError = {
  ok: false;
  code: "INVALID_INPUT" | "STALE_REVISION" | "NOT_FOUND" | "CANCELED";
  message: string;
  currentRevision?: number;
};
```

Never return binary files, data URLs, the complete application state, tokens,
browser storage, or unrelated canvas content by default.

## Security and privacy

The specification highlights tool-description poisoning, output injection,
misrepresented intent, over-parameterization, same-origin boundary violations,
and differences between UI and tool validation paths.

DrawMCP mitigations:

- tool metadata is static source-controlled text;
- canvas-derived output is bounded and marked untrusted;
- tool code calls the same validation and mutation service as visible controls;
- local canvas tools cannot upload, share, navigate, or transact;
- input sizes have explicit hard limits;
- no tool accepts arbitrary code, HTML, URLs, selectors, or file paths;
- each mutation is visible and undoable;
- stale revisions fail closed;
- tools expose only the current DrawMCP document.

## Secure contexts and origins

`document.modelContext` is a secure-context API. Production must use HTTPS;
Vercel provides this after domain attachment and certificate issuance. Cross-
origin tool exposure is out of scope. The MVP registers tools only from the
top-level `drawmcp.dev` document.

## Progressive enhancement

The canvas loads and works without site tools. Unsupported browsers receive a
clear “WebMCP unavailable” status, not a broken editor. No core editing control
exists only as a WebMCP tool.

## Compatibility tests

For every release:

1. test with a fake `document.modelContext` in unit/component tests;
2. test without `document.modelContext`;
3. test a Vercel preview in ChatGPT's in-app browser;
4. enumerate the live tool names and schemas;
5. invoke every tool and verify the page state afterward;
6. record any divergence between the draft, Chrome, and OpenAI behavior.

## Source snapshots

- `research/snapshots/webmcp-spec-2026-09-01.md`
- `research/snapshots/chrome-webmcp-2026-09-01.md`
- `research/snapshots/openai-webmcp-2026-09-01.md`
- `research/snapshots/openai-webmcp-showcase-2026-09-01.md`
