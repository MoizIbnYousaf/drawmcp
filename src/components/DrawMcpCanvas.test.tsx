import { act, render, screen, waitFor } from "@testing-library/react";
import { StrictMode, useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CanvasApi } from "../excalidraw/canvas-service";
import { LOCAL_SCENE_STORAGE_KEY } from "../excalidraw/local-scene-store";

let suppliedApi: CanvasApi;
let suppliedExcalidrawProps: Record<string, unknown>;

vi.mock("@excalidraw/excalidraw", () => ({
  Excalidraw: (props: Record<string, unknown>) => {
    suppliedExcalidrawProps = props;
    const { excalidrawAPI, onChange } = props;
    useEffect(() => {
      (excalidrawAPI as (api: CanvasApi) => void)(suppliedApi);
      (
        onChange as (
          elements: unknown[],
          appState: object,
          files: object,
        ) => void
      )([], { selectedElementIds: {} }, {});
    }, [excalidrawAPI, onChange]);
    return <div data-testid="excalidraw-editor">Editor</div>;
  },
  CaptureUpdateAction: { IMMEDIATELY: "IMMEDIATELY" },
  convertToExcalidrawElements: (elements: unknown[]) => elements,
}));

import { DrawMcpCanvas } from "./DrawMcpCanvas";

describe("DrawMcpCanvas", () => {
  beforeEach(() => {
    delete document.modelContext;
    localStorage.clear();
    suppliedApi = {
      isDestroyed: false,
      getSceneElements: () => [],
      getSceneElementsIncludingDeleted: () => [],
      getAppState: () => ({ selectedElementIds: {} }),
      getFiles: () => ({}),
      updateScene: vi.fn(),
      scrollToContent: vi.fn(),
    };
  });

  it("enables the native Excalidraw keyboard surface globally on mount", () => {
    render(<DrawMcpCanvas />);
    expect(suppliedExcalidrawProps).toMatchObject({
      autoFocus: true,
      handleKeyboardGlobally: true,
      name: "DrawMCP",
    });
  });

  it("mounts the editor and publishes a ready service", async () => {
    const onServiceReady = vi.fn();
    render(<DrawMcpCanvas onServiceReady={onServiceReady} />);
    expect(screen.getByTestId("excalidraw-editor")).toBeInTheDocument();
    await waitFor(() =>
      expect(onServiceReady).toHaveBeenCalledWith(
        expect.objectContaining({ getCanvasSummary: expect.any(Function) }),
      ),
    );
  });

  it("detaches the service when the editor unmounts", async () => {
    const onServiceReady = vi.fn();
    const view = render(<DrawMcpCanvas onServiceReady={onServiceReady} />);
    await waitFor(() => expect(onServiceReady).toHaveBeenCalled());
    const service = onServiceReady.mock.calls[0][0];
    view.unmount();
    expect(service.getCanvasSummary()).toMatchObject({
      ok: false,
      code: "UNAVAILABLE",
    });
  });

  it("registers all site tools when a model context is available", async () => {
    const registerTool = vi.fn(async () => undefined);
    document.modelContext = { registerTool };
    render(<DrawMcpCanvas />);
    await waitFor(() => expect(registerTool).toHaveBeenCalledTimes(7));
    expect(screen.getByTestId("webmcp-status")).toHaveTextContent(
      "7/7 site tools",
    );
  });

  it("leaves exactly one live registration per tool under StrictMode", async () => {
    const active = new Set<string>();
    document.modelContext = {
      registerTool: vi.fn(async (tool, options) => {
        active.add(tool.name);
        options?.signal?.addEventListener(
          "abort",
          () => active.delete(tool.name),
          { once: true },
        );
      }),
    };
    const view = render(
      <StrictMode>
        <DrawMcpCanvas />
      </StrictMode>,
    );
    await waitFor(() => expect(active.size).toBe(7));
    expect(active).toEqual(
      new Set([
        "get_canvas_summary",
        "get_selection",
        "add_elements",
        "update_elements",
        "delete_elements",
        "fit_to_content",
        "organize_diagram",
      ]),
    );
    view.unmount();
    expect(active.size).toBe(0);
  });

  it("initializes the editor from a valid local scene before publishing tools", async () => {
    localStorage.setItem(
      LOCAL_SCENE_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        saved_at: "2026-09-02T00:00:00.000Z",
        elements: [
          {
            id: "saved_node",
            type: "rectangle",
            x: 10,
            y: 20,
            width: 100,
            height: 60,
          },
        ],
        app_state: { scrollX: 1, scrollY: 2, zoom: { value: 1 } },
      }),
    );
    const registerTool = vi.fn(async () => undefined);
    document.modelContext = { registerTool };
    render(<DrawMcpCanvas />);
    expect(suppliedExcalidrawProps.initialData).toMatchObject({
      elements: [expect.objectContaining({ id: "saved_node" })],
      appState: { scrollX: 1, scrollY: 2, zoom: { value: 1 } },
    });
    await waitFor(() => expect(registerTool).toHaveBeenCalledTimes(7));
  });

  it("persists editor changes and removes storage after the canvas is cleared", () => {
    vi.useFakeTimers();
    const view = render(<DrawMcpCanvas />);
    const onChange = suppliedExcalidrawProps.onChange as (
      elements: unknown[],
      appState: Record<string, unknown>,
      files: Record<string, unknown>,
    ) => void;
    act(() => {
      onChange(
        [
          {
            id: "persisted",
            type: "rectangle",
            x: 0,
            y: 0,
            width: 100,
            height: 60,
          },
        ],
        { scrollX: 4, scrollY: 5, zoom: { value: 1 } },
        {},
      );
      vi.advanceTimersByTime(500);
    });
    expect(localStorage.getItem(LOCAL_SCENE_STORAGE_KEY)).toContain("persisted");

    act(() => {
      onChange([], {}, {});
      vi.advanceTimersByTime(500);
    });
    expect(localStorage.getItem(LOCAL_SCENE_STORAGE_KEY)).toBeNull();
    view.unmount();
    vi.useRealTimers();
  });
});
