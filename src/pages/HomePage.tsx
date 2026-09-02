import {
  DrawablyBadge,
  DrawablyCard,
  DrawablyCircle,
  DrawablyHighlight,
  DrawablyUnderline,
} from "drawably/react";
import { DrawablyLink } from "../components/DrawablyLink";
import { SiteHeader } from "../components/SiteHeader";
import { liveBenchmarkEvidence } from "../data/live-benchmark-evidence";
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

const liveP50 = liveBenchmarkEvidence.comparison.p50;
const liveP90 = liveBenchmarkEvidence.comparison.p90;
const speedup = liveP50.webmcp_speedup;

const DemoVideo = ({
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
    <figcaption className="visually-hidden">{label}. Silent thirteen-second human-agent game.</figcaption>
  </figure>
);

export const HomePage = () => (
  <main className="site-page home-page">
    <SiteHeader current="home" />

    <section className="hero section-shell">
      <div className="hero-copy">
        <p className="section-kicker">
          <span className="live-dot" aria-hidden="true" />
          Excalidraw with page-native agent tools
        </p>
        <h1>
          You draw. The agent answers on the{" "}
          <DrawablyHighlight fill="#dff5e4" roughness={0.7}>
            same canvas.
          </DrawablyHighlight>
        </h1>
        <p className="hero-lede">
          DrawMCP gives the browser agent {TOOL_NAMES.length} tools over the
          Excalidraw canvas on screen. You draw, the agent responds, and both
          moves stay in one history.
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

    <section className="game-showcase" id="play">
      <div className="section-shell">
        <div className="section-heading split-heading">
          <div>
            <p className="section-kicker">Moiz vs Codex</p>
            <h2>You play X. The agent sees it.</h2>
          </div>
          <p>
            Draw through normal Excalidraw controls. The agent reads that exact
            board, plays O through WebMCP, and leaves the canvas ready for your
            next move.
          </p>
        </div>
        <DrawablyCard className="game-video-card" roughness={0.55} stroke="#63be73">
          <DemoVideo
            label="Moiz and Codex playing tic-tac-toe on one live Excalidraw canvas"
            poster="/videos/tic-tac-toe-poster.jpg"
            src="/videos/tic-tac-toe.mp4"
          />
          <div className="game-video-facts">
            <span><strong>Human</strong> Excalidraw keyboard and pointer</span>
            <span><strong>Agent</strong> seven page-native tools</span>
            <span><strong>State</strong> one revision and native Undo</span>
          </div>
        </DrawablyCard>
        <div className="game-actions">
          <DrawablyLink href="/canvas?demo=tic-tac-toe" tone="paper">
            Play against the agent <span aria-hidden="true">↗</span>
          </DrawablyLink>
        </div>
      </div>
    </section>

    <section className="speed-section section-shell">
      <div className="section-heading split-heading">
        <div>
          <p className="section-kicker">Live production benchmark</p>
          <h2>{speedup.toFixed(2)}× faster on the task we measured.</h2>
        </div>
        <p>
          Twenty randomized pairs. DrawMCP finished two page calls and changed
          the visible canvas before the official public MCP returned its
          checkpoint. The official widget had not rendered yet.
        </p>
      </div>
      <div className="speed-grid">
        <DrawablyCard className="speed-card speed-card-web" roughness={0.65} stroke="#2f9e44">
          <p>DrawMCP WebMCP</p>
          <strong>{liveP50.webmcp_ms.toFixed(2)} <small>ms p50</small></strong>
          <span>add + fit + rendered pixel change</span>
        </DrawablyCard>
        <DrawablyCard className="speed-card" roughness={0.65} stroke="#6c5ce7">
          <p>Official public MCP</p>
          <strong>{liveP50.official_mcp_ms.toFixed(2)} <small>ms p50</small></strong>
          <span>create_view checkpoint response, before widget render</span>
        </DrawablyCard>
        <DrawablyCard className="speed-card speed-card-proof" roughness={0.65} stroke="#77736a">
          <p>Evidence</p>
          <strong>{liveBenchmarkEvidence.counts.semantic_successes}/{liveBenchmarkEvidence.counts.total_trials}</strong>
          <span>{liveP90.webmcp_speedup.toFixed(2)}× faster at p90 · p95 withheld</span>
        </DrawablyCard>
        <a className="speed-link" href="/benchmarks">
          <DrawablyUnderline roughness={0.7} stroke="#6c5ce7">
            Inspect the method and raw trials
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
