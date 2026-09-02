import type { ToolName } from "../webmcp/tool-contracts";

export type ToolMetric = {
  tool: ToolName;
  started_at_ms: number;
  duration_ms: number;
  ok: boolean;
};

const metrics: ToolMetric[] = [];
const MAX_METRICS = 200;
const listeners = new Set<(metric: ToolMetric) => void>();

export const recordToolMetric = (
  tool: ToolName,
  startedAt: number,
  endedAt: number,
  ok: boolean,
): void => {
  const durationMs = Math.max(0, endedAt - startedAt);
  const metric = {
    tool,
    started_at_ms: startedAt,
    duration_ms: durationMs,
    ok,
  };
  metrics.push(metric);
  if (metrics.length > MAX_METRICS)
    metrics.splice(0, metrics.length - MAX_METRICS);
  for (const listener of listeners) listener({ ...metric });
  try {
    performance.measure(`drawmcp:${tool}`, {
      start: startedAt,
      end: endedAt,
      detail: {
        ok,
        devtools: {
          dataType: "track-entry",
          track: "WebMCP tool execution",
          trackGroup: "DrawMCP",
          color: ok ? "tertiary-dark" : "error",
          properties: [
            ["Tool", tool],
            ["Outcome", ok ? "Success" : "Failure"],
            ["Duration", `${durationMs.toFixed(2)} ms`],
          ],
          tooltipText: `${tool} · ${durationMs.toFixed(2)} ms`,
        },
      },
    });
  } catch {
    // PerformanceMeasure options are unavailable in some test and older runtimes.
  }
};

export const getToolMetrics = (): ToolMetric[] =>
  metrics.map((metric) => ({ ...metric }));

export const subscribeToolMetrics = (
  listener: (metric: ToolMetric) => void,
): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const resetToolMetrics = (): void => {
  metrics.length = 0;
};
