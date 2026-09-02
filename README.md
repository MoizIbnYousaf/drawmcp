# DrawMCP

DrawMCP is a WebMCP fork of the current Excalidraw MCP that allows the
interactive use of Excalidraw.

The surrounding website UI uses
[Drawably](https://github.com/Danilaa1/drawably) `0.3.10` for semantic HTML
controls with generated SVG chrome. Inter and Geist Mono are bundled locally,
while the optional Drawably Pen font is limited to sketch annotations.
Excalidraw remains the editor itself.

- `/` shows the live MCP-versus-WebMCP comparison and speed result.
- `/canvas` owns the live Excalidraw editor and all seven WebMCP tools.
- `/benchmarks` publishes the verified live result and checksummed raw trials.
- `/docs` documents WebMCP, the official MCP lane, security, and deployment.

The project was built for the 2026 WebMCP Challenge. Draw through the normal
Excalidraw controls. The agent interacts via WebMCP.

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
separate and reviewable. Judges can follow the setup on the
[live docs](https://drawmcp.dev/docs#webmcp).

- [Submission checklist and judging map](docs/DEVPOST_SUBMISSION.md)
- [Under-three-minute narrated demo script](docs/DEMO_SCRIPT.md)

The silent homepage loop compares the measured public MCP and WebMCP paths in
one frame. It does not replace the required narrated YouTube submission video.

The live tool surface is:

- `get_canvas_summary`
- `get_selection`
- `add_elements`
- `update_elements`
- `delete_elements`
- `fit_to_content`
- `organize_diagram`

The current candidate has passed 116 deterministic tests, 17/17 project-owned
browser proof steps, the Chrome Labs runner's 11/11 authored smoke calls, and
125/125 repeated local-model decisions. In 20 randomized live production pairs,
DrawMCP completed its two-call rendered task in 13.71 ms p50 while the official
public MCP returned its pre-widget checkpoint in 90.23 ms p50. That is a 6.58×
task-specific median speedup with 40/40 semantically correct trials. The older
controlled component benchmark remains available as a separate set of 220/220
semantically correct trials.

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
npm run evals:continuity
npm run benchmark:verify:live
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
11. [Finalization audit and publication gates](docs/FINALIZATION_AUDIT.md)
12. [Excalidraw capability matrix](research/EXCALIDRAW_CAPABILITY_MATRIX.md)

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
