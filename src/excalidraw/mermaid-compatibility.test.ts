import { describe, expect, it } from "vitest";

describe("Mermaid dependency overrides", () => {
  it("keeps the Excalidraw Mermaid adapter operational", async () => {
    Object.defineProperty(SVGElement.prototype, "getBBox", {
      configurable: true,
      value: () => ({ x: 0, y: 0, width: 100, height: 40 }),
    });
    const { parseMermaidToExcalidraw } = await import(
      "@excalidraw/mermaid-to-excalidraw"
    );
    const result = await parseMermaidToExcalidraw("graph TD; A-->B");
    expect(result.elements.length).toBeGreaterThan(0);
  });
});
