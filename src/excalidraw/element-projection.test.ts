import { describe, expect, it } from "vitest";
import {
  getSceneBounds,
  projectElement,
  summarizeElements,
} from "./element-projection";

const elements = [
  {
    id: "node_1",
    type: "rectangle",
    x: 10,
    y: 20,
    width: 100,
    height: 50,
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "#a5d8ff",
    opacity: 100,
    locked: false,
    version: 12,
    versionNonce: 99,
    seed: 123,
  },
  {
    id: "text_1",
    type: "text",
    x: 25,
    y: 35,
    width: 60,
    height: 20,
    text: "Agent",
    containerId: "node_1",
    strokeColor: "#1e1e1e",
  },
];

describe("element projections", () => {
  it("projects agent-relevant fields and excludes internal version data", () => {
    const projected = projectElement(elements[0]);
    expect(projected).toMatchObject({
      id: "node_1",
      type: "rectangle",
      x: 10,
      y: 20,
      width: 100,
      height: 50,
    });
    expect(projected).not.toHaveProperty("version");
    expect(projected).not.toHaveProperty("versionNonce");
    expect(projected).not.toHaveProperty("seed");
  });

  it("computes bounds for empty and populated scenes", () => {
    expect(getSceneBounds([])).toBeNull();
    expect(getSceneBounds(elements)).toEqual({
      min_x: 10,
      min_y: 20,
      max_x: 110,
      max_y: 70,
      width: 100,
      height: 50,
    });
  });

  it("bounds summary projections and reports truncation", () => {
    const repeated = Array.from({ length: 205 }, (_, index) => ({
      ...elements[0],
      id: `node_${index}`,
    }));
    const summary = summarizeElements(repeated, 200);
    expect(summary.elements).toHaveLength(200);
    expect(summary.truncated).toBe(true);
    expect(summary.counts).toEqual({ rectangle: 205 });
  });
});
