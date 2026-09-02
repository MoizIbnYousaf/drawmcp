import { describe, expect, it } from "vitest";
import {
  MAX_TOOL_RESULT_CHARACTERS,
  finalizeToolResult,
} from "./tool-results";

describe("tool result budget", () => {
  it("preserves bounded structured results", () => {
    const result = { ok: true, revision: 3 };
    expect(finalizeToolResult(result)).toEqual(result);
  });

  it("replaces oversized results with a bounded structured failure", () => {
    const result = finalizeToolResult({
      ok: true,
      content: "x".repeat(MAX_TOOL_RESULT_CHARACTERS * 2),
    });
    expect(result).toMatchObject({ ok: false, code: "OUTPUT_TOO_LARGE" });
    expect(Array.from(JSON.stringify(result)).length).toBeLessThanOrEqual(
      MAX_TOOL_RESULT_CHARACTERS,
    );
  });
});
