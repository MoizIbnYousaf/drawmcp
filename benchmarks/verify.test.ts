import { describe, expect, it } from "vitest";
import { summarizeBenchmark, type BenchmarkTrial } from "./summarize";
import { verifyBenchmark } from "./verify";

const trials = (warm: number, cold: number): BenchmarkTrial[] =>
  (["webmcp", "official-mcp"] as const).flatMap((lane) => [
    ...Array.from({ length: warm }, (_, index) => ({
      stratum: "controlled-local" as const,
      trial: index + 1,
      lane,
      order: "A" as const,
      cold_start: false,
      completed: true,
      semantic_pass: true,
      task_duration_ms: index + 1,
      component_duration_ms: index + 0.5,
      tool_calls: 1,
      input_bytes: 10,
      output_bytes: 20,
      failure: null,
    })),
    ...Array.from({ length: cold }, (_, index) => ({
      stratum: "controlled-local" as const,
      trial: index + 1,
      lane,
      order: "B" as const,
      cold_start: true,
      completed: true,
      semantic_pass: true,
      task_duration_ms: index + 10,
      component_duration_ms: index + 1,
      tool_calls: 1,
      input_bytes: 10,
      output_bytes: 20,
      failure: null,
    })),
  ]);

const run = (items: BenchmarkTrial[]) => ({
  schema_version: 2,
  run_id: "test",
  recorded_at: "2026-09-02T00:00:00.000Z",
  environment: {},
  method: {},
  scenario: {},
  trials: items,
  summary: summarizeBenchmark(items, 42),
});

describe("benchmark verification", () => {
  it("accepts a complete semantically successful controlled run", () => {
    expect(verifyBenchmark(run(trials(100, 10)))).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("rejects missing samples and semantic failures", () => {
    const items = trials(5, 1);
    items[0].semantic_pass = false;
    const result = verifyBenchmark(run(items));
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("100 controlled warm"),
        expect.stringContaining("semantically failed"),
      ]),
    );
  });
});
