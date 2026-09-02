# DrawMCP proof and side-by-side plan

Last updated: 2026-09-02

## Proof standard

DrawMCP is “working” only when the evidence demonstrates the complete causal
chain. These claims are deliberately separate:

| Proof level | Required evidence |
| --- | --- |
| Static contract | Typecheck, schema tests, source review |
| Local behavior | Browser test against local app and visible state assertions |
| Local WebMCP | Real browser enumeration, domain receipts, and semantic scene assertions |
| Preview build | Vercel deployment state plus build logs and exact commit |
| Preview runtime | Real in-app-browser calls against preview URL |
| Production deployment | Vercel production alias points to exact release commit |
| Domain | DNS resolution, valid TLS, canonical URL, direct-load response |
| Production WebMCP | Live tool enumeration and successful calls on `drawmcp.dev` |
| Human-agent continuity | Manual edit observed by next agent read and preserved by next mutation |
| Repeated model eval | Versioned trials for a named model, backend, schema hash, and run count |
| Benchmark | Raw trials, semantic results, exact boundary, uncertainty, commit, and environment |
| Submission | Public repo, license, video, live URL, and Devpost record |

A lower proof level never substitutes for a higher one.

## Comparison test case

Use the same user intent and content for both systems:

> Create a four-node architecture showing Browser → Agent → WebMCP Tools →
> Canvas. Let me move the Agent node. Then add a Database node below Canvas and
> reconnect the flow without losing my manual move.

This tests creation, legibility, human editing, state observation, continuation,
and preservation of a manual change.

## Baseline lane: official Excalidraw MCP

Record:

1. connection/setup required by the host;
2. advertised tools and schemas;
3. initial `create_view` call and checkpoint receipt;
4. rendered MCP App state;
5. manual fullscreen edit;
6. how the next model turn learns about that edit;
7. restore/checkpoint continuation;
8. export/handoff behavior if used;
9. final visible diagram.

Store sanitized artifacts under a dated release evidence directory:

```text
tool-list.json
initial-call.json
initial-result.json
continuation-call.json
continuation-result.json
initial.png
after-human-edit.png
final.png
notes.md
```

## DrawMCP lane: full WebMCP

Record:

1. opening `drawmcp.dev` with no MCP server configuration;
2. site-tool enumeration from the top-level page;
3. canvas summary and initial revision;
4. element creation receipts;
5. human movement of the Agent node;
6. new revision and selection/state read;
7. continuation mutation with `expected_revision`;
8. preserved manual coordinates;
9. undo and redo of the agent mutation;
10. final visible diagram.

Store sanitized artifacts in the same release evidence directory plus
`tool-list.json`, revision receipts, semantic scene assertions, and current-session
Undo/Redo assertions.

## Side-by-side product presentation

The live app includes a comparison page or panel that uses verified, versioned
evidence captured from both lanes. It must not pretend to call the external MCP
service from inside the page.

The presentation shows synchronized stages:

| Stage | MCP App | DrawMCP WebMCP |
| --- | --- | --- |
| Start | Connect service | Open website |
| Discover | Host lists remote MCP tools | Browser discovers page tools |
| Create | `create_view` builds checkpoint | Primitive tools mutate live canvas |
| Human edit | Fullscreen widget edit | Normal canvas edit |
| Continue | Widget context + restore checkpoint | Read same page state + revision |
| Finish | Widget/export | Already in final editable canvas |

Every displayed claim links to a proof artifact, source file, or live action.

## WebMCP completeness checklist

- [ ] Imperative tools register on the top-level document
- [ ] Feature detection and unsupported-browser fallback
- [ ] Lifecycle cleanup via `AbortSignal`
- [ ] Closed JSON Schemas with bounded inputs
- [ ] Accurate read-only and untrusted-content annotations
- [ ] Current-state reads at execution time
- [ ] Pre-commit cancellation with an explicit non-rollback boundary
- [ ] Revision preconditions for mutations
- [ ] Structured success and error receipts
- [ ] Closed tool validation plus the published Excalidraw mutation boundary
- [ ] Visible, undoable agent mutations
- [ ] No hidden external uploads or network effects
- [ ] In-app-browser enumeration and invocation proof

## Automated acceptance journey

1. Load an empty canvas.
2. Assert seven registered tools.
3. Call `get_canvas_summary`; expect revision 0.
4. Call `add_elements` with four nodes and connectors.
5. Assert revision and exact stable IDs.
6. Simulate a human move and selection through the editor.
7. Call `get_selection`; assert new position and revision.
8. Call `add_elements` for Database with the current expected revision.
9. Assert the human-moved node coordinates did not regress.
10. Call `organize_diagram` only on selected elements.
11. Assert non-selected elements remain unchanged.
12. Undo; assert the last agent operation reverses.
13. Redo; assert it returns.
14. Reload; assert the versioned local scene restores.

## Manual production script

The release operator repeats the acceptance journey in ChatGPT's in-app browser
against `https://drawmcp.dev`, captures the tool receipts and screenshots, and
records the production deployment ID and Git commit. This proof is required even
when automated tests pass.

## Failure policy

If either lane cannot complete a step, show the failure honestly and explain
the architectural reason. Do not edit the comparison to imply a call happened,
use screenshots from a different revision, or collapse partial proof into
“verified.”
