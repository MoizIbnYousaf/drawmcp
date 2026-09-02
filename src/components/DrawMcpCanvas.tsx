import {
  CaptureUpdateAction,
  Excalidraw,
  convertToExcalidrawElements,
  newElementWith,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useCallback, useEffect, useState } from "react";
import { CanvasService, type CanvasApi } from "../excalidraw/canvas-service";
import type { CanvasElement } from "../excalidraw/element-projection";
import {
  subscribeToolMetrics,
  type ToolMetric,
} from "../observability/tool-metrics";
import { WebMcpRegistry, type RegistryState } from "../webmcp/register-tools";
import { TOOL_NAMES } from "../webmcp/tool-contracts";
import { createDrawMcpTools } from "../webmcp/tool-handlers";
import { WebMcpStatus } from "./WebMcpStatus";

type DrawMcpCanvasProps = {
  onServiceReady?: (service: CanvasService) => void;
};

export const DrawMcpCanvas = ({ onServiceReady }: DrawMcpCanvasProps) => {
  const [service] = useState(
    () =>
      new CanvasService({
        captureUpdateImmediately: CaptureUpdateAction.IMMEDIATELY,
        convertElements: (elements) =>
          convertToExcalidrawElements(elements as never, {
            regenerateIds: false,
          }) as never,
        updateElement: (element, changes) =>
          newElementWith(element as never, changes as never) as never,
      }),
  );
  const [canvasReady, setCanvasReady] = useState(false);
  const [canvasStatus, setCanvasStatus] = useState(service.getStatus());
  const [registryState, setRegistryState] = useState<RegistryState>({
    status: "detecting",
    registeredCount: 0,
  });
  const [lastMetric, setLastMetric] = useState<ToolMetric | null>(null);

  const handleApi = useCallback(
    (api: CanvasApi) => {
      service.attach(api);
      setCanvasReady(true);
      onServiceReady?.(service);
    },
    [onServiceReady, service],
  );

  const handleChange = useCallback(
    (
      elements: unknown,
      appState: { selectedElementIds?: Record<string, boolean> },
      files: Record<string, unknown>,
    ) =>
      service.observeEditorChange(elements as CanvasElement[], appState, files),
    [service],
  );

  useEffect(() => {
    return () => service.detach();
  }, [service]);

  useEffect(() => service.subscribe(setCanvasStatus), [service]);
  useEffect(() => subscribeToolMetrics(setLastMetric), []);

  useEffect(() => {
    if (!canvasReady) return;
    const registry = new WebMcpRegistry({ onStateChange: setRegistryState });
    void registry.start(createDrawMcpTools(service));
    return () => registry.dispose();
  }, [canvasReady, service]);

  return (
    <div className="drawmcp-workspace">
      <div className="drawmcp-canvas" data-testid="drawmcp-canvas">
        <Excalidraw
          autoFocus
          handleKeyboardGlobally
          name="DrawMCP"
          excalidrawAPI={handleApi as never}
          onChange={handleChange as never}
        />
      </div>
      <WebMcpStatus
        canvas={canvasStatus}
        registry={registryState}
        expectedToolCount={TOOL_NAMES.length}
        lastMetric={lastMetric}
      />
    </div>
  );
};
