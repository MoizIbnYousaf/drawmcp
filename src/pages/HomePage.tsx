import {
  DrawablyBadge,
  DrawablyCard,
  DrawablyCircle,
  DrawablyHighlight,
  DrawablyUnderline,
} from "drawably/react";
import { DrawablyLink } from "../components/DrawablyLink";
import { SiteHeader } from "../components/SiteHeader";
import { benchmarkEvidence } from "../data/benchmark-evidence";
import { releaseEvidence } from "../data/release-evidence";
import { TOOL_NAMES } from "../webmcp/tool-names";

const proof = [
  {
    value: `${releaseEvidence.tools.passed}/${releaseEvidence.tools.total}`,
    label: "site tools",
  },
  {
    value: `${releaseEvidence.deterministic_browser.passed}/${releaseEvidence.deterministic_browser.total}`,
    label: "browser proof steps",
  },
  {
    value: `${releaseEvidence.local_model.passed}/${releaseEvidence.local_model.total}`,
    label: "local model decisions",
  },
];

const webMcpP50 =
  benchmarkEvidence.lanes.webmcp.warm.task_duration_ms.p50.value;
const officialP50 =
  benchmarkEvidence.lanes["official-mcp"].warm.task_duration_ms.p50.value;
const webWarm = benchmarkEvidence.lanes.webmcp.warm;
const officialWarm = benchmarkEvidence.lanes["official-mcp"].warm;
const officialModelVisibleTools =
  benchmarkEvidence.scenario.official_model_visible_tools.length;

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
          DrawMCP exposes the open Excalidraw canvas as {TOOL_NAMES.length} WebMCP tools—so a
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
              <div><dt>Public tools</dt><dd>{officialModelVisibleTools}</dd></div>
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
              <div><dt>Site tools</dt><dd>{releaseEvidence.tools.total}</dd></div>
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
          <p>WebMCP controlled task p50</p>
          <strong>{webMcpP50.toFixed(2)} ms</strong>
          <span>{webWarm.attempts} warm local runs · add, fit, and visible mutation</span>
        </DrawablyCard>
        <DrawablyCard
          className="metric-visual"
          role="img"
          aria-label="Benchmark collection status"
          roughness={0.55}
          stroke="#77736a"
        >
          <div className="metric-row">
            <span>WebMCP mounted-page task</span>
            <div className="metric-track"><i className="metric-fill" /></div>
            <strong>{webMcpP50.toFixed(2)} ms</strong>
          </div>
          <div className="metric-row metric-row-official">
            <span>Official MCP direct transport</span>
            <div className="metric-track"><i className="metric-fill-official" /></div>
            <strong>{officialP50.toFixed(2)} ms</strong>
          </div>
          <div className="metric-note">
            Both lanes completed {webWarm.semantic_successes}/{webWarm.attempts} and {officialWarm.semantic_successes}/{officialWarm.attempts} warm scenes correctly. Their component
            boundaries include different work, so no end-to-end winner is claimed.
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
          <h2>{TOOL_NAMES.length} small tools. One shared state.</h2>
        </div>
        <div className="tool-cloud" aria-label="DrawMCP tool names">
          {TOOL_NAMES.map((tool) => (
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
