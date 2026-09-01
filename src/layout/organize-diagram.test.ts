import { describe, expect, it } from "vitest";
import { organizeDiagram } from "./organize-diagram";

const node = (id: string, x: number, y: number) => ({
  id,
  type: "rectangle",
  x,
  y,
  width: 100,
  height: 60,
});

describe("organizeDiagram", () => {
  it("lays out nodes horizontally and deterministically", () => {
    const elements = [
      node("b", 300, 200),
      node("a", 10, 20),
      node("c", 100, 80),
    ];
    const first = organizeDiagram(
      elements,
      new Set(["a", "b", "c"]),
      "horizontal",
      40,
    );
    const second = organizeDiagram(
      elements,
      new Set(["a", "b", "c"]),
      "horizontal",
      40,
    );
    expect(first).toEqual(second);
    expect(first.elements.map(({ id, x, y }) => ({ id, x, y }))).toEqual([
      { id: "b", x: 10, y: 20 },
      { id: "a", x: 150, y: 20 },
      { id: "c", x: 290, y: 20 },
    ]);
  });

  it("organizes selected nodes and preserves everything else", () => {
    const image = {
      id: "image",
      type: "image",
      x: 900,
      y: 900,
      width: 50,
      height: 50,
    };
    const elements = [node("a", 10, 20), node("b", 400, 300), image];
    const result = organizeDiagram(
      elements,
      new Set(["b", "image"]),
      "vertical",
      50,
    );
    expect(result.elements.find((element) => element.id === "a")).toEqual(
      elements[0],
    );
    expect(result.elements.find((element) => element.id === "image")).toEqual(
      image,
    );
    expect(result.skippedIds).toContain("image");
  });

  it("produces a non-overlapping grid", () => {
    const elements = [
      node("a", 0, 0),
      node("b", 0, 0),
      node("c", 0, 0),
      node("d", 0, 0),
    ];
    const result = organizeDiagram(
      elements,
      new Set(elements.map(({ id }) => id)),
      "grid",
      20,
    );
    const positions = result.elements.map(({ x, y }) => `${x}:${y}`);
    expect(new Set(positions).size).toBe(4);
  });

  it("moves bound text by the same delta as its container", () => {
    const elements = [
      node("a", 100, 100),
      node("b", 400, 300),
      {
        id: "label_b",
        type: "text",
        containerId: "b",
        x: 430,
        y: 320,
        width: 40,
        height: 20,
      },
    ];
    const result = organizeDiagram(
      elements,
      new Set(elements.map(({ id }) => id)),
      "horizontal",
      50,
    );
    const movedContainer = result.elements.find(({ id }) => id === "b")!;
    const movedLabel = result.elements.find(({ id }) => id === "label_b")!;
    expect(movedContainer).toMatchObject({ x: 250, y: 100 });
    expect(movedLabel).toMatchObject({ x: 280, y: 120 });
    expect(result.skippedIds).not.toContain("label_b");
    expect(result.movedIds).toContain("label_b");
  });
});
