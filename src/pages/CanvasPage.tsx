import { lazy, Suspense } from "react";
import { SiteHeader } from "../components/SiteHeader";

const DrawMcpCanvas = lazy(() =>
  import("../components/DrawMcpCanvas").then((module) => ({
    default: module.DrawMcpCanvas,
  })),
);

export const CanvasPage = () => (
  <main className="canvas-page">
    <SiteHeader current="canvas" compact />
    <section
      aria-label="DrawMCP canvas"
      className="canvas-shell"
      id="main-content"
      tabIndex={-1}
    >
      <Suspense
        fallback={
          <div className="canvas-loading" role="status">
            <span className="loading-mark" aria-hidden="true" />
            Loading the Excalidraw canvas…
          </div>
        }
      >
        <DrawMcpCanvas />
      </Suspense>
    </section>
  </main>
);
