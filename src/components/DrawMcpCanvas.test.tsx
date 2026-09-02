import { render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CanvasApi } from "../excalidraw/canvas-service";

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
});
