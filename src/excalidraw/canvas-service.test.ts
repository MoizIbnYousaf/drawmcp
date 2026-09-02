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
  version: 1,
  versionNonce: 1,
  updated: 1,
});

const createHarness = () => {
  let elements: any[] = [rectangle("node_1")];
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
    setElements: (next: any[]) => {
      elements = next;
      service.observeEditorChange(elements, appState, {});
    },
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
      selected_count: 1,
      elements: [expect.objectContaining({ id: "node_1" })],
    });
    harness.select([]);
    expect(harness.service.getSelection()).toMatchObject({
      ok: true,
      revision: 0,
      selected_count: 0,
      elements: [],
    });
  });

  it("ignores stale selected IDs that are absent from the live scene", () => {
    const harness = createHarness();
    harness.select(["missing_node"]);
    expect(harness.service.getSelection()).toMatchObject({
      ok: true,
      selected_count: 0,
      elements: [],
    });
    expect(harness.service.getCanvasSummary()).toMatchObject({
      ok: true,
      element_count: 1,
      selected_count: 0,
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

  it("settles semantic no-op updates without touching history", async () => {
    const harness = createHarness();
    const result = await Promise.race([
      harness.service.updateElements(
        {
          expected_revision: 0,
          patches: [{ id: "node_1", changes: { x: 0 } }],
        },
        new AbortController().signal,
      ),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("no-op update did not settle")), 100),
      ),
    ]);
    expect(result).toMatchObject({
      ok: true,
      changed: false,
      revision_before: 0,
      revision_after: 0,
      affected_element_ids: [],
    });
    expect(harness.api.updateScene).not.toHaveBeenCalled();
  });

  it("clears pending state after an editor exception", async () => {
    const harness = createHarness();
    vi.mocked(harness.api.updateScene).mockImplementationOnce(() => {
      throw new Error("editor failed");
    });

    await expect(
      harness.service.updateElements(
        { patches: [{ id: "node_1", changes: { x: 20 } }] },
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({ ok: false, code: "INTERNAL_ERROR" });

    await expect(
      harness.service.updateElements(
        { patches: [{ id: "node_1", changes: { x: 30 } }] },
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({ ok: true, revision_after: 1 });
  });

  it("times out an unobserved editor update and releases the queue", async () => {
    let elements = [rectangle("node_1")];
    const appState = { selectedElementIds: { node_1: true } };
    const api: CanvasApi = {
      isDestroyed: false,
      getSceneElements: () => elements,
      getSceneElementsIncludingDeleted: () => elements,
      getAppState: () => appState,
      getFiles: () => ({}),
      scrollToContent: vi.fn(),
      updateScene: vi.fn(),
    };
    const service = new CanvasService({ settleTimeoutMs: 10 });
    service.attach(api);
    service.observeEditorChange(elements, appState, {});

    await expect(
      service.updateElements(
        { patches: [{ id: "node_1", changes: { x: 20 } }] },
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({ ok: false, code: "TIMEOUT" });

    vi.mocked(api.updateScene).mockImplementation(({ elements: next }) => {
      elements = [...(next ?? elements)] as typeof elements;
      queueMicrotask(() => service.observeEditorChange(elements, appState, {}));
    });
    await expect(
      service.updateElements(
        { patches: [{ id: "node_1", changes: { x: 30 } }] },
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({ ok: true, revision_after: 1 });
  });

  it("returns unavailable when the editor detaches during settlement", async () => {
    const harness = createHarness();
    vi.mocked(harness.api.updateScene).mockImplementationOnce(() => undefined);
    const pending = harness.service.updateElements(
      { patches: [{ id: "node_1", changes: { x: 20 } }] },
      new AbortController().signal,
    );
    await vi.waitFor(() => expect(harness.api.updateScene).toHaveBeenCalled());
    harness.service.detach();
    await expect(pending).resolves.toMatchObject({
      ok: false,
      code: "UNAVAILABLE",
    });
  });

  it("reports a competing editor change as stale and keeps the new state", async () => {
    const harness = createHarness();
    vi.mocked(harness.api.updateScene).mockImplementationOnce(() => {
      harness.humanMove(35);
    });
    await expect(
      harness.service.updateElements(
        { expected_revision: 0, patches: [{ id: "node_1", changes: { x: 20 } }] },
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({
      ok: false,
      code: "STALE_REVISION",
      current_revision: 1,
    });
    expect(harness.getElements()[0].x).toBe(35);
  });

  it("settles the observed editor state when cancellation arrives after commit", async () => {
    const harness = createHarness();
    const controller = new AbortController();
    vi.mocked(harness.api.updateScene).mockImplementationOnce(
      ({ elements: next }) => {
        const update = vi
          .mocked(harness.api.updateScene)
          .getMockImplementation();
        controller.abort();
        update?.({ elements: next });
      },
    );
    await expect(
      harness.service.updateElements(
        { patches: [{ id: "node_1", changes: { x: 20 } }] },
        controller.signal,
      ),
    ).resolves.toMatchObject({
      ok: true,
      changed: true,
      revision_after: 1,
    });
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

  it("adds, updates, and deletes elements through guarded operations", async () => {
    const harness = createHarness();
    const signal = new AbortController().signal;
    await expect(
      harness.service.addElements(
        {
          expected_revision: 0,
          elements: [
            {
              id: "node_2",
              type: "rectangle",
              x: 200,
              y: 0,
              width: 100,
              height: 50,
            },
          ],
        },
        signal,
      ),
    ).resolves.toMatchObject({ ok: true, revision_after: 1 });
    await expect(
      harness.service.updateElements(
        {
          expected_revision: 1,
          patches: [{ id: "node_2", changes: { x: 250 } }],
        },
        signal,
      ),
    ).resolves.toMatchObject({ ok: true, revision_after: 2 });
    expect(harness.getElements().find(({ id }) => id === "node_2")?.x).toBe(
      250,
    );
    expect(
      harness.getElements().find(({ id }) => id === "node_2")?.version,
    ).toBe(1);
    await expect(
      harness.service.deleteElements(
        { expected_revision: 2, ids: ["node_2"] },
        signal,
      ),
    ).resolves.toMatchObject({ ok: true, revision_after: 3 });
    expect(
      harness.getElements().find(({ id }) => id === "node_2")?.isDeleted,
    ).toBe(true);
    expect(
      harness.getElements().find(({ id }) => id === "node_2")?.version,
    ).toBe(2);
  });

  it("rejects duplicate additions and missing mutation targets", async () => {
    const harness = createHarness();
    const signal = new AbortController().signal;
    await expect(
      harness.service.addElements(
        { elements: [rectangle("node_1") as never] },
        signal,
      ),
    ).resolves.toMatchObject({ ok: false, code: "INVALID_INPUT" });
    await expect(
      harness.service.updateElements(
        { patches: [{ id: "missing", changes: { x: 20 } }] },
        signal,
      ),
    ).resolves.toMatchObject({ ok: false, code: "NOT_FOUND" });
  });

  it("rejects missing or unsupported binding targets before conversion", async () => {
    const harness = createHarness();
    const signal = new AbortController().signal;
    await expect(
      harness.service.addElements(
        {
          elements: [
            {
              id: "edge",
              type: "arrow",
              x: 0,
              y: 0,
              points: [
                [0, 0],
                [100, 0],
              ],
              start: { id: "missing" },
              end: { id: "node_1" },
            },
          ],
        },
        signal,
      ),
    ).resolves.toMatchObject({ ok: false, code: "INVALID_INPUT" });
    expect(harness.api.updateScene).not.toHaveBeenCalled();
  });

  it("paginates large summaries within the result budget", () => {
    const harness = createHarness();
    const large = Array.from({ length: 20 }, (_, index) => ({
      ...rectangle(`node_${index}`, index * 120),
      type: "text",
      text: "x".repeat(2_000),
    }));
    harness.setElements(large);

    const first = harness.service.getCanvasSummary({ limit: 8 });
    expect(Array.from(JSON.stringify(first)).length).toBeLessThanOrEqual(1_536);
    expect(first).toMatchObject({
      ok: true,
      element_count: 20,
      truncated: true,
      next_cursor: expect.any(String),
    });
    if (!first.ok) throw new Error("expected summary success");
    const second = harness.service.getCanvasSummary({
      cursor: String(first.next_cursor),
      limit: 8,
    });
    expect(second).toMatchObject({ ok: true });

    harness.humanMove(40);
    expect(
      harness.service.getCanvasSummary({
        cursor: String(first.next_cursor),
        limit: 8,
      }),
    ).toMatchObject({ ok: false, code: "STALE_REVISION" });
  });

  it("caps identifier samples in mutation receipts", async () => {
    const harness = createHarness();
    const elements = Array.from({ length: 20 }, (_, index) =>
      rectangle(`added_${index}`, (index + 1) * 120),
    );
    const result = await harness.service.addElements(
      { elements: elements as never },
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      ok: true,
      affected_element_count: 20,
      affected_ids_truncated: true,
    });
    if (!result.ok) throw new Error("expected mutation success");
    expect(result.affected_element_ids).toHaveLength(8);
    expect(Array.from(JSON.stringify(result)).length).toBeLessThanOrEqual(1_536);
  });

  it("focuses the current selection without advancing revision", () => {
    const harness = createHarness();
    expect(
      harness.service.fitToContent({ scope: "selection", animate: false }),
    ).toMatchObject({
      ok: true,
      revision: 0,
      focused_element_count: 1,
      focused_element_ids: ["node_1"],
    });
    expect(harness.api.scrollToContent).toHaveBeenCalledWith(
      [expect.objectContaining({ id: "node_1" })],
      { fitToContent: true, animate: false },
    );
  });

  it("organizes selected supported nodes while preserving other elements", async () => {
    const harness = createHarness();
    const signal = new AbortController().signal;
    await harness.service.addElements(
      {
        expected_revision: 0,
        elements: [rectangle("node_2", 400) as never],
      },
      signal,
    );
    harness.select(["node_1", "node_2"]);
    const result = await harness.service.organize(
      {
        expected_revision: 1,
        scope: "selection",
        layout: "horizontal",
        spacing: 20,
      },
      signal,
    );
    expect(result).toMatchObject({
      ok: true,
      revision_after: 2,
      affected_element_ids: ["node_2"],
    });
    expect(harness.getElements().map(({ version }) => version)).toEqual([
      1, 2,
    ]);
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
