# WebMCP Challenge submission checklist

Verified against the [challenge overview](https://webmcp.devpost.com/) and
[official rules](https://webmcp.devpost.com/rules) on September 2, 2026.

## Deadline and freeze

- Submission closes September 3, 2026 at 1:00 PM Pacific / 4:00 PM Eastern.
- After the deadline, do not edit the Devpost entry, submitted repository, or
  live site until winners are announced. Continue later work in a separate
  fork if necessary.
- The entrant must independently confirm age, residence, and other eligibility
  requirements in the official rules.

## Required submission surfaces

- [x] Working public app: <https://drawmcp.dev>
- [x] Direct judge path: <https://drawmcp.dev/docs#webmcp>
- [x] No authentication or test credentials required
- [x] MIT `LICENSE` committed and detected by GitHub
- [x] Source, assets, submodule pins, setup instructions, and WebMCP tests exist
- [x] Direct `document.modelContext.registerTool(...)` implementation
- [ ] Change `MoizIbnYousaf/drawmcp` from private to public
- [ ] Confirm the MIT license is visible in the public repository About panel
- [ ] Record and upload a public YouTube demo with audio under three minutes
- [ ] Add final YouTube and repository URLs to the Devpost project
- [ ] Complete every required Devpost field and submit before the deadline
- [ ] Freeze the submitted repository and deployment after submission closes

The silent homepage comparison video is a website explainer. It is not the
required narrated submission video.

## Submission description draft

### Why this is a strong WebMCP use case

Visual collaboration breaks when an agent works in a second representation of
a drawing. The person sees one canvas while the agent reads an export, a stale
snapshot, or a separate server-owned document. DrawMCP makes the open page the
tool boundary. Both actors work against the same Excalidraw scene.

### Better user experience

There is no connector setup, export/import step, or second canvas to reconcile.
The agent can inspect the current drawing, use the person’s selection, apply a
bounded change, and focus the viewport. The person can then edit with normal
Excalidraw controls and use native Undo and Redo.

### What people and agents can do together

A person can sketch or select an idea, ask an agent to structure or extend it,
move the result by hand, and ask the agent to continue from that new state.
Revision guards reject stale writes instead of silently overwriting a human
edit. This continuous mixed-initiative loop was difficult when the browser UI
and agent tool state lived in different documents.

A person can edit through the normal Excalidraw keyboard and pointer. The agent
reads that exact canvas and responds through WebMCP. Both edits remain in one
revision history with native Undo.

### How WebMCP is implemented

The `/canvas` page registers seven closed-schema tools through
`document.modelContext.registerTool(...)`. Read tools expose bounded scene and
selection summaries. Mutation tools validate input again at execution time,
serialize writes, support cancellation, enforce optional expected revisions,
and use Excalidraw’s own element-versioning and history APIs. Registrations are
aborted when the canvas unmounts. The normal editor remains usable when WebMCP
is unavailable.

## Judging criteria map

| Criterion | Evidence a judge can inspect |
| --- | --- |
| WebMCP leverage | Seven non-trivial page tools, closed schemas, runtime validation, cancellation, revision guards, and visible mutation receipts |
| Execution | Deployed no-login product, normal editor fallback, 115 deterministic tests, 17/17 semantic browser steps, 11/11 Chrome Labs smoke calls, and a 40/40 live benchmark |
| Potential impact | A concrete shared-state workflow for anyone who diagrams systems, plans, or ideas with an agent |
| Creativity and ambition | The human editor itself becomes the agent tool server while preserving selection, revisions, viewport, and native history |

## Final pre-submit proof

Record these exact proof levels independently:

1. Git commit and public repository revision.
2. Green local lint, 115 deterministic tests, 17 browser proof steps, 125 local-model decisions, live benchmark verification, shared-canvas continuity, build, audit, and HyperFrames checks.
3. Successful Vercel production deployment for that exact revision.
4. Live `drawmcp.dev` WebMCP enumeration and the 11-step smoke suite.
5. A manual human edit → agent read/write → Undo/Redo continuation journey.
6. Public YouTube playback with audible narration and a duration below 3:00.
7. Saved and submitted Devpost project with all required URLs.
