import { lazy, Suspense } from "react";
import { SiteHeader } from "../components/SiteHeader";
import {
  TIC_TAC_TOE_AGENT_PROMPT,
  TIC_TAC_TOE_ELEMENTS,
  TIC_TAC_TOE_STORAGE_KEY,
} from "../demos/tic-tac-toe";

const DrawMcpCanvas = lazy(() =>
  import("../components/DrawMcpCanvas").then((module) => ({
    default: module.DrawMcpCanvas,
  })),
);

export const CanvasPage = () => {
  const ticTacToe =
    new URLSearchParams(window.location.search).get("demo") === "tic-tac-toe";
  return (
    <main className="canvas-page">
    <SiteHeader current="canvas" compact />
    {ticTacToe ? (
      <aside className="game-guide" aria-label="Tic-tac-toe WebMCP demo">
        <div>
          <strong>Moiz vs Codex</strong>
          <span>Draw X by hand. The agent plays O through WebMCP.</span>
        </div>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(TIC_TAC_TOE_AGENT_PROMPT)}
        >
          Copy agent prompt
        </button>
        <a href="/canvas">Exit game</a>
      </aside>
    ) : null}
    <section className="canvas-shell" aria-label="DrawMCP canvas">
      <Suspense
        fallback={
          <div className="canvas-loading" role="status">
            <span className="loading-mark" aria-hidden="true" />
            Loading the Excalidraw canvas…
          </div>
        }
      >
        <DrawMcpCanvas
          initialElements={ticTacToe ? TIC_TAC_TOE_ELEMENTS : undefined}
          storageKey={ticTacToe ? TIC_TAC_TOE_STORAGE_KEY : undefined}
        />
      </Suspense>
    </section>
  </main>
  );
};
