# DrawMCP Side-by-Side Loop Storyboard

**Format:** Two independent 1280×720 landscape clips
**Duration:** 11 seconds each
**Audio:** None; videos are designed for muted autoplay
**Style basis:** `DESIGN.md`
**Loop:** Final 0.6 seconds resolve to `#E3E3E1`; first 0.2 seconds begin on the same paper

## Global guardrails

- Both clips use the same application frame, node positions, phase rail, and
  entrance rhythm.
- Official MCP uses indigo; WebMCP uses green.
- Every visible element enters intentionally and remains readable for at least
  two seconds.
- A single scene avoids jump cuts and preserves a clean loop.
- No source claims an overall speed winner.

## Asset audit

| Asset | Type | Lane | Role |
| --- | --- | --- | --- |
| `assets/favicon.svg` | SVG | Both | DrawMCP identity in browser chrome |
| `assets/fonts/inter-600.woff2` | Font | Both | Display and UI labels |
| `assets/fonts/inter-400.woff2` | Font | Both | Supporting copy |
| `assets/fonts/geist-mono-500.woff2` | Font | Both | Tool receipts and phase labels |
| `assets/fonts/drawably-pen.ttf` | Font | Both | Canvas node labels |
| `assets/source-texture.png` | Screenshot | Both | Low-opacity captured-page texture reference |

## OFFICIAL MCP LOOP — 0:00–0:11

### Concept

The viewer watches an agent send a drawing request across a visible remote
boundary. The path lights up indigo, the MCP App widget assembles, and a
checkpoint receipt makes continuation explicit.

### Hero frame

A dark prompt card occupies the left third. A bright interactive widget fills
the right two-thirds, containing Browser → Agent → Canvas nodes. A slim phase
rail across the bottom reads Prompt, Remote MCP, Widget, Checkpoint.

### Choreography

- 0.20s: browser chrome draws in from the top with `expo.out`.
- 0.45s: prompt card slides from the left while its text types on.
- 1.15s: remote MCP pill stamps into the center path.
- 1.70s: widget frame grows from 96% with its double outline drawing on.
- 2.25–4.20s: three nodes and two arrows cascade into the widget.
- 4.60s: `create_view` receipt slides upward from the lower edge.
- 5.50s: checkpoint stamp drops in with a short overshoot.
- 6.20–6.80s: a cursor nudges the Agent node.
- 6.80–9.10s: the 3.58 ms checkpoint component p50 appears with its 100-run boundary.
- 9.15–10.80s: the final thesis resolves to paper for the loop.

### Depth

BG: paper + faint captured-site texture. MG: browser/widget frame. FG: prompt,
protocol pill, cursor, and receipts.

## WEBMCP LOOP — 0:00–0:11

### Concept

The same diagram begins inside the already-open page. Tool discovery lights up
green, `add_elements` acts directly on the canvas, and a human continuation is
read back through the next revision.

### Hero frame

The browser frame fills the scene. A seven-tool status pill floats in the top
right; the canvas occupies the main area; a narrow agent call panel sits on the
left. The phase rail reads Page, Site tools, Live canvas, Continue.

### Choreography

- 0.20s: browser chrome draws in from the top with `expo.out`.
- 0.45s: the existing blank canvas settles into place.
- 1.05s: `7/7 site tools` counts on and flashes once.
- 1.55s: `add_elements` receipt slides out of the agent panel.
- 2.10–4.05s: the same three nodes and two arrows cascade into the canvas.
- 4.50s: revision changes from 0 to 1.
- 5.25–6.40s: a human cursor drags the Agent node.
- 6.55s: revision changes to 2; `get_canvas_summary` confirms the new state.
- 6.80–9.10s: the 28.37 ms mounted-page task p50 appears with its 100-run boundary.
- 9.15–10.80s: the final thesis resolves to paper for the loop.

### Depth

BG: paper + faint captured-site texture. MG: browser/canvas frame. FG: tool
status, agent receipts, cursor, and revision chip.

## Production architecture

```text
video/comparison/
├── DESIGN.md
├── SCRIPT.md
├── STORYBOARD.md
├── assets/               # minimal captured source set used at render time
├── compositions/
│   ├── official-mcp.html
│   └── drawmcp-webmcp.html
├── renders/              # ignored working output
└── review/               # ignored frame samples and contact sheets
```

Reviewed web assets are copied to `public/videos/` with static posters for the
reduced-motion experience.
