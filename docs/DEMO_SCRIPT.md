# DrawMCP challenge demo script

Target duration: 2:20. Record at 1440p or 1080p with clear voice narration and
no background music. Keep the pointer slow enough for judges to follow.

## 0:00–0:15 — The problem

**Picture:** Homepage hero, then scroll to the paired comparison videos.

**Voice:** “Drawing with an agent usually creates a state problem. The person
has an editor open, but the agent often works through another document or
service. DrawMCP asks a simple question: what if the page itself gave the agent
a pencil?”

## 0:15–0:35 — The WebMCP boundary

**Picture:** Let both paired loops reach their completed frame. Open `/canvas`.

**Voice:** “DrawMCP is an Excalidraw-based canvas with seven WebMCP tools. They
exist only while this page is open. There is no connector, login, API key, or
second canvas to sync.”

## 0:35–1:00 — Human starts

**Picture:** Draw two boxes and an arrow manually. Select one box.

**Voice:** “I can use the normal editor first. I’ll sketch a small flow and
select one idea. The editor stays fully useful without WebMCP.”

## 1:00–1:35 — Agent reads and acts

**Picture:** Ask the in-app browser agent: “Summarize this canvas, add a green
rectangle titled WebMCP, then fit the view to the drawing.” Show the visible
tool receipt and result.

**Voice:** “The agent reads the exact live scene and selection, then calls
bounded page tools. Inputs use closed schemas and are validated again when the
tool executes. The change lands in the canvas I am already viewing.”

## 1:35–1:58 — Shared continuation

**Picture:** Move the new shape by hand. Ask for another summary. Use native
Undo, then Redo.

**Voice:** “Now I move the result by hand. The next agent read sees the new
revision. Agent writes use Excalidraw’s own history, so Undo and Redo preserve
one continuous human-agent journey.”

## 1:58–2:15 — Safety and proof

**Picture:** Briefly show `/docs#tools`, then the homepage proof counters.

**Voice:** “The tools cannot run code, navigate, upload, or contact a backend.
Writes are serialized, revision-aware, visible, and undoable. The candidate
passes all seven tool checks, seventeen semantic browser steps, eleven Chrome
Labs smoke calls, and one hundred twenty-five local-model decisions.”

## 2:15–2:20 — Close

**Picture:** Return to the completed canvas.

**Voice:** “DrawMCP: one live canvas for people and agents.”

## Recording checklist

- Keep the final upload below 3:00; judges are not required to watch longer.
- Upload publicly to YouTube and confirm playback while signed out.
- Include audible narration that explains what was built and how WebMCP is used.
- Do not use copyrighted music or third-party logos in the video.
- Show only behavior proven on the deployed app; do not claim an end-to-end
  speed winner for the protocol comparison.
