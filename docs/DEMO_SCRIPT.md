# DrawMCP challenge demo script

Target duration: 2:00. Record at 1440p or 1080p with clear voice narration and
no background music. Keep the pointer slow enough for judges to follow.

## 0:00–0:15 · The result

**Picture:** Open the homepage on the live benchmark section, then scroll up to
the tic-tac-toe video.

**Voice:** “DrawMCP turns the Excalidraw page itself into an agent tool server.
In twenty randomized live pairs, its rendered WebMCP task finished 6.58 times
faster at the median than the official public MCP returned its checkpoint.”

## 0:15–0:32 · One board

**Picture:** Open `/canvas?demo=tic-tac-toe`. Let the empty board and `7/7 site
tools` status settle.

**Voice:** “The speed is useful because the agent works on the canvas already
in front of me. There is no connector, login, export, or second drawing to
reconcile. I am X. Codex is O.”

## 0:32–0:52 · Human move

**Picture:** Use Excalidraw’s text tool and place X in the top-left cell.

**Voice:** “I make the first move through the normal Excalidraw interface. This
is a human edit, recorded in the same revision history the agent will read.”

## 0:52–1:20 · Agent move

**Picture:** Give the copied game prompt to the in-app browser agent. Show
`get_canvas_summary`, then `add_elements`, and hold on O appearing in the center.

**Voice:** “Codex reads the current board through WebMCP, chooses a legal cell,
and places O with a bounded page tool. The tool returns only after the pixels
change. My X and the agent’s O now live in one Excalidraw scene.”

## 1:20–1:38 · Continue normally

**Picture:** Make another move or use native Undo and Redo.

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

**Picture:** Return to the game board.

**Voice:** “Your move.”

## Recording checklist

- Keep the final upload below 3:00; judges are not required to watch longer.
- Upload publicly to YouTube and confirm playback while signed out.
- Include audible narration that explains the human move and WebMCP agent move.
- Do not use copyrighted music or third-party logos.
- Describe the 6.58× number as this production task’s observed median speedup,
  not a universal guarantee for every WebMCP site and MCP server.
