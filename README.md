# DrawMCP

DrawMCP is an Excalidraw-based canvas where a person and a browser agent work
on the same live drawing through WebMCP.

The surrounding website UI uses
[Drawably](https://github.com/Danilaa1/drawably) `0.3.10` for semantic HTML
controls with generated SVG chrome. Inter and Geist Mono are bundled locally,
while the optional Drawably Pen font is limited to sketch annotations.
Excalidraw remains the editor itself.

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

DrawMCP is live at [drawmcp.dev](https://drawmcp.dev). It mounts the published
Excalidraw editor and exposes seven page-owned WebMCP tools with closed schemas,
runtime validation, revision guards, pre-commit cancellation, bounded paginated
results, undoable mutations, local non-file recovery, visible timing telemetry,
and the editor’s complete native keyboard surface.

- Production domain: `drawmcp.dev`
- Hosting target: Vercel
- Repository visibility: private during development
- WebMCP API status: W3C Community Group draft, not a W3C Standard

## WebMCP Challenge submission

The project was created during the 2026 challenge window. Its first commit is
dated September 1, 2026, and the repository history keeps the WebMCP work
separate and reviewable. Judges can follow the 90-second verification path on
the [live docs](https://drawmcp.dev/docs#judge-path).

- [Submission checklist and judging map](docs/DEVPOST_SUBMISSION.md)
- [Under-three-minute narrated demo script](docs/DEMO_SCRIPT.md)

The paired silent loops on the homepage explain the two protocol boundaries.
They do not replace the required narrated YouTube submission video.

The live tool surface is:

- `get_canvas_summary`
- `get_selection`
- `add_elements`
- `update_elements`
- `delete_elements`
- `fit_to_content`
- `organize_diagram`

The current candidate has passed 105 deterministic tests, 17/17 project-owned
browser proof steps, the Chrome Labs runner's 11/11 authored smoke calls, and
125/125 repeated local-model decisions. The accepted controlled benchmark has
220/220 semantically correct trials across 100 warm and 10 cold pairs per lane.
Its component boundaries contain different work, so the site does not claim an
overall latency winner. Production proof is repeated after the exact candidate
is deployed.

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
video/comparison/            HyperFrames sources for the paired demos
public/videos/               Web-ready MP4 loops and reduced-motion posters
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
npm run video:check
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
8. [Devpost submission checklist](docs/DEVPOST_SUBMISSION.md)
9. [Excalidraw shortcuts audit](research/EXCALIDRAW_SHORTCUTS_AUDIT.md)
10. [WebMCP conformance reference](research/WEBMCP_CONFORMANCE.md)
11. [Excalidraw capability matrix](research/EXCALIDRAW_CAPABILITY_MATRIX.md)

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
