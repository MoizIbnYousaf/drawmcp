# Contributing to DrawMCP

DrawMCP is being developed against an experimental browser standard. Changes
must be small, source-backed, and independently verifiable.

## Development workflow

1. Read `AGENTS.md` and the documents it references.
2. Create a feature branch from `main`.
3. Keep `vendor/` submodules unchanged unless the change is an intentional
   upstream pin update.
4. Add or update tests with behavioral changes.
5. Run `npm run lint` and `npm run build`.
6. Explain WebMCP contract changes in the pull request.

## Pull-request evidence

A pull request that changes a WebMCP tool must include:

- tool name and whether it is read-only or mutating;
- input-schema changes and compatibility impact;
- visible human experience before and after;
- unit-test evidence;
- in-app-browser evidence when the page tool surface changes;
- confirmation that ordinary non-WebMCP use still works.

## Upstream attribution

When adapting an Excalidraw or Excalidraw MCP pattern, link the upstream file and
record the pinned commit. Do not remove upstream copyright or license notices.
