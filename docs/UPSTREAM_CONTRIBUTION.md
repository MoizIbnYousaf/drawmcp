# Upstream contribution strategy

Target: `https://github.com/excalidraw/excalidraw-mcp`

## Principle

DrawMCP and Excalidraw MCP solve adjacent problems with different protocol
ownership. DrawMCP is a top-level website exposing browser tools. Excalidraw MCP
is a server that returns an MCP App widget. The upstream contribution must add
value to the latter without forcing DrawMCP's standalone product architecture
into it.

## Gate before upstream work

Do not open a pull request until:

- `drawmcp.dev` is live and tested;
- the WebMCP tools have stable names and tests;
- the DrawMCP repository is public;
- the demo proves a maintainable use case;
- the latest upstream branch and contribution instructions are reread.

## Proposed sequence

1. Open a concise issue/discussion with the live proof, architecture contrast,
   and two or three possible contribution shapes.
2. Ask maintainers whether they prefer documentation, an example, or a reusable
   widget integration.
3. Create a clean branch from current upstream `main`.
4. Port only the accepted scope with upstream conventions and no DrawMCP product
   dependencies.
5. Run the upstream `pnpm` build and relevant tests.
6. Open a focused PR with screenshots, security notes, and live demo evidence.

## Likely first PR

The safest first proposal is a documented example showing how the fullscreen
Excalidraw editor could register page-scoped tools when hosted in a compatible
top-level environment, along with a clear comparison of MCP App and WebMCP use
cases. A code integration should follow only if maintainers confirm that it
belongs in the MCP repository.

## Non-goals

- No wholesale copy of DrawMCP.
- No Vercel/domain/submission configuration.
- No rebranding of the Excalidraw MCP service.
- No claim that an opened PR has been accepted or merged.
