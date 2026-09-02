import { describe, expect, it } from "vitest";
import {
  createSeededRandom,
  summarizeDurations,
  wilsonInterval,
} from "./stats";

describe("benchmark statistics", () => {
  it("is deterministic for a recorded bootstrap seed", () => {
    const values = Array.from({ length: 100 }, (_, index) => index + 1);
    expect(summarizeDurations(values, 42)).toEqual(
      summarizeDurations(values, 42),
    );
  });

  it("withholds p95 below forty successful samples", () => {
    const summary = summarizeDurations(
      Array.from({ length: 20 }, (_, index) => index + 1),
      42,
    );
    expect(summary.p50).not.toBeNull();
    expect(summary.p90).not.toBeNull();
    expect(summary.p95).toBeNull();
  });

  it("publishes p95 and bootstrap intervals for a full microbenchmark", () => {
    const summary = summarizeDurations(
      Array.from({ length: 100 }, (_, index) => index + 1),
      42,
    );
    expect(summary.p50).toMatchObject({ value: 50.5 });
    expect(summary.p90?.value).toBeCloseTo(90.1);
    expect(summary.p95?.value).toBeCloseTo(95.05);
    expect(summary.p95?.ci95.low).toBeLessThanOrEqual(summary.p95!.value);
    expect(summary.p95?.ci95.high).toBeGreaterThanOrEqual(summary.p95!.value);
  });

  it("computes Wilson completion intervals", () => {
    expect(wilsonInterval(100, 100)).toMatchObject({ rate: 1 });
    const half = wilsonInterval(5, 10);
    expect(half.rate).toBe(0.5);
    expect(half.low).toBeLessThan(0.5);
    expect(half.high).toBeGreaterThan(0.5);
  });

  it("generates repeatable lane order", () => {
    const first = createSeededRandom(1337);
    const second = createSeededRandom(1337);
    expect(Array.from({ length: 20 }, () => first())).toEqual(
      Array.from({ length: 20 }, () => second()),
    );
  });
});
