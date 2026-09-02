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
    <section className="canvas-shell" aria-label="DrawMCP canvas">
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
