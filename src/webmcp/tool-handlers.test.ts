import { describe, expect, it, vi } from "vitest";
import type { CanvasService } from "../excalidraw/canvas-service";
import { createDrawMcpTools } from "./tool-handlers";

const createService = () =>
  ({
    getCanvasSummary: vi.fn(() => ({ ok: true, revision: 3 })),
    getSelection: vi.fn(() => ({ ok: true, revision: 3, selected_ids: [] })),
    addElements: vi.fn(async () => ({ ok: true, revision_after: 4 })),
    updateElements: vi.fn(async () => ({ ok: true, revision_after: 4 })),
    deleteElements: vi.fn(async () => ({ ok: true, revision_after: 4 })),
    fitToContent: vi.fn(() => ({ ok: true, focused_ids: [] })),
    organize: vi.fn(async () => ({ ok: true, revision_after: 4 })),
  }) as unknown as CanvasService;

describe("DrawMCP tool handlers", () => {
  it("creates the complete ordered tool surface", () => {
    expect(createDrawMcpTools(createService()).map(({ name }) => name)).toEqual(
      [
        "get_canvas_summary",
        "get_selection",
        "add_elements",
        "update_elements",
        "delete_elements",
        "fit_to_content",
        "organize_diagram",
      ],
    );
  });

  it("reads current state at execution time", async () => {
    const service = createService();
    const tool = createDrawMcpTools(service)[0];
    const signal = new AbortController().signal;
    await expect(tool.execute({}, { signal })).resolves.toEqual({
      ok: true,
      revision: 3,
    });
    expect(service.getCanvasSummary).toHaveBeenCalledOnce();
  });

  it("rejects invalid arguments before calling the service", async () => {
    const service = createService();
    const addTool = createDrawMcpTools(service).find(
      ({ name }) => name === "add_elements",
    )!;
    const result = await addTool.execute(
      { elements: [], extra: true },
      { signal: new AbortController().signal },
    );
    expect(result).toMatchObject({ ok: false, code: "INVALID_INPUT" });
    expect(service.addElements).not.toHaveBeenCalled();
  });

  it("returns canceled before service execution", async () => {
    const service = createService();
    const controller = new AbortController();
    controller.abort();
    const tool = createDrawMcpTools(service)[0];
    await expect(
      tool.execute({}, { signal: controller.signal }),
    ).resolves.toMatchObject({
      ok: false,
      code: "CANCELED",
    });
    expect(service.getCanvasSummary).not.toHaveBeenCalled();
  });

  it("supports hosts that omit execution options", async () => {
    const service = createService();
    const tool = createDrawMcpTools(service)[0];
    await expect(tool.execute({})).resolves.toEqual({ ok: true, revision: 3 });
    expect(service.getCanvasSummary).toHaveBeenCalledOnce();
  });

  it("routes mutation arguments and execution signal", async () => {
    const service = createService();
    const signal = new AbortController().signal;
    const tool = createDrawMcpTools(service).find(
      ({ name }) => name === "delete_elements",
    )!;
    await tool.execute({ ids: ["node_1"], expected_revision: 2 }, { signal });
    expect(service.deleteElements).toHaveBeenCalledWith(
      { ids: ["node_1"], expected_revision: 2 },
      signal,
    );
  });
});
