import { CaptureUpdateAction, Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useCallback, useEffect, useState } from "react";
import { CanvasService, type CanvasApi } from "../excalidraw/canvas-service";
import type { CanvasElement } from "../excalidraw/element-projection";

type DrawMcpCanvasProps = {
  onServiceReady?: (service: CanvasService) => void;
};

export const DrawMcpCanvas = ({ onServiceReady }: DrawMcpCanvasProps) => {
  const [service] = useState(
    () =>
      new CanvasService({
        captureUpdateImmediately: CaptureUpdateAction.IMMEDIATELY,
      }),
  );

  const handleApi = useCallback(
    (api: CanvasApi) => {
      service.attach(api);
      onServiceReady?.(service);
    },
    [onServiceReady, service],
  );

  useEffect(() => {
    return () => service.detach();
  }, [service]);

  return (
    <div className="drawmcp-canvas" data-testid="drawmcp-canvas">
      <Excalidraw
        name="DrawMCP"
        excalidrawAPI={handleApi as never}
        onChange={(elements, appState, files) =>
          service.observeEditorChange(
            elements as unknown as CanvasElement[],
            appState,
            files,
          )
        }
      />
    </div>
  );
};
