import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getToolMetrics,
  recordToolMetric,
  resetToolMetrics,
  subscribeToolMetrics,
} from "./tool-metrics";

describe("tool metrics", () => {
  beforeEach(resetToolMetrics);

  it("records bounded tool duration and success", () => {
    recordToolMetric("get_canvas_summary", 10, 14.5, true);
    expect(getToolMetrics()).toEqual([
      {
        tool: "get_canvas_summary",
        started_at_ms: 10,
        duration_ms: 4.5,
        ok: true,
      },
    ]);
  });

  it("notifies and unsubscribes metric observers", () => {
    const seen: string[] = [];
    const unsubscribe = subscribeToolMetrics((metric) =>
      seen.push(metric.tool),
    );
    recordToolMetric("get_selection", 2, 3, true);
    unsubscribe();
    recordToolMetric("get_canvas_summary", 3, 4, true);
    expect(seen).toEqual(["get_selection"]);
  });

  it("publishes tool spans to a named Chrome DevTools track", () => {
    const measure = vi.spyOn(performance, "measure");

    recordToolMetric("add_elements", 20, 32.5, true);

    expect(measure).toHaveBeenCalledWith("drawmcp:add_elements", {
      start: 20,
      end: 32.5,
      detail: {
        ok: true,
        devtools: {
          dataType: "track-entry",
          track: "WebMCP tool execution",
          trackGroup: "DrawMCP",
          color: "tertiary-dark",
          properties: [
            ["Tool", "add_elements"],
            ["Outcome", "Success"],
            ["Duration", "12.50 ms"],
          ],
          tooltipText: "add_elements · 12.50 ms",
        },
      },
    });
  });
});
