import "./App.css";
import { DrawMcpCanvas } from "./components/DrawMcpCanvas";

function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">DrawMCP</p>
          <h1>Human canvas. Agent tools. One live state.</h1>
        </div>
        <p className="header-note">WebMCP foundation</p>
      </header>
      <section className="canvas-shell" aria-label="DrawMCP canvas">
        <DrawMcpCanvas />
      </section>
    </main>
  );
}

export default App;
