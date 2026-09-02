import { describe, expect, it } from "vitest";
import { evaluateScene, normalizeScene } from "./scene-oracle";

const projected = [
  {
    id: "browser",
    type: "rectangle",
    x: 0,
    y: 0,
    width: 160,
    height: 80,
  },
  {
    id: "browser_label",
    type: "text",
    x: 40,
    y: 20,
    width: 80,
    height: 20,
    text: "Browser",
    container_id: "browser",
  },
  {
    id: "agent",
    type: "diamond",
    x: 260,
    y: 0,
    width: 160,
    height: 80,
  },
  {
    id: "edge",
    type: "arrow",
    x: 160,
    y: 40,
    width: 100,
    height: 0,
    start_binding_id: "browser",
    end_binding_id: "agent",
  },
];

describe("semantic scene oracle", () => {
  it("normalizes bound labels and graph edges", () => {
    expect(normalizeScene(projected)).toEqual({
      nodes: [
        expect.objectContaining({ id: "agent", type: "diamond" }),
        expect.objectContaining({
          id: "browser",
          type: "rectangle",
          label: "Browser",
        }),
      ],
      edges: [{ id: "edge", type: "arrow", from: "browser", to: "agent" }],
    });
  });

  it("passes exact required nodes, labels, positions, and edges", () => {
    expect(
      evaluateScene(projected, {
        nodes: [
          { id: "browser", type: "rectangle", label: "Browser", x: 0, y: 0 },
          { id: "agent", type: "diamond" },
        ],
        edges: [{ from: "browser", to: "agent" }],
        tolerance: 1,
      }),
    ).toMatchObject({ ok: true, score: 1 });
  });

  it("reports semantic failures instead of passing on visual similarity", () => {
    expect(
      evaluateScene(projected, {
        nodes: [
          { id: "browser", type: "rectangle", label: "Wrong" },
          { id: "database", type: "rectangle" },
        ],
        edges: [{ from: "agent", to: "browser" }],
      }),
    ).toMatchObject({
      ok: false,
      score: 0,
      failures: expect.arrayContaining([
        expect.stringContaining("browser label"),
        expect.stringContaining("database"),
        expect.stringContaining("agent -> browser"),
      ]),
    });
  });

  it("normalizes the official MCP raw label and binding format", () => {
    expect(
      normalizeScene([
        {
          id: "a",
          type: "rectangle",
          x: 0,
          y: 0,
          width: 100,
          height: 60,
          label: { text: "A" },
        },
        {
          id: "b",
          type: "rectangle",
          x: 200,
          y: 0,
          width: 100,
          height: 60,
        },
        {
          id: "edge",
          type: "arrow",
          x: 100,
          y: 30,
          width: 100,
          height: 0,
          startBinding: { elementId: "a" },
          endBinding: { elementId: "b" },
        },
      ]),
    ).toEqual({
      nodes: [
        expect.objectContaining({ id: "a", label: "A" }),
        expect.objectContaining({ id: "b" }),
      ],
      edges: [{ id: "edge", type: "arrow", from: "a", to: "b" }],
    });
  });
});
