import type { CanvasStatus } from "../excalidraw/canvas-service";
import type { RegistryState } from "../webmcp/register-tools";
import type { ToolMetric } from "../observability/tool-metrics";

type WebMcpStatusProps = {
  canvas: CanvasStatus;
  registry: RegistryState;
  expectedToolCount: number;
  lastMetric: ToolMetric | null;
};

const registryLabel = (state: RegistryState, expectedToolCount: number) => {
  switch (state.status) {
    case "registered":
      return `${state.registeredCount}/${expectedToolCount} site tools`;
    case "unsupported":
      return "Site tools unavailable";
    case "error":
      return "Site tools blocked";
    case "registering":
      return "Registering site tools";
    case "disposed":
      return "Site tools stopped";
    default:
      return "Detecting site tools";
  }
};

export const WebMcpStatus = ({
  canvas,
  registry,
  expectedToolCount,
  lastMetric,
}: WebMcpStatusProps) => (
  <aside
    className="webmcp-status"
    aria-live="polite"
    data-testid="webmcp-status"
  >
    <span
      className={`status-dot status-${registry.status}`}
      aria-hidden="true"
    />
    <span>{registryLabel(registry, expectedToolCount)}</span>
    <span className="status-divider" aria-hidden="true" />
    <span>Revision {canvas.revision}</span>
    {canvas.lastActor ? (
      <>
        <span className="status-divider" aria-hidden="true" />
        <span>Last: {canvas.lastActor}</span>
      </>
    ) : null}
    {lastMetric ? (
      <>
        <span className="status-divider" aria-hidden="true" />
        <span>Last call {lastMetric.duration_ms.toFixed(1)} ms</span>
      </>
    ) : null}
  </aside>
);
