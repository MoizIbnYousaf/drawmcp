import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { liveBenchmarkEvidence } from "../src/data/live-benchmark-evidence";
import { verifyLiveBenchmark } from "./verify";

describe("accepted live benchmark evidence", () => {
  it("matches its checksum, paired sample gate, semantic oracle, and pixels", () => {
    const summary = JSON.parse(
      readFileSync(resolve("public/benchmarks/live-latest.json"), "utf8"),
    );
    expect(liveBenchmarkEvidence).toEqual(summary);
    const rawSource = readFileSync(resolve(`public${summary.raw.path}`), "utf8");
    expect(createHash("sha256").update(rawSource).digest("hex")).toBe(
      summary.raw.sha256,
    );
    expect(summary).toMatchObject({
      evidence_class: "live-production-task-boundary",
      comparable_as_prompt_to_visible: false,
      counts: {
        total_trials: 40,
        pairs: 20,
        semantic_successes: 40,
        rendered_webmcp_successes: 20,
      },
    });
    expect(summary.comparison.p50.webmcp_speedup).toBeGreaterThan(1);
    expect(verifyLiveBenchmark(JSON.parse(rawSource))).toEqual({
      ok: true,
      errors: [],
    });
  });
});
