# Research index

Research in this directory is source-backed and dated. It informs DrawMCP but
does not replace live verification when upstream repositories, documentation,
or hosted services change.

## Audits

- `EXCALIDRAW_ARCHITECTURE.md` — published editor API and integration boundary
- `EXCALIDRAW_MCP_AUDIT.md` — MCP server, widget, checkpoint, and live endpoint

## Snapshots

The Markdown files in `snapshots/` were extracted with Firecrawl on
2026-09-01. Each preserves its source URL and original links. They are retained
inside the private repository for implementation research and change detection;
their original authors retain their rights.

Refresh snapshots intentionally and review the resulting diff. Do not silently
replace a snapshot during unrelated implementation work.

## Upstream source

The complete source trees used for the audits are pinned as Git submodules:

- `vendor/excalidraw` at `e1bb9ff8f8931e783c11d104abb8967ac6605c9a`
- `vendor/excalidraw-mcp` at `157aa23ceb1976008aadc89eb05e3444060f09d6`
