# DrawMCP

DrawMCP is an Excalidraw-based canvas where a person and a browser agent work
on the same live drawing through WebMCP.

- `/` explains the side-by-side protocol comparison.
- `/canvas` owns the live Excalidraw editor and all seven WebMCP tools.
- `/benchmarks` visualizes verified evidence and the controlled-run boundary.
- `/docs` documents WebMCP, the official MCP lane, security, and deployment.

The project is being built for the 2026 WebMCP Challenge. Its central question
is:

> What becomes possible when an agent's drawing tools live inside the website
> and share the human's current canvas, selection, viewport, and undo history?

DrawMCP is intentionally compared with the official Excalidraw MCP App. The
existing MCP service is a strong remote MCP experience that generates an
interactive diagram widget. DrawMCP explores the complementary browser-native
model: the website itself exposes tools over `document.modelContext`, and the
agent operates the page the human is already editing.

## Status

The core browser-native implementation is working locally. DrawMCP mounts the
published Excalidraw editor and exposes seven page-owned WebMCP tools with
closed schemas, runtime validation, revision guards, cancellation handling,
undoable mutations, and visible timing telemetry.

- Production domain: `drawmcp.dev`
- Hosting target: Vercel
- Repository visibility: private during development
- WebMCP API status: W3C Community Group draft, not a W3C Standard

The live tool surface is:

- `get_canvas_summary`
- `get_selection`
- `add_elements`
- `update_elements`
- `delete_elements`
- `fit_to_content`
- `organize_diagram`

The core has passed 46 deterministic tests, the Chrome Labs WebMCP smoke
runner's 11 expected calls across seven cases, and a real in-app-browser
human → WebMCP edit → Undo → Redo continuity journey. Deployment and the
side-by-side comparison website remain release gates, not completed claims.

## Product contract

The MVP must demonstrate this exact loop:

1. A person sketches or selects content in the Excalidraw canvas.
2. An agent reads the current page-owned state through WebMCP.
3. The agent adds, edits, removes, or organizes elements through bounded tools.
4. The person manually changes the result in the normal Excalidraw UI.
5. The agent observes the new state and continues without an export/import
   handoff or separately configured MCP server.

The normal canvas must remain useful when WebMCP is unavailable.

## Repository map

```text
src/                         DrawMCP application
evals/                       Schemas, smoke cases, surface map, benchmark plan
scripts/                     Generated-fixture tooling
docs/APPROACH.md             Product and architecture decisions
docs/IMPLEMENTATION_PLAN.md  End-to-end delivery plan
docs/WEBMCP_GUIDELINES.md    Mandatory WebMCP implementation rules
research/                    Source-backed upstream audits
research/snapshots/          Dated documentation snapshots
vendor/excalidraw/           Pinned upstream Excalidraw submodule
vendor/excalidraw-mcp/       Pinned upstream Excalidraw MCP submodule
```

The `vendor/` repositories are read-only research dependencies. They retain
their own history, authorship, and licenses and must not be edited as DrawMCP
source.

## Local setup

Clone with submodules:

```bash
git clone --recurse-submodules git@github.com:MoizIbnYousaf/drawmcp.git
cd drawmcp
npm install
npm run dev
```

If the repository was cloned without submodules:

```bash
git submodule update --init --recursive
```

Run the current checks:

```bash
npm run lint
npm test
npm run evals:check
npm run build
```

With the development server running, execute the official deterministic
WebMCP smoke cases in another terminal:

```bash
npm run evals:smoke:local
```

## Authoritative documents

Read these before implementation:

1. [Approach](docs/APPROACH.md)
2. [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
3. [WebMCP guidelines](docs/WEBMCP_GUIDELINES.md)
4. [Proof and side-by-side plan](docs/PROOF_PLAN.md)
5. [Upstream contribution strategy](docs/UPSTREAM_CONTRIBUTION.md)
6. [Excalidraw architecture audit](research/EXCALIDRAW_ARCHITECTURE.md)
7. [Excalidraw MCP audit](research/EXCALIDRAW_MCP_AUDIT.md)

## Upstream projects

- [Excalidraw](https://github.com/excalidraw/excalidraw), pinned at the commit
  recorded by `vendor/excalidraw`
- [Excalidraw MCP](https://github.com/excalidraw/excalidraw-mcp), pinned at the
  commit recorded by `vendor/excalidraw-mcp`

DrawMCP is an independent hackathon project. Excalidraw is a trademark of its
respective owner. This repository does not claim endorsement by Excalidraw.

## License

DrawMCP's original code is licensed under the MIT License. The two Git
submodules and documentation snapshots remain subject to their respective
upstream terms and licenses.
