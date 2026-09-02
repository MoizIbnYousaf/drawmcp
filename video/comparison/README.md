# DrawMCP comparison videos

The silent HyperFrames compositions explain the boundary difference between the
official Excalidraw MCP and DrawMCP WebMCP. The homepage uses one 1280×720,
30 fps comparison frame so both measured paths receive the same pacing and
visual weight.

- `compositions/official-mcp.html`: agent → remote MCP → MCP App widget
- `compositions/drawmcp-webmcp.html`: agent → page tools → current canvas
- `compositions/mcp-vs-webmcp.html`: both live task paths and the accepted result
- `DESIGN.md`: visual system and motion constraints
- `SCRIPT.md`: on-screen narrative
- `STORYBOARD.md`: synchronized timing plan
- `assets/`: the minimal locally bundled source-site assets used by both clips

Run the composition checks from this directory:

```bash
npm run check
```

Render either composition with HyperFrames. If automatic browser discovery is
slow, point the renderer at an existing Chrome installation with
`HYPERFRAMES_BROWSER_PATH`.

```bash
npm run render:all
```

The reviewed H.264 outputs and their static reduced-motion posters live in
`public/videos/`. They contain no audio and are embedded without player chrome.
