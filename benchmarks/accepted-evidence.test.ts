import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { verifyBenchmark } from "./verify";

describe("accepted benchmark evidence", () => {
  it("matches its checksum, sample counts, semantic gate, and raw schema", () => {
    const summary = JSON.parse(
      readFileSync(resolve("public/benchmarks/latest.json"), "utf8"),
    );
    const rawSource = readFileSync(
      resolve(`public${summary.raw.path}`),
      "utf8",
    );
    expect(createHash("sha256").update(rawSource).digest("hex")).toBe(
      summary.raw.sha256,
    );
    expect(summary).toMatchObject({
      comparable_as_end_to_end: false,
      counts: {
        total_trials: 220,
        warm_pairs: 100,
        cold_pairs: 10,
        semantic_failures: 0,
      },
    });
    expect(verifyBenchmark(JSON.parse(rawSource))).toEqual({
      ok: true,
      errors: [],
    });
  });
});
