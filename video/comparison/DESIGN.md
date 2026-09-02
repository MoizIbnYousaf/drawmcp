# DrawMCP Comparison Video Design

## Overview

DrawMCP combines a precise technical product interface with visibly generated
hand-drawn chrome. Layouts are spacious and grid-led, while cards, badges,
underlines, and marks carry a controlled wobble. The comparison videos use the
same frame, pacing, and information density so the protocol boundary—not
production style—remains the only meaningful difference.

The combined homepage comparison puts the two measured production paths in one
frame. Indigo owns the public MCP path, green owns WebMCP, and the final result
card states both the speedup and its task-specific limit.

## Colors

- **Paper**: `#E3E3E1` — global canvas and empty loop frame.
- **Bright Paper**: `#F4F4F1` — application and canvas surfaces.
- **Ink**: `#18181B` — primary type, arrows, and structure.
- **Soft Ink**: `#474645` — explanatory labels and browser chrome.
- **Quiet Ink**: `#6E675F` — tertiary metadata.
- **Pen Indigo**: `#2724D1` — official MCP lane and agent activity.
- **Indigo Wash**: `#DDDCFF` — official MCP surfaces.
- **WebMCP Green**: `#2F9E44` — page-native activity and success.
- **Green Wash**: `#DFF5E4` — WebMCP surfaces and live-state confirmation.
- **Rule**: `#C8C8C3` — quiet dividers.

## Typography

- **Inter 600** — display statements and primary UI labels.
- **Inter 400** — explanatory text.
- **Geist Mono 500** — protocol names, tool calls, revisions, and timestamps.
- **Drawably Pen 400** — canvas node labels only.
- Hero labels are 56–64px; body is 22–26px; metadata is never below 18px.

## Elevation

Depth comes from bright-paper panels, doubled ink outlines, small offset
shadows, and foreground receipts. No glass, glow, or glossy gradients. The
canvas sits visibly above the paper with a restrained 12px offset shadow.

## Components

- **Browser Stage** — wide bright-paper frame with a compact chrome bar.
- **Agent Prompt Card** — dark ink prompt with white text.
- **Protocol Receipt** — monospace call name, status dot, and revision.
- **Live Canvas Nodes** — pastel hand-drawn rectangles and connecting arrows.
- **Progress Rail** — four labeled phases that fill as the demo advances.
- **Lane Stamp** — indigo MCP App or green WebMCP badge.
- **Performance Receipt** — one boundary-qualified p50 with its warm-run count.

## Do's and Don'ts

### Do's

- Keep both lanes at exactly eleven seconds and the same spatial grid.
- Use indigo only for remote MCP activity and green only for WebMCP activity.
- Animate the protocol path before the canvas result.
- Hold the completed diagram long enough to read.
- End on plain paper for a clean autoplay loop.

### Don'ts

- Do not imply that page-local execution equals end-to-end speed.
- Do not show fake browser or chat-provider logos.
- Do not add narration, music, controls, or captions.
- Do not use photorealism, neon glows, or generic SaaS gradients.
- Do not animate both lanes differently enough to bias the comparison.
