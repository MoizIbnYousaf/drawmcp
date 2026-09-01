import { describe, expect, it } from "vitest";
import { TOOL_DEFINITIONS, validateToolInput } from "./tool-contracts";

describe("WebMCP tool contracts", () => {
  it("defines the complete stable tool surface", () => {
    expect(Object.keys(TOOL_DEFINITIONS)).toEqual([
      "get_canvas_summary",
      "get_selection",
      "add_elements",
      "update_elements",
      "delete_elements",
      "fit_to_content",
      "organize_diagram",
    ]);
  });

  it("rejects unknown properties on read tools", () => {
    const result = validateToolInput("get_canvas_summary", { surprise: true });
    expect(result.ok).toBe(false);
  });

  it("accepts a bounded add-elements request", () => {
    const result = validateToolInput("add_elements", {
      expected_revision: 3,
      elements: [
        {
          id: "node_1",
          type: "rectangle",
          x: 10,
          y: 20,
          width: 200,
          height: 100,
          label: { text: "Agent" },
        },
      ],
    });
    expect(result.ok).toBe(true);
  });

  it.each([
    [
      "unsupported type",
      { elements: [{ id: "x", type: "image", x: 0, y: 0 }] },
    ],
    [
      "oversized coordinate",
      { elements: [{ id: "x", type: "text", x: 1_000_001, y: 0, text: "x" }] },
    ],
    [
      "invalid id",
      { elements: [{ id: "bad id", type: "text", x: 0, y: 0, text: "x" }] },
    ],
    ["negative revision", { expected_revision: -1, elements: [] }],
  ])("rejects %s", (_label, input) => {
    expect(validateToolInput("add_elements", input).ok).toBe(false);
  });

  it("rejects excessive arrays and text", () => {
    const tooMany = Array.from({ length: 51 }, (_, index) => ({
      id: `node_${index}`,
      type: "text",
      x: 0,
      y: 0,
      text: "x",
    }));
    expect(validateToolInput("add_elements", { elements: tooMany }).ok).toBe(
      false,
    );
    expect(
      validateToolInput("add_elements", {
        elements: [
          { id: "x", type: "text", x: 0, y: 0, text: "x".repeat(2001) },
        ],
      }).ok,
    ).toBe(false);
  });
});
