import { SiteHeader } from "../components/SiteHeader";

const proof = [
  { value: "7/7", label: "deployed site tools" },
  { value: "11/11", label: "deployed smoke steps" },
  { value: "46", label: "deterministic tests" },
];

const mcpSteps = ["Agent", "Remote MCP", "MCP App widget", "Editor"];
const webMcpSteps = ["Agent", "Page tools", "Current canvas"];

const Lane = ({
  steps,
  tone,
}: {
  steps: string[];
  tone: "violet" | "green";
}) => (
  <div className={`flow flow-${tone}`} aria-label={steps.join(" to ")}>
    {steps.map((step, index) => (
      <div className="flow-step-wrap" key={step}>
        <div className="flow-step">{step}</div>
        {index < steps.length - 1 ? (
          <span className="flow-arrow" aria-hidden="true">
            →
          </span>
        ) : null}
      </div>
    ))}
  </div>
);

export const HomePage = () => (
  <main className="site-page home-page">
    <SiteHeader current="home" />

    <section className="hero section-shell">
      <div className="hero-copy">
        <p className="section-kicker">
          <span className="live-dot" aria-hidden="true" />
          A browser-native Excalidraw experiment
        </p>
        <h1>
          The shortest path from an agent to the canvas is the page itself.
        </h1>
        <p className="hero-lede">
          DrawMCP exposes the open Excalidraw canvas as seven WebMCP tools—so a
          person and an agent can read, draw, revise, undo, and continue in one
          live state.
        </p>
        <div className="hero-actions">
          <a className="button button-dark" href="/canvas">
            Try the live canvas <span aria-hidden="true">↗</span>
          </a>
          <a className="button button-ghost" href="/docs">
            Read the setup
          </a>
        </div>
        <div className="proof-row" aria-label="Verified project results">
          {proof.map((item) => (
            <div className="proof-item" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="hero-art" aria-label="A shared human and agent canvas">
        <div className="art-grid" />
        <div className="sketch-card sketch-human">
          <span className="sketch-label">Human</span>
          <strong>selects an idea</strong>
          <span className="selection-corner corner-one" />
          <span className="selection-corner corner-two" />
          <span className="selection-corner corner-three" />
          <span className="selection-corner corner-four" />
        </div>
        <div className="sketch-arrow" aria-hidden="true">
          ↘
        </div>
        <div className="sketch-card sketch-agent">
          <span className="sketch-label">Agent</span>
          <strong>continues the canvas</strong>
        </div>
        <div className="tool-receipt">
          <span className="receipt-light" />
          update_elements
          <span>rev 5 → 6</span>
        </div>
        <div className="pencil-trace" aria-hidden="true" />
      </div>
    </section>

    <section className="comparison-section" id="comparison">
      <div className="section-shell">
        <div className="section-heading split-heading">
          <div>
            <p className="section-kicker">Same canvas. Different boundary.</p>
            <h2>Two valid ways to give an agent a pencil.</h2>
          </div>
          <p>
            This is a protocol comparison, not a claim that one architecture
            replaces the other.
          </p>
        </div>

        <div className="comparison-grid">
          <article className="lane-card lane-card-mcp">
            <div className="lane-card-header">
              <div>
                <p className="card-overline">Remote MCP lane</p>
                <h3>Official Excalidraw MCP</h3>
              </div>
              <span className="protocol-chip protocol-chip-violet">MCP App</span>
            </div>
            <Lane steps={mcpSteps} tone="violet" />
            <p className="lane-summary">
              A hosted MCP server generates an interactive diagram widget,
              checkpoints its state, and can open the result for fullscreen
              editing.
            </p>
            <dl className="lane-facts">
              <div><dt>Public tools</dt><dd>2</dd></div>
              <div><dt>Primary write</dt><dd>create_view</dd></div>
              <div><dt>State bridge</dt><dd>checkpoint</dd></div>
            </dl>
          </article>

          <article className="lane-card lane-card-webmcp">
            <div className="lane-card-header">
              <div>
                <p className="card-overline">Page-native lane</p>
                <h3>DrawMCP WebMCP</h3>
              </div>
              <span className="protocol-chip protocol-chip-green">WebMCP</span>
            </div>
            <Lane steps={webMcpSteps} tone="green" />
            <p className="lane-summary">
              The open website registers bounded tools against the exact canvas
              the person is viewing. Selection, revision, and undo history stay
              page-owned.
            </p>
            <dl className="lane-facts">
              <div><dt>Site tools</dt><dd>7</dd></div>
              <div><dt>Primary writes</dt><dd>add / update</dd></div>
              <div><dt>State bridge</dt><dd>live revision</dd></div>
            </dl>
          </article>
        </div>
      </div>
    </section>

    <section className="measurement-section section-shell">
      <div className="section-heading split-heading">
        <div>
          <p className="section-kicker">Performance, with boundaries</p>
          <h2>Measure the path, not just the stopwatch.</h2>
        </div>
        <p>
          We separate model decision time, transport, tool execution, and UI
          stabilization so the eventual comparison remains reproducible.
        </p>
      </div>

      <div className="measurement-board">
        <div className="metric-callout">
          <p>Last verified page-local call</p>
          <strong>0.7 ms</strong>
          <span>Single deployed sample · not end-to-end latency</span>
        </div>
        <div
          className="metric-visual"
          role="img"
          aria-label="Benchmark collection status"
        >
          <div className="metric-row">
            <span>WebMCP page execution</span>
            <div className="metric-track"><i className="metric-fill" /></div>
            <strong>recorded</strong>
          </div>
          <div className="metric-row metric-row-pending">
            <span>Official MCP controlled run</span>
            <div className="metric-track"><i /></div>
            <strong>pending</strong>
          </div>
          <div className="metric-note">
            No apples-to-apples result is published until both lanes run the
            same prompt, model, host, machine, network, and diagram.
          </div>
        </div>
        <a className="text-link" href="/benchmarks">
          Open the benchmark room <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>

    <section className="tool-section">
      <div className="section-shell tool-section-inner">
        <div>
          <p className="section-kicker">The page is the tool server</p>
          <h2>Seven small tools. One shared state.</h2>
        </div>
        <div className="tool-cloud" aria-label="DrawMCP tool names">
          {[
            "get_canvas_summary",
            "get_selection",
            "add_elements",
            "update_elements",
            "delete_elements",
            "fit_to_content",
            "organize_diagram",
          ].map((tool) => (
            <code key={tool}>{tool}</code>
          ))}
        </div>
      </div>
    </section>

    <section className="closing-section section-shell">
      <p className="section-kicker">Open the page. Ask the agent. Keep drawing.</p>
      <h2>There is no second canvas to sync.</h2>
      <a className="button button-dark" href="/canvas">
        Open DrawMCP <span aria-hidden="true">↗</span>
      </a>
    </section>

    <footer className="site-footer section-shell">
      <span>DrawMCP · Independent WebMCP experiment</span>
      <span>Built on the published Excalidraw API</span>
    </footer>
  </main>
);
