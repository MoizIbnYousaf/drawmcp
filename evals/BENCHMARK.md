# WebMCP and Excalidraw MCP benchmark

No official source provides an apples-to-apples latency ranking for page-native WebMCP and the hosted Excalidraw MCP service. DrawMCP publishes a measured production-task result with both boundaries written beside it. The result describes this deployment and task, not a universal law about every WebMCP site and MCP server.

## Accepted live production run

The accepted run is `public/benchmarks/live-2026-09-02T11-45-46-842Z/summary.json`, with the checksummed raw trials beside it.

- DrawMCP deployment commit: `92b6b6b6558d219b9c3dfac7251597eb390c86a8`
- Environment: macOS arm64, Node `v22.23.1`, Chrome `152.0.7977.65`
- Sample: 20 seeded, randomized AB/BA production pairs with a 500 ms public-service throttle
- Result: 40/40 semantically correct trials and 20/20 rendered WebMCP pixel changes
- WebMCP: 13.71 ms p50 and 19.14 ms p90
- Official public MCP: 90.23 ms p50 and 189.93 ms p90
- Observed task speedup: 6.58× at p50 and 9.93× at p90
- Statistics: 95% percentile-bootstrap intervals with 2,000 resamples; p95 withheld below 40 successful trials per lane

The WebMCP timer includes `add_elements`, `fit_to_content`, and proof that the Excalidraw canvas pixels changed before return. The official timer ends when the public `create_view` call returns its checkpoint; its widget has not rendered yet. That asymmetry favors the official measurement, yet the page task still finished first.

## Accepted controlled run

The accepted high-sample run is `public/benchmarks/controlled-2026-09-02T08-53-02-016Z/summary.json` with checksummed raw trials beside it.

- DrawMCP commit: `8a2eb7fd26407c5382d018f49ffde6c7f5fe2a8c`
- Excalidraw MCP commit: `157aa23ceb1976008aadc89eb05e3444060f09d6`
- Environment: macOS arm64, Node `v22.23.1`, Chrome `152.0.7977.65`
- Sample: 100 randomized warm pairs, 10 cold pairs, one discarded warm-up pair
- Result: 220/220 semantically correct trials, 0 failures
- Statistics: p50, p90, eligible p95, 95% percentile-bootstrap intervals with 2,000 resamples, and Wilson completion intervals

The same target scene contained three labeled nodes and two logical bound edges. The semantic oracle ignored rendering seeds and version nonces, then checked node IDs, types, labels, and graph adjacency.

## Boundary results

| Lane and boundary | Warm p50 | Warm p90 | Warm p95 | What is included |
| --- | ---: | ---: | ---: | --- |
| DrawMCP WebMCP task | 28.37 ms | 35.23 ms | 35.63 ms | Puppeteer WebMCP dispatch for `add_elements` plus `fit_to_content`, visible Excalidraw mutation, and handler settlement |
| DrawMCP page measures | 26.25 ms | 32.31 ms | 33.41 ms | Sum of the two page `PerformanceMeasure` entries |
| Official MCP component | 3.58 ms | 4.20 ms | 4.69 ms | Local Streamable HTTP `create_view` through checkpoint completion |

The official MCP number excludes partial-input generation and MCP App widget rendering. The DrawMCP number includes a mounted editor update and two tool calls. These rows explain component cost; their difference is not protocol causality.

Cold p50 was 325.59 ms for a new DrawMCP browser context through task completion and 155.66 ms for a new official MCP server process through `create_view`. Cold samples have ten observations per lane, so p95 is intentionally withheld.

## Reproduction

`npm run benchmark:run` performs the upstream dependency install/build, starts both pinned local implementations, executes the randomized pairs, evaluates every final scene, and writes ignored raw output under `.benchmarks/`.

`npm run benchmark:verify -- <raw.json>` requires exactly 100 warm and 10 cold controlled trials per lane, zero semantic failures, valid schema, and eligible warm p95 summaries.

`npm run benchmark:accept -- <raw.json>` accepts only a verified clean-tree run, removes ephemeral checkpoint IDs, writes checksummed public raw data, and updates `public/benchmarks/latest.json`.

`npm run benchmark:verify:live` verifies the accepted production run. `npm run benchmark:accept:live -- <raw.json>` requires at least 20 complete randomized pairs, zero semantic failures, a named clean deployment commit, and a rendered pixel change for every WebMCP trial.

## Live and host strata

- **Live service:** The accepted throttled observation checks production DrawMCP and `mcp.excalidraw.com`, publishes p50 and p90, and withholds p95.
- **Matched host:** Prompt-to-visible-result timing is publishable only when both lanes use the same model and host. Below 40 successful trials, report p50 and p90 but withhold p95.
- **Pilot history:** `public/benchmarks/2026-09-01-tool-boundary.json` remains historical unmatched-boundary evidence. Its five-sample p95 values must not be presented as the accepted comparison.

## Metrics retained in every raw trial

- lane, stratum, order, warm/cold state, and recorded seed;
- task and component durations;
- tool-call, input-byte, and output-byte counts;
- completion and semantic-oracle result;
- exact commits, browser, Node, OS, scenario, and boundary descriptions;
- explicit failure text without dropping failed trials from the denominator.
