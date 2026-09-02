# DrawMCP challenge demo script

Target duration: 2:00. Record at 1440p or 1080p with clear voice narration and
no background music. Keep the pointer slow enough for judges to follow.

## 0:00–0:15 · The result

**Picture:** Open the homepage on the MCP-versus-WebMCP comparison video. Hold
on the final 6.58× result frame.

**Voice:** “DrawMCP turns the Excalidraw page itself into an agent tool server.
In twenty randomized live pairs, its rendered WebMCP task finished 6.58 times
faster at the median than the official public MCP returned its checkpoint.”

## 0:15–0:32 · One canvas

**Picture:** Open `/canvas`. Draw a short note with the normal Excalidraw text
tool.

**Voice:** “The speed is useful because the agent works on the canvas already
in front of me. There is no connector, login, export, or second drawing to
reconcile.”

## 0:32–0:52 · Human move

**Picture:** Move the note and add a rectangle through the normal editor.

**Voice:** “I make the first move through the normal Excalidraw interface. This
is a human edit, recorded in the same revision history the agent will read.”

## 0:52–1:20 · Agent continues

**Picture:** Ask the in-app browser agent to read the note, add a labeled shape,
and fit the view. Show `get_canvas_summary`, then `add_elements`.

**Voice:** “Codex reads the current canvas through WebMCP and responds with a
bounded page tool. The tool returns only after the pixels change. My edit and
the agent’s edit now live in one Excalidraw scene.”

## 1:20–1:38 · Continue normally

**Picture:** Move the new shape or use native Undo and Redo.

**Voice:** “I can keep drawing, move either mark, or use native Undo. The next
agent call reads the new page state. Nothing needs to sync because nothing left
the canvas.”

## 1:38–1:55 · Proof

**Picture:** Open `/benchmarks` and pause on the three evidence cards and raw
trial link.

**Voice:** “The accepted run kept all forty trials. Every result passed the
scene oracle, and every WebMCP trial proved a rendered canvas change. DrawMCP
measured 13.71 milliseconds p50. The public MCP measured 90.23 milliseconds
before its widget rendered.”

## 1:55–2:00 · Close

**Picture:** Return to the comparison video.

**Voice:** “DrawMCP lets the agent work with me on the page I already have open.”

## Recording checklist

- Keep the final upload below 3:00; judges are not required to watch longer.
- Upload publicly to YouTube and confirm playback while signed out.
- Include audible narration that explains the human move and WebMCP agent move.
- Do not use copyrighted music or third-party logos.
- Describe the 6.58× number as this production task’s observed median speedup,
  not a universal guarantee for every WebMCP site and MCP server.
