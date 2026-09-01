import { describe, expect, it, vi } from "vitest";
import { CanvasService, type CanvasApi } from "./canvas-service";

const rectangle = (id: string, x = 0) => ({
  id,
  type: "rectangle",
  x,
  y: 0,
  width: 100,
  height: 50,
  isDeleted: false,
});

const createHarness = () => {
  let elements = [rectangle("node_1")];
  let appState: { selectedElementIds: Record<string, boolean> } = {
    selectedElementIds: { node_1: true },
  };
  let service: CanvasService;
  const api: CanvasApi = {
    isDestroyed: false,
    getSceneElements: () => elements.filter((element) => !element.isDeleted),
    getSceneElementsIncludingDeleted: () => elements,
    getAppState: () => appState,
    getFiles: () => ({}),
    scrollToContent: vi.fn(),
    updateScene: vi.fn(({ elements: next }) => {
      elements = [...(next ?? elements)] as typeof elements;
      queueMicrotask(() => service.observeEditorChange(elements, appState, {}));
    }),
  };
  service = new CanvasService();
  service.attach(api);
  service.observeEditorChange(elements, appState, {});
  return {
    api,
    service,
    getElements: () => elements,
    humanMove: (x: number) => {
      elements = [rectangle("node_1", x)];
      service.observeEditorChange(elements, appState, {});
    },
    select: (ids: string[]) => {
      appState = {
        selectedElementIds: Object.fromEntries(ids.map((id) => [id, true])),
      };
      service.observeEditorChange(elements, appState, {});
    },
  };
};

describe("CanvasService", () => {
  it("reads the current selection at call time", () => {
    const harness = createHarness();
    expect(harness.service.getSelection()).toMatchObject({
      ok: true,
      revision: 0,
      selected_ids: ["node_1"],
    });
    harness.select([]);
    expect(harness.service.getSelection()).toMatchObject({
      ok: true,
      revision: 0,
      selected_ids: [],
    });
  });

  it("tracks human edits without counting selection-only changes", () => {
    const harness = createHarness();
    harness.select([]);
    expect(harness.service.getStatus().revision).toBe(0);
    harness.humanMove(40);
    expect(harness.service.getStatus()).toMatchObject({
      revision: 1,
      lastActor: "human",
    });
  });

  it("applies one agent mutation and advances exactly once", async () => {
    const harness = createHarness();
    const result = await harness.service.replaceElements({
      operation: "move_node",
      expectedRevision: 0,
      elements: [rectangle("node_1", 50)],
      affectedIds: ["node_1"],
      signal: new AbortController().signal,
    });
    expect(result).toMatchObject({
      ok: true,
      revision_before: 0,
      revision_after: 1,
      affected_element_ids: ["node_1"],
    });
    expect(harness.service.getStatus().revision).toBe(1);
  });

  it("rejects stale mutations before updating the editor", async () => {
    const harness = createHarness();
    harness.humanMove(30);
    const result = await harness.service.replaceElements({
      operation: "stale_move",
      expectedRevision: 0,
      elements: [rectangle("node_1", 50)],
      affectedIds: ["node_1"],
      signal: new AbortController().signal,
    });
    expect(result).toMatchObject({
      ok: false,
      code: "STALE_REVISION",
      current_revision: 1,
    });
    expect(harness.api.updateScene).not.toHaveBeenCalled();
  });

  it("serializes queued mutations", async () => {
    const harness = createHarness();
    const first = harness.service.replaceElements({
      operation: "first",
      expectedRevision: 0,
      elements: [rectangle("node_1", 10)],
      affectedIds: ["node_1"],
      signal: new AbortController().signal,
    });
    const second = harness.service.replaceElements({
      operation: "second",
      expectedRevision: 1,
      elements: [rectangle("node_1", 20)],
      affectedIds: ["node_1"],
      signal: new AbortController().signal,
    });
    await expect(first).resolves.toMatchObject({ ok: true, revision_after: 1 });
    await expect(second).resolves.toMatchObject({
      ok: true,
      revision_after: 2,
    });
    expect(harness.getElements()[0].x).toBe(20);
  });

  it("fails closed when the editor is detached or destroyed", async () => {
    const harness = createHarness();
    harness.service.detach();
    expect(harness.service.getCanvasSummary()).toMatchObject({
      ok: false,
      code: "UNAVAILABLE",
    });
    const result = await harness.service.replaceElements({
      operation: "missing",
      elements: [],
      affectedIds: [],
      signal: new AbortController().signal,
    });
    expect(result).toMatchObject({ ok: false, code: "UNAVAILABLE" });
  });
});
