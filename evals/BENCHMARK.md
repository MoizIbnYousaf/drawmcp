# WebMCP versus Excalidraw MCP benchmark

No official source currently provides an apples-to-apples latency benchmark for page-native WebMCP versus the hosted Excalidraw MCP service. DrawMCP will publish its own reproducible measurements and label them as project results.

The first tool-boundary observation is published at
`public/benchmarks/2026-09-01-tool-boundary.json`. It separates WebMCP's
page-local execution, ChatGPT host round trip, and official MCP direct SDK
transport. Because the hosts differ, it is not an end-to-end protocol ranking.

## Same-task protocol

Run the same prompt, model, host application, machine, network, and target diagram for both lanes. Use at least five warm runs after one discarded cold run. Reset the canvas and conversation state between measured runs.

The reference task has two stages:

1. Create the Browser → Agent → Canvas architecture diagram.
2. Update the Agent node and fit the final drawing into view.

The official MCP lane uses its documented `read_me`, `create_view`, checkpoint, and widget path. The DrawMCP lane uses page discovery, `add_elements`, `update_elements`, and `fit_to_content`.

## Measurements

| Metric                  | Meaning                                                                   | Collection boundary                                            |
| ----------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Time to visible result  | User-perceived wall clock from prompt submission to stable visible canvas | Host timestamps plus screenshot-ready observation              |
| Tool execution duration | JavaScript or remote-tool execution only                                  | DrawMCP `PerformanceMeasure`; MCP call start/result timestamps |
| Agent decision time     | Prompt-to-first-tool latency                                              | Host tool trace timestamps                                     |
| Tool-call count         | Number of calls required to complete the task                             | Host trace                                                     |
| Input and output bytes  | Serialized arguments and results crossing each tool boundary              | Sanitized trace capture                                        |
| Handoffs                | Export, checkpoint restore, fullscreen transition, or page switch         | Journey log                                                    |
| Retries and failures    | Invalid calls, stale writes, runtime errors, and manual recovery          | Tool receipts and host trace                                   |
| State preservation      | Whether a human edit survives the next agent operation                    | Coordinate assertion before and after continuation             |

Report p50, p95, minimum, and maximum for duration metrics. Report counts and completion rate for reliability metrics. Do not combine agent reasoning time, network time, tool execution, and UI stabilization into one unexplained “speed” number.

## Visualization

The later homepage comparison should render:

1. A synchronized two-lane timeline for discovery, agent decision, execution, UI stabilization, human edit, and continuation.
2. Paired horizontal bars for p50 time to visible result and p50 tool execution duration.
3. Small count cards for tool calls, retries, handoffs, and state-preservation success.
4. A reliability bar showing completed runs, recoverable failures, and failed runs.

Every chart links to the sanitized run data, exact Git revision, deployment ID, model, host, and run conditions. The page must distinguish measured results from architectural claims.

## Conformance and eval context

- `research/snapshots/webmcp-wpt-2026-09-01.md` preserves the Web Platform Test result surface for API conformance.
- `research/snapshots/chrome-webmcp-evals-2026-09-01.md` preserves Chrome's official eval guidance for call accuracy, deterministic logic, end-to-end order, and mid-chain failure.
- `evals/webmcp-evals.json` tests natural-language tool selection.
- Unit and component tests prove deterministic page logic.
- `webmcp-evals smoke` proves concrete expected calls against a live page without an LLM.
