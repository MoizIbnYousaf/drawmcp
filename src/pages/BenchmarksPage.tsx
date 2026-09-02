import { DrawablyCard, DrawablyHighlight, DrawablyList } from "drawably/react";
import type { CSSProperties } from "react";
import { DrawablyLink } from "../components/DrawablyLink";
import { SiteHeader } from "../components/SiteHeader";

const phases = [
  "Prompt",
  "Decision",
  "Tool",
  "Visible result",
  "Human edit",
  "Continue",
];

export const BenchmarksPage = () => (
  <main className="site-page benchmark-page">
    <SiteHeader current="benchmarks" />
    <section className="benchmark-hero section-shell">
      <p className="section-kicker">The measurement room</p>
      <h1>
        Fast is only useful when we say what the{" "}
        <DrawablyHighlight fill="#ffec99">clock includes.</DrawablyHighlight>
      </h1>
      <p>
        DrawMCP records protocol, agent, execution, and visible-result timing as
        separate boundaries. Tool-level observations are published below, but
        the same-host end-to-end run is still pending, so no winner is declared.
      </p>
    </section>

    <section className="benchmark-snapshot section-shell">
      <DrawablyCard className="snapshot-card snapshot-card-primary" roughness={0.65} stroke="#2f9e44">
        <p>WebMCP page-local p50</p>
        <strong>1.4 <small>ms</small></strong>
        <span>Five warm deployed runs</span>
      </DrawablyCard>
      <DrawablyCard className="snapshot-card" roughness={0.65} stroke="#6c5ce7">
        <p>Official MCP direct p50</p>
        <strong>110.9 <small>ms</small></strong>
        <span>Five warm Streamable HTTP runs</span>
      </DrawablyCard>
      <DrawablyCard className="snapshot-card" roughness={0.65} stroke="#77736a">
        <p>Controlled paired runs</p>
        <strong>0</strong>
        <span>Not published yet</span>
      </DrawablyCard>
    </section>

    <section className="observed-section section-shell">
      <div className="section-heading split-heading">
        <div>
          <p className="section-kicker">Observed tool boundaries</p>
          <h2>Three clocks, not one misleading bar.</h2>
        </div>
        <p>
          Page execution, host bridge, and remote MCP transport are displayed
          separately because combining them would erase the architecture.
        </p>
      </div>
      <DrawablyCard className="observed-table" roughness={0.5} stroke="#77736a">
        <div className="observed-head"><span>Boundary</span><span>p50</span><span>p95</span><span>Warm runs</span></div>
        <div><strong>WebMCP page-local execution</strong><span>1.4 ms</span><span>1.48 ms</span><span>5</span></div>
        <div><strong>Official MCP direct SDK transport</strong><span>110.9 ms</span><span>215.0 ms</span><span>5</span></div>
        <div><strong>ChatGPT WebMCP host round trip</strong><span>2961 ms</span><span>3491 ms</span><span>5</span></div>
      </DrawablyCard>
      <div className="observation-note">
        <p>
          The same five-element diagram succeeded in every run. The official
          response was 897 bytes; the WebMCP mutation receipt was 250 bytes.
          Host implementations differ, so these observations explain where time
          appears—they do not rank the protocols end to end.
        </p>
        <a className="text-link" href="/benchmarks/2026-09-01-tool-boundary.json">
          Download raw run data <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>

    <section className="timeline-section section-shell">
      <div className="section-heading split-heading">
        <div>
          <p className="section-kicker">Same-task timeline</p>
          <h2>Six moments, measured independently.</h2>
        </div>
        <p>
          The final comparison will use at least five warm runs per lane after
          one discarded cold run.
        </p>
      </div>
      <DrawablyCard className="timeline-board" roughness={0.55} stroke="#77736a">
        <div className="timeline-label">WebMCP</div>
        <div className="timeline-track timeline-track-webmcp">
          {phases.map((phase, index) => (
            <div className="timeline-phase" key={phase}>
              <i style={{ "--phase": index } as CSSProperties} />
              <span>{phase}</span>
            </div>
          ))}
        </div>
        <div className="timeline-label">Official MCP</div>
        <div className="timeline-track timeline-track-pending">
          {phases.map((phase) => (
            <div className="timeline-phase" key={phase}>
              <i />
              <span>{phase}</span>
            </div>
          ))}
        </div>
        <p className="timeline-caption">
          Structure shown now; segment widths become data-driven only after the
          controlled run set is recorded.
        </p>
      </DrawablyCard>
    </section>

    <section className="protocol-section section-shell">
      <div className="protocol-copy">
        <p className="section-kicker">Benchmark protocol</p>
        <h2>Hold everything still except the boundary.</h2>
        <p>
          Both lanes receive the same two-stage architecture-diagram task using
          the same model, host application, machine, network, and reset state.
          Every published chart links back to the sanitized run data and exact
          deployment.
        </p>
      </div>
      <DrawablyList className="protocol-checks" marker="check" stroke="#2f9e44">
        {[
          "Same prompt and target diagram",
          "One discarded cold run",
          "Five or more warm runs",
          "p50 and p95 durations",
          "Tool calls, retries, and handoffs",
          "Human-edit state preservation",
        ].map((item) => (
          <li key={item}>{item}</li>
        ))}
      </DrawablyList>
    </section>

    <section className="boundaries-section">
      <div className="section-shell">
        <p className="section-kicker">What each number means</p>
        <div className="boundary-grid">
          <DrawablyCard roughness={0.7} stroke="#817b70"><span>01</span><h3>Decision</h3><p>Prompt submission to the first tool call.</p></DrawablyCard>
          <DrawablyCard roughness={0.7} stroke="#817b70"><span>02</span><h3>Execution</h3><p>The tool boundary only—local JavaScript or remote service.</p></DrawablyCard>
          <DrawablyCard roughness={0.7} stroke="#817b70"><span>03</span><h3>Visible result</h3><p>Wall clock until the canvas is stable and useful.</p></DrawablyCard>
          <DrawablyCard roughness={0.7} stroke="#817b70"><span>04</span><h3>Continuity</h3><p>Whether a human edit survives the next agent operation.</p></DrawablyCard>
        </div>
      </div>
    </section>

    <section className="benchmark-cta section-shell">
      <div>
        <p className="section-kicker">Current verdict</p>
        <h2>The WebMCP implementation works. The race has not been run.</h2>
      </div>
      <DrawablyLink href="/canvas" tone="dark">
        Open the verified canvas ↗
      </DrawablyLink>
    </section>
  </main>
);
