# Excalidraw architecture audit for DrawMCP

Audit date: 2026-09-01

Pinned upstream: `e1bb9ff8f8931e783c11d104abb8967ac6605c9a`

## Verdict

DrawMCP should embed `@excalidraw/excalidraw` and build exclusively on its
published React and imperative APIs. The upstream package already provides the
state access, programmatic element conversion, mutation, viewport, change
subscription, and undo capture semantics needed for WebMCP. A fork would add
deadline, merge, and maintenance risk without improving the core proof.

## Repository map

The pinned Excalidraw monorepo contains 1,227 tracked files. Its main ownership
boundaries are documented in `vendor/excalidraw/CLAUDE.md`:

- `packages/excalidraw/` — published React component and editor API;
- `excalidraw-app/` — the full excalidraw.com application;
- `packages/element`, `common`, `math`, and `utils` — internal/core packages;
- `dev-docs/` — published integration and API documentation;
- `examples/` — Next.js and script integrations.

DrawMCP consumes the published package. It does not copy `excalidraw-app` or
depend on the monorepo's internal path aliases.

## Embedding contract

`vendor/excalidraw/packages/excalidraw/README.md` establishes two essential
requirements:

1. import `@excalidraw/excalidraw/index.css`;
2. mount `<Excalidraw />` inside a container with non-zero height.

Excalidraw fills its parent's width and height. Vite provides a client-only
environment, avoiding the SSR boundary described for Next.js.

## Exact published API

The authoritative type is
`vendor/excalidraw/packages/excalidraw/types.ts` under
`ExcalidrawImperativeAPI`. Relevant methods are:

- `updateScene` — update elements/app state/collaborators;
- `getSceneElements` — live, non-deleted elements;
- `getSceneElementsIncludingDeleted` — full history-aware state;
- `getAppState` — selection, viewport, active tool, and editor state;
- `getFiles` — binary-file map;
- `scrollToContent` — focus all or specific elements;
- `onChange` — subscribe to element, app-state, and file changes;
- `onScrollChange` and pointer subscriptions — optional future context;
- `history.clear`, `setToast`, and other UI helpers.

The pinned upstream master exposes `onExcalidrawAPI` as soon as the API exists,
`onInitialize` after initial state loads, and `onChange` for controlled
observation. The installed `@excalidraw/excalidraw@0.18.1` declarations instead
expose `excalidrawAPI`. DrawMCP must bind to the installed callback and register
WebMCP tools only after initialization is safe.

## Mutation and undo semantics

The documented `updateScene` input accepts elements, partial app state,
collaborators, and `captureUpdate`. The three capture modes are:

- `CaptureUpdateAction.IMMEDIATELY` — immediately enters undo/redo history;
- `EVENTUALLY` — deferred capture for multi-step operations;
- `NEVER` — initialization or remote updates that should not enter history.

Agent actions are local visible user-facing edits, so the MVP should use
`IMMEDIATELY`. A high-level tool should batch its final element array into one
`updateScene` call where possible, making one coherent undo step.

## Programmatic element creation

The beta skeleton API is documented at
`vendor/excalidraw/dev-docs/docs/@excalidraw/excalidraw/api/excalidraw-element-skeleton.mdx`.
It accepts simplified rectangles, ellipses, diamonds, text, lines, arrows, and
binding information, then produces fully qualified editor elements through:

```ts
convertToExcalidrawElements(skeletons, { regenerateIds: false })
```

This is the correct agent-facing representation. It avoids asking the model to
supply internal fields such as versions, nonces, seeds, bound-element arrays,
and timestamps. It also supports labeled containers and arrow bindings that are
tedious to construct in raw Excalidraw JSON.

The API is marked beta, so DrawMCP must keep conversion behind one adapter and
cover it with tests. A future upstream signature change should affect one
module, not every tool.

## Selection and shared context

The current selection lives in `getAppState().selectedElementIds`. A WebMCP
selection tool must read it at execution time and join it with current elements
by ID. It must not persist a stale selection snapshot in React closure state.

The upstream `onChange` callback receives elements, app state, and files after
both human and programmatic changes. DrawMCP can use it to:

- update the scene revision;
- persist a versioned local scene;
- publish visible activity state;
- ensure the next agent read observes human edits.

## Custom data

The published props documentation permits a `customData` record on elements.
DrawMCP may use a namespaced field such as `customData.drawmcp` for operation
provenance when necessary, but should not pollute every element or expose that
metadata in normal tool results.

## Files and images

The API exposes `getFiles` and `addFiles`, but binary image manipulation expands
the security, token, persistence, and export surface. The MVP should preserve
existing image elements without accepting or returning binary data through
WebMCP tools. Image creation is a post-submission extension.

## Layout implications

Excalidraw does not provide a general-purpose automatic graph-layout API. The
signature `organize_diagram` tool should therefore operate over a bounded set
of supported nodes and connectors using deterministic DrawMCP layout code, then
submit the resulting elements through `updateScene`. It should not mutate DOM
coordinates or internal component state.

## Risks

1. Skeleton API is beta: isolate and test the adapter.
2. `onChange` fires for agent mutations: prevent double revision increments.
3. Replacing element arrays can disrupt history/bindings: retain IDs and use
   the published mutation/capture semantics.
4. Selection can change during agent execution: use revision preconditions.
5. Package dependency audit currently reports transitive advisories under
   Mermaid conversion dependencies: assess exploitability and upstream fixes
   before production release; do not blindly downgrade the editor.

## Reuse decisions

| Upstream capability | DrawMCP decision |
| --- | --- |
| React editor package | Use directly |
| Imperative API | Exact production boundary |
| Skeleton conversion | Use through one adapter |
| Excalidraw app shell | Do not copy |
| Collaboration backend | Out of MVP scope |
| Internal actions/store | Do not import |
| Export helpers | Add only after core loop works |
