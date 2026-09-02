# Silent Comparison Script

These are silent autoplay loops. On-screen copy carries the full story.

## MCP vs WebMCP — 12 seconds

1. **Setup:** One prompt, two paths, twenty randomized production pairs.
2. **Official path:** Agent → remote service → widget. The clock stops at the
   `create_view` checkpoint response: 90.23 ms p50.
3. **WebMCP path:** Agent → page tools → open canvas. The clock stops after
   `add_elements`, `fit_to_content`, and a rendered pixel change: 13.71 ms p50.
4. **Result:** WebMCP was 6.58× faster at p50 and 9.93× faster at p90, with
   40/40 correct trials.
5. **Limit:** This is a result for the measured task, not a universal protocol
   claim.

## Official Excalidraw MCP — 11 seconds

1. **Prompt:** “Draw the browser-agent-canvas flow.”
2. **Route:** Agent → Remote MCP → MCP App widget.
3. **Tool:** `create_view`
4. **Result:** The diagram streams into an interactive widget.
5. **Continuation:** Checkpoint saved; editing continues.
6. **Measured boundary:** Checkpoint component p50 is 3.58 ms across 100 warm local runs.

## DrawMCP WebMCP — 11 seconds

1. **Page:** The current DrawMCP canvas is already open.
2. **Discovery:** `7/7 site tools`
3. **Tool:** `add_elements`
4. **Result:** The diagram appears in the same live canvas.
5. **Continuation:** Human edit → revision 2 → agent reads again.
6. **Measured boundary:** Mounted-page task p50 is 28.37 ms across 100 warm local runs.

## Shared final message

Same task. Different boundary.

The measurements include different work. No protocol winner is claimed.
