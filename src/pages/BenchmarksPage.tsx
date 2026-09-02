import { DrawablyCard, DrawablyHighlight, DrawablyList } from "drawably/react";
import { DrawablyLink } from "../components/DrawablyLink";
import { SiteHeader } from "../components/SiteHeader";
import { liveBenchmarkEvidence } from "../data/live-benchmark-evidence";

const p50 = liveBenchmarkEvidence.comparison.p50;
const p90 = liveBenchmarkEvidence.comparison.p90;
const pairs = liveBenchmarkEvidence.counts.pairs;
const successes = liveBenchmarkEvidence.counts.semantic_successes;
const total = liveBenchmarkEvidence.counts.total_trials;
const formatMs = (value: number) => `${value.toFixed(2)} ms`;

export const BenchmarksPage = () => (
  <main className="site-page benchmark-page">
    <SiteHeader current="benchmarks" />

    <section className="benchmark-hero section-shell">
      <p className="section-kicker">Verified live result</p>
      <h1>
        WebMCP was{" "}
        <DrawablyHighlight fill="#dff5e4">
          {p50.webmcp_speedup.toFixed(2)}× faster.
        </DrawablyHighlight>
      </h1>
      <p>
        I ran {pairs} randomized production pairs from the same machine. Every
        trial had to produce the correct diagram, and every WebMCP trial had to
        change the rendered Excalidraw canvas before its clock stopped.
      </p>
    </section>

    <section className="benchmark-snapshot section-shell">
      <DrawablyCard className="snapshot-card snapshot-card-primary" roughness={0.65} stroke="#2f9e44">
        <p>DrawMCP WebMCP p50</p>
        <strong>{p50.webmcp_ms.toFixed(2)} <small>ms</small></strong>
        <span>two page calls and a rendered canvas change</span>
      </DrawablyCard>
      <DrawablyCard className="snapshot-card" roughness={0.65} stroke="#6c5ce7">
        <p>Official public MCP p50</p>
        <strong>{p50.official_mcp_ms.toFixed(2)} <small>ms</small></strong>
        <span>checkpoint response before widget rendering</span>
      </DrawablyCard>
      <DrawablyCard className="snapshot-card" roughness={0.65} stroke="#77736a">
        <p>Semantic success</p>
        <strong>{successes}/{total}</strong>
        <span>{pairs} randomized AB/BA pairs · zero discarded failures</span>
      </DrawablyCard>
    </section>

    <section className="observed-section section-shell">
      <div className="section-heading split-heading">
        <div>
          <p className="section-kicker">What actually raced</p>
          <h2>The page finished before the server returned.</h2>
        </div>
        <p>
          DrawMCP performed more observable work. The official MCP measurement
          stopped at checkpoint creation, before its separate widget rendered.
        </p>
      </div>
      <DrawablyCard className="observed-table" roughness={0.5} stroke="#77736a">
        <div className="observed-head"><span>Production boundary</span><span>p50</span><span>p90</span><span>Pairs</span></div>
        <div><strong>WebMCP: add + fit + rendered pixels</strong><span>{formatMs(p50.webmcp_ms)}</span><span>{formatMs(p90.webmcp_ms)}</span><span>{pairs}</span></div>
        <div><strong>Official MCP: create_view checkpoint</strong><span>{formatMs(p50.official_mcp_ms)}</span><span>{formatMs(p90.official_mcp_ms)}</span><span>{pairs}</span></div>
      </DrawablyCard>
      <div className="observation-note">
        <p>
          WebMCP was {p90.webmcp_speedup.toFixed(2)}× faster at p90. We withhold
          p95 because each lane has fewer than 40 successful live trials. These
          numbers compare the deployed DrawMCP task with the public official
          service; they do not claim that every WebMCP site beats every MCP
          server.
        </p>
        <a className="text-link" href={liveBenchmarkEvidence.raw.path}>
          Download all raw trials <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>

    <section className="protocol-section section-shell">
      <div className="protocol-copy">
        <p className="section-kicker">Benchmark contract</p>
        <h2>A fast wrong answer still loses.</h2>
        <p>
          The scene oracle runs before timing reaches the summary. Failures stay
          in the denominator. The accepted file records the deployment commit,
          Chrome and Node versions, seed, lane order, byte counts, tool calls,
          confidence intervals, and the SHA-256 checksum of every raw trial.
        </p>
      </div>
      <DrawablyList className="protocol-checks" marker="check" stroke="#2f9e44">
        <li>{pairs} seeded, randomized production pairs</li>
        <li>{successes}/{total} semantically correct results</li>
        <li>{liveBenchmarkEvidence.counts.rendered_webmcp_successes}/{pairs} rendered WebMCP changes</li>
        <li>p50 and p90 with 2,000-sample bootstrap intervals</li>
        <li>Public MCP throttled between calls</li>
        <li>p95 withheld below the sample threshold</li>
      </DrawablyList>
    </section>

    <section className="trace-section section-shell">
      <div className="section-heading split-heading">
        <div>
          <p className="section-kicker">Inspect it in Chrome</p>
          <h2>Every WebMCP call appears on the browser timeline.</h2>
        </div>
        <p>
          DrawMCP publishes User Timing spans into a dedicated DevTools track,
          including the tool name, outcome, and measured duration.
        </p>
      </div>
      <DrawablyCard className="trace-board" roughness={0.55} stroke="#77736a">
        <div className="trace-board-head">
          <div><span className="trace-record-dot" aria-hidden="true" /><strong>DrawMCP</strong><span>WebMCP tool execution</span></div>
          <span className="trace-ready">instrumented</span>
        </div>
        <ol className="trace-steps">
          <li><span>01</span><p>Open <strong>/canvas</strong> and DevTools → Performance.</p></li>
          <li><span>02</span><p>Enable <strong>Show custom tracks</strong> and record.</p></li>
          <li><span>03</span><p>Ask the agent to change the open canvas.</p></li>
          <li><span>04</span><p>Inspect each <strong>drawmcp:*</strong> duration and outcome.</p></li>
        </ol>
      </DrawablyCard>
    </section>

    <section className="benchmark-cta section-shell">
      <div>
        <p className="section-kicker">Try DrawMCP</p>
        <h2>Draw through the normal Excalidraw controls.</h2>
      </div>
      <DrawablyLink href="/canvas" tone="dark">
        Open DrawMCP ↗
      </DrawablyLink>
    </section>
  </main>
);
