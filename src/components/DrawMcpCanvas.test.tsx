import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CanvasApi } from "../excalidraw/canvas-service";

let suppliedApi: CanvasApi;

vi.mock("@excalidraw/excalidraw", () => ({
  Excalidraw: ({ excalidrawAPI, onChange }: Record<string, unknown>) => {
    (excalidrawAPI as (api: CanvasApi) => void)(suppliedApi);
    (
      onChange as (elements: unknown[], appState: object, files: object) => void
    )([], { selectedElementIds: {} }, {});
    return <div data-testid="excalidraw-editor">Editor</div>;
  },
  CaptureUpdateAction: { IMMEDIATELY: "IMMEDIATELY" },
}));

import { DrawMcpCanvas } from "./DrawMcpCanvas";

describe("DrawMcpCanvas", () => {
  beforeEach(() => {
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

  it("mounts the editor and publishes a ready service", () => {
    const onServiceReady = vi.fn();
    render(<DrawMcpCanvas onServiceReady={onServiceReady} />);
    expect(screen.getByTestId("excalidraw-editor")).toBeInTheDocument();
    expect(onServiceReady).toHaveBeenCalledWith(
      expect.objectContaining({ getCanvasSummary: expect.any(Function) }),
    );
  });

  it("detaches the service when the editor unmounts", () => {
    const onServiceReady = vi.fn();
    const view = render(<DrawMcpCanvas onServiceReady={onServiceReady} />);
    const service = onServiceReady.mock.calls[0][0];
    view.unmount();
    expect(service.getCanvasSummary()).toMatchObject({
      ok: false,
      code: "UNAVAILABLE",
    });
  });
});
