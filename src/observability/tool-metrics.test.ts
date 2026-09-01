import { beforeEach, describe, expect, it } from "vitest";
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
});
