import {
  CaptureUpdateAction,
  Excalidraw,
  convertToExcalidrawElements,
  newElementWith,
} from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { CanvasService, type CanvasApi } from "../excalidraw/canvas-service";
import type { CanvasElement } from "../excalidraw/element-projection";
import {
  loadLocalScene,
  saveLocalScene,
  type StorageLike,
} from "../excalidraw/local-scene-store";
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
  const [sceneStorage] = useState<StorageLike | null>(() => {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  });
  const [initialScene] = useState(() =>
    sceneStorage ? loadLocalScene(sceneStorage) : null,
  );
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
        waitForEditorSettle: () =>
          new Promise((resolve) =>
            requestAnimationFrame(() =>
              requestAnimationFrame(() => resolve()),
            ),
          ),
      }),
  );
  const [canvasReady, setCanvasReady] = useState(false);
  const [canvasStatus, setCanvasStatus] = useState(service.getStatus());
  const [registryState, setRegistryState] = useState<RegistryState>({
    status: "detecting",
    registeredCount: 0,
  });
  const [lastMetric, setLastMetric] = useState<ToolMetric | null>(null);
  const serviceReady = useRef(false);
  const persistenceTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleApi = useCallback(
    (api: CanvasApi) => {
      service.attach(api);
    },
    [service],
  );

  const handleChange = useCallback(
    (
      elements: unknown,
      appState: { selectedElementIds?: Record<string, boolean> },
      files: Record<string, unknown>,
    ) => {
      const sceneElements = elements as CanvasElement[];
      service.observeEditorChange(sceneElements, appState, files);
      if (!serviceReady.current) {
        serviceReady.current = true;
        setCanvasReady(true);
        onServiceReady?.(service);
      }
      if (persistenceTimer.current) clearTimeout(persistenceTimer.current);
      persistenceTimer.current = setTimeout(() => {
        if (sceneStorage) {
          saveLocalScene(
            sceneStorage,
            sceneElements,
            appState as Record<string, unknown>,
          );
        }
      }, 500);
    },
    [onServiceReady, sceneStorage, service],
  );

  useEffect(() => {
    return () => {
      if (persistenceTimer.current) clearTimeout(persistenceTimer.current);
      service.detach();
    };
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
          initialData={
            (initialScene
              ? {
                  elements: initialScene.elements,
                  appState: initialScene.appState,
                }
              : undefined) as never
          }
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
