# DrawMCP Public Copy Ledger

This ledger is the source of truth for the public copy simplification pass. A
line marked `Approved verbatim` must be rendered exactly as written. New bridge
copy does not ship until Moiz approves it.

## Approved verbatim

| Destination | Copy |
|---|---|
| Homepage and docs description | DrawMCP is a WebMCP fork of the current Excalidraw MCP that allows the interactive use of Excalidraw. |
| Homepage shared-canvas description | Draw through the normal Excalidraw controls. The agent interacts via WebMCP. |
| Homepage results summary | Twenty randomized pairs. DrawMCP finished two page calls and changed the visible canvas before the official public MCP returned its checkpoint. The official widget had not rendered yet. |
| Docs why section | Excalidraw has a great MCP server, but it's been quite difficult to use due to not having the ability to kind of interact with the agent. WebMCP unlocks this by allowing us to basically have an agent kind of co-work with the user right on the canvas. So by allowing us to utilize WebMCP, this happens. |
| Docs getting started | Open the DrawMCP canvas in ChatGPT's in-app browser. Ask the agent to use Excalidraw. |
| Homepage footer line 1 | DrawMCP · Built for the 2026 WebMCP Challenge |
| Homepage footer line 2 | Built on the published Excalidraw API and the open-source Excalidraw SDK. |
| Results link label | Results |

## Keep

| Surface | Copy or behavior | Reason |
|---|---|---|
| Global navigation | Home/demo, Results, Docs, Open canvas | Preserve the short route map. |
| Homepage | Try the live canvas | Primary product action. |
| Homepage | Read the setup | Secondary setup action. |
| Docs | Official MCP connection URL and two model-visible tools | Required for the comparison path. |
| Docs | Native Excalidraw shortcut guidance | The canvas must remain a normal editor. |
| Docs | Tool, revision, security, hosting, and UI reference sections | Technical reference, below the short start path. |
| Results | Accepted 20-pair benchmark values and full boundary | Evidence-backed public result. |
| Video | Existing accessibility label and fallback text | Not part of this rewrite unless factually wrong. |

## Replace

| Current copy | Replacement |
|---|---|
| DrawMCP gives the browser agent seven tools over the Excalidraw canvas on screen. | Approved homepage and docs description. |
| Draw through the normal Excalidraw controls. The agent reads the exact board and plays through WebMCP. | Approved shared-canvas description. |
| Read the measurements | Results |
| Existing three-paragraph Why we built DrawMCP story | Approved why-section paragraph. |
| Wait for the 7/7 site-tools status instruction | Approved two-sentence getting-started copy. |
| Homepage game showcase | Official MCP versus DrawMCP WebMCP comparison video. |
| Game-specific release proof | Generic shared-canvas continuity proof. |

## Remove

- Play one board with the agent.
- Open the tic-tac-toe board.
- Play tic-tac-toe.
- Play against the agent.
- The seeded-board guide and agent prompt.
- The public game query behavior, game storage, and game-only assets.
- The long “I wanted to see what happened if the page registered tools…” explanation.
- Repeated internal benchmark implementation narration outside the Results page.

## Needs approval

None. If implementation needs a new public bridge sentence, add it here before
rendering it.
