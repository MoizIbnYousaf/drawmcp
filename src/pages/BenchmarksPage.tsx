import { DrawablyCard, DrawablyHighlight, DrawablyList } from "drawably/react";
import type { CSSProperties } from "react";
import { DrawablyLink } from "../components/DrawablyLink";
import { SiteHeader } from "../components/SiteHeader";
import { benchmarkEvidence } from "../data/benchmark-evidence";

const phases = [
  "Prompt",
  "Decision",
  "Tool",
  "Visible result",
  "Human edit",
  "Continue",
];

const controlled = benchmarkEvidence.lanes;
const webTask = controlled.webmcp.warm.task_duration_ms;
const webComponent = controlled.webmcp.warm.component_duration_ms;
const officialComponent = controlled["official-mcp"].warm.task_duration_ms;
const formatMs = (value: number) => `${value.toFixed(2)} ms`;
const semanticPassed =
  benchmarkEvidence.counts.total_trials - benchmarkEvidence.counts.semantic_failures;
const semanticTotal = benchmarkEvidence.counts.total_trials;
const warmPairs = benchmarkEvidence.counts.warm_pairs;
const coldPairs = benchmarkEvidence.counts.cold_pairs;
const webWarmRuns = controlled.webmcp.warm.attempts;
const officialWarmRuns = controlled["official-mcp"].warm.attempts;

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
        The controlled component run is complete: {semanticPassed}/{semanticTotal} scenes passed the
        semantic oracle. The same-host prompt-to-visible-result run is still
        pending, so no end-to-end winner is declared.
      </p>
    </section>

    <section className="benchmark-snapshot section-shell">
      <DrawablyCard className="snapshot-card snapshot-card-primary" roughness={0.65} stroke="#2f9e44">
        <p>WebMCP controlled task p50</p>
        <strong>{webTask.p50.value.toFixed(2)} <small>ms</small></strong>
        <span>{webWarmRuns} warm mounted-page runs</span>
      </DrawablyCard>
      <DrawablyCard className="snapshot-card" roughness={0.65} stroke="#6c5ce7">
        <p>Official MCP component p50</p>
        <strong>{officialComponent.p50.value.toFixed(2)} <small>ms</small></strong>
        <span>{officialWarmRuns} warm local Streamable HTTP runs</span>
      </DrawablyCard>
      <DrawablyCard className="snapshot-card" roughness={0.65} stroke="#77736a">
        <p>Semantic trial success</p>
        <strong>{semanticPassed}/{semanticTotal}</strong>
        <span>{warmPairs} warm and {coldPairs} cold pairs</span>
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
        <div><strong>WebMCP mounted-page task</strong><span>{formatMs(webTask.p50.value)}</span><span>{formatMs(webTask.p95!.value)}</span><span>{webWarmRuns}</span></div>
        <div><strong>WebMCP page measures</strong><span>{formatMs(webComponent.p50.value)}</span><span>{formatMs(webComponent.p95!.value)}</span><span>{webWarmRuns}</span></div>
        <div><strong>Official MCP checkpoint component</strong><span>{formatMs(officialComponent.p50.value)}</span><span>{formatMs(officialComponent.p95!.value)}</span><span>{officialWarmRuns}</span></div>
      </DrawablyCard>
      <div className="observation-note">
        <p>
          Every trial produced the required {benchmarkEvidence.scenario.required_nodes} nodes, matching labels, and {benchmarkEvidence.scenario.required_edges}
          graph edges. The official timer ends at local checkpoint completion
          before widget rendering; the WebMCP timer includes two page calls and
          the mounted editor mutation. These results explain component cost and
          do not rank the protocols end to end.
        </p>
        <a className="text-link" href={benchmarkEvidence.raw.path}>
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
          Segment widths remain structural until a same-model, same-host journey
          records prompt, decision, visible result, human edit, and continuation.
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
          same-host run set is recorded.
        </p>
      </DrawablyCard>
    </section>

    <section className="protocol-section section-shell">
      <div className="protocol-copy">
        <p className="section-kicker">Benchmark protocol</p>
        <h2>Hold everything still except the boundary.</h2>
        <p>
          The controlled local tier holds task semantics, source commits,
          machine, trial order, and reset state. The later host tier will add the
          same model and host application. Every published number links to the
          checksummed raw trials.
        </p>
      </div>
      <DrawablyList className="protocol-checks" marker="check" stroke="#2f9e44">
        {[
          "Same prompt and target diagram",
          "One discarded warm-up pair",
          `${warmPairs} randomized warm pairs`,
          "p50, p90, p95, and bootstrap intervals",
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
        <h2>The controlled run is complete. The host journey remains open.</h2>
      </div>
      <DrawablyLink href="/canvas" tone="dark">
        Open the verified canvas ↗
      </DrawablyLink>
    </section>
  </main>
);
