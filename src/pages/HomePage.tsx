import {
  DrawablyBadge,
  DrawablyCard,
  DrawablyCircle,
  DrawablyHighlight,
  DrawablyUnderline,
} from "drawably/react";
import { DrawablyLink } from "../components/DrawablyLink";
import { SiteHeader } from "../components/SiteHeader";

const proof = [
  { value: "7/7", label: "deployed site tools" },
  { value: "11/11", label: "deployed smoke steps" },
  { value: "51", label: "deterministic tests" },
];

const ComparisonVideo = ({
  label,
  poster,
  src,
}: {
  label: string;
  poster: string;
  src: string;
}) => (
  <figure className="comparison-video">
    <video
      aria-label={label}
      autoPlay
      data-testid="comparison-video"
      disablePictureInPicture
      loop
      muted
      playsInline
      poster={poster}
      preload="metadata"
    >
      <source src={src} type="video/mp4" />
    </video>
    <img aria-hidden="true" className="comparison-video-poster" src={poster} alt="" />
    <figcaption className="visually-hidden">{label}. Silent nine-second loop.</figcaption>
  </figure>
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
          The shortest path from an agent to the canvas is the{" "}
          <DrawablyHighlight fill="#dff5e4" roughness={0.7}>
            page itself.
          </DrawablyHighlight>
        </h1>
        <p className="hero-lede">
          DrawMCP exposes the open Excalidraw canvas as seven WebMCP tools—so a
          person and an agent can read, draw, revise, undo, and continue in one
          live state.
        </p>
        <div className="hero-actions">
          <DrawablyLink href="/canvas" tone="dark">
            Try the live canvas <span aria-hidden="true">↗</span>
          </DrawablyLink>
          <DrawablyLink href="/docs" tone="paper">
            Read the setup
          </DrawablyLink>
        </div>
        <div className="proof-row" aria-label="Verified project results">
          {proof.map((item) => (
            <div className="proof-item" key={item.label}>
              <DrawablyCircle roughness={0.65} stroke="#6c5ce7">
                <strong>{item.value}</strong>
              </DrawablyCircle>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <DrawablyCard
        className="hero-art"
        aria-label="A shared human and agent canvas"
        boil={0.16}
        roughness={0.55}
        stroke="#7b776d"
        width={1.4}
      >
        <div className="art-grid" />
        <DrawablyCard className="sketch-card sketch-human" roughness={1.2} stroke="#2b2a26">
          <span className="sketch-label">Human</span>
          <strong>selects an idea</strong>
          <span className="selection-corner corner-one" />
          <span className="selection-corner corner-two" />
          <span className="selection-corner corner-three" />
          <span className="selection-corner corner-four" />
        </DrawablyCard>
        <div className="sketch-arrow" aria-hidden="true">
          ↘
        </div>
        <DrawablyCard className="sketch-card sketch-agent" roughness={1.2} stroke="#2b2a26">
          <span className="sketch-label">Agent</span>
          <strong>continues the canvas</strong>
        </DrawablyCard>
        <DrawablyBadge className="tool-receipt" roughness={0.8} stroke="#2f9e44">
          <span className="receipt-light" />
          update_elements
          <span>rev 5 → 6</span>
        </DrawablyBadge>
        <div className="pencil-trace" aria-hidden="true" />
      </DrawablyCard>
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
          <DrawablyCard className="lane-card lane-card-mcp" roughness={0.6} stroke="#8f80ff">
            <div className="lane-card-header">
              <div>
                <p className="card-overline">Remote MCP lane</p>
                <h3>Official Excalidraw MCP</h3>
              </div>
              <DrawablyBadge className="protocol-chip protocol-chip-violet" roughness={0.7} stroke="#8f80ff" variant="scribble">MCP App</DrawablyBadge>
            </div>
            <ComparisonVideo
              label="Official Excalidraw MCP remote service flow"
              poster="/videos/official-mcp-poster.jpg"
              src="/videos/official-mcp.mp4"
            />
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
          </DrawablyCard>

          <DrawablyCard className="lane-card lane-card-webmcp" roughness={0.6} stroke="#63be73">
            <div className="lane-card-header">
              <div>
                <p className="card-overline">Page-native lane</p>
                <h3>DrawMCP WebMCP</h3>
              </div>
              <DrawablyBadge className="protocol-chip protocol-chip-green" roughness={0.7} stroke="#2f9e44" variant="scribble">WebMCP</DrawablyBadge>
            </div>
            <ComparisonVideo
              label="DrawMCP page-native WebMCP flow"
              poster="/videos/drawmcp-webmcp-poster.jpg"
              src="/videos/drawmcp-webmcp.mp4"
            />
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
          </DrawablyCard>
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
        <DrawablyCard className="metric-callout" roughness={0.65} stroke="#2f9e44">
          <p>WebMCP page-local p50</p>
          <strong>1.4 ms</strong>
          <span>Five warm deployed runs · not end-to-end latency</span>
        </DrawablyCard>
        <DrawablyCard
          className="metric-visual"
          role="img"
          aria-label="Benchmark collection status"
          roughness={0.55}
          stroke="#77736a"
        >
          <div className="metric-row">
            <span>WebMCP page execution</span>
            <div className="metric-track"><i className="metric-fill" /></div>
            <strong>1.4 ms</strong>
          </div>
          <div className="metric-row metric-row-official">
            <span>Official MCP direct transport</span>
            <div className="metric-track"><i className="metric-fill-official" /></div>
            <strong>110.9 ms</strong>
          </div>
          <div className="metric-note">
            These are different measurement boundaries. No end-to-end winner is
            published until both lanes run in the same model and host.
          </div>
        </DrawablyCard>
        <a className="text-link" href="/benchmarks">
          <DrawablyUnderline roughness={0.7} stroke="#6c5ce7">
            Open the benchmark room
          </DrawablyUnderline>{" "}<span aria-hidden="true">→</span>
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
            <DrawablyBadge key={tool} roughness={0.7} stroke="#6e675f">
              <code>{tool}</code>
            </DrawablyBadge>
          ))}
        </div>
      </div>
    </section>

    <section className="closing-section section-shell">
      <p className="section-kicker">Open the page. Ask the agent. Keep drawing.</p>
      <h2>There is no second canvas to sync.</h2>
      <DrawablyLink href="/canvas" tone="dark">
        Open DrawMCP <span aria-hidden="true">↗</span>
      </DrawablyLink>
    </section>

    <footer className="site-footer section-shell">
      <span>
        DrawMCP · Built for the{" "}
        <a href="https://webmcp.devpost.com/">2026 WebMCP Challenge</a>
      </span>
      <span>
        Built on the published Excalidraw API · UI chrome by{" "}
        <a href="https://github.com/Danilaa1/drawably">Drawably</a>
      </span>
    </footer>
  </main>
);
