import { SiteHeader } from "../components/SiteHeader";

const tools = [
  ["get_canvas_summary", "Read a bounded scene summary and current revision."],
  ["get_selection", "Read the elements the person currently has selected."],
  ["add_elements", "Add validated Excalidraw shapes as one undoable action."],
  ["update_elements", "Change allowlisted fields on stable element IDs."],
  ["delete_elements", "Delete live elements and their owned bound text."],
  ["fit_to_content", "Focus the viewport on the selection or full drawing."],
  ["organize_diagram", "Arrange supported nodes with deterministic layout."],
];

export const DocsPage = () => (
  <main className="site-page docs-page">
    <SiteHeader current="docs" />
    <div className="docs-layout section-shell">
      <aside className="docs-sidebar">
        <p>Get started</p>
        <a href="#webmcp">Use WebMCP</a>
        <a href="#official-mcp">Connect official MCP</a>
        <a href="#local">Run locally</a>
        <p>Reference</p>
        <a href="#tools">Site tools</a>
        <a href="#revisions">Revisions and history</a>
        <a href="#security">Security boundary</a>
        <a href="#auth">Auth and hosting</a>
      </aside>

      <article className="docs-content">
        <header className="docs-hero">
          <p className="section-kicker">DrawMCP documentation</p>
          <h1>One canvas, available to people and agents.</h1>
          <p>
            DrawMCP is an Excalidraw editor whose top-level page registers a
            bounded tool surface through the WebMCP draft API.
          </p>
        </header>

        <section id="webmcp">
          <p className="doc-step">01 · WebMCP</p>
          <h2>Use DrawMCP in ChatGPT</h2>
          <ol className="doc-steps">
            <li>
              Open <a href="/canvas">the DrawMCP canvas</a> in ChatGPT’s
              in-app browser.
            </li>
            <li>
              Wait for the status pill to show <strong>7/7 site tools</strong>.
            </li>
            <li>
              Ask the agent to inspect, create, update, delete, focus, or
              organize the open drawing.
            </li>
            <li>
              Keep editing normally. The next tool call reads the new page
              state.
            </li>
          </ol>
          <div className="callout callout-green">
            <strong>No connector setup is required for WebMCP.</strong>
            <span>The tools exist only while the DrawMCP page is open.</span>
          </div>
          <p>
            In Google Chrome, enable the experimental testing flag at{" "}
            <code className="inline-code">
              chrome://flags/#enable-webmcp-testing
            </code>{" "}
            before opening the page.
          </p>
        </section>

        <section id="official-mcp">
          <p className="doc-step">02 · Official MCP</p>
          <h2>Connect the official Excalidraw MCP</h2>
          <p>
            The comparison lane uses the upstream remote MCP service. Add the
            following URL as a custom MCP server or connector in any client
            that supports MCP Apps:
          </p>
          <pre className="code-block"><code>https://mcp.excalidraw.com</code></pre>
          <p>
            The upstream server exposes{" "}
            <code className="inline-code">read_me</code> and{" "}
            <code className="inline-code">create_view</code>, returning an
            interactive MCP App widget with checkpoint-backed continuation.
            DrawMCP does not proxy or replace that service.
          </p>
        </section>

        <section id="local">
          <p className="doc-step">03 · Local development</p>
          <h2>Run the exact project locally</h2>
          <pre className="code-block"><code>{`git clone --recurse-submodules git@github.com:MoizIbnYousaf/drawmcp.git
cd drawmcp
npm install
npm run dev`}</code></pre>
          <p>Run all deterministic gates before deploying:</p>
          <pre className="code-block"><code>{`npm run lint
npm test
npm run evals:check
npm run build`}</code></pre>
        </section>

        <section id="tools">
          <p className="doc-step">04 · Tool reference</p>
          <h2>The seven site tools</h2>
          <div className="tool-reference">
            {tools.map(([name, description]) => (
              <div className="tool-reference-row" key={name}>
                <code>{name}</code>
                <p>{description}</p>
              </div>
            ))}
          </div>
          <p>
            Every input schema is closed with{" "}
            <code className="inline-code">additionalProperties: false</code> and
            includes hard bounds for arrays, text, IDs, coordinates, and
            dimensions. Inputs are validated again inside the execution
            handler.
          </p>
        </section>

        <section id="revisions">
          <p className="doc-step">05 · Shared history</p>
          <h2>Revisions keep human and agent edits coherent</h2>
          <div
            className="revision-flow"
            aria-label="Revision-aware mutation flow"
          >
            <span>Read rev 5</span><b>→</b><span>Validate IDs</span><b>→</b>
            <span>Write rev 6</span><b>→</b><span>Undo / Redo</span>
          </div>
          <p>
            Mutations may include{" "}
            <code className="inline-code">expected_revision</code>. If the
            person changes the canvas after the agent reads it, the stale write
            fails closed and returns the current revision. Agent updates use
            Excalidraw’s own versioning primitive, so native Undo and Redo
            preserve the shared journey.
          </p>
        </section>

        <section id="security">
          <p className="doc-step">06 · Security</p>
          <h2>A deliberately narrow page boundary</h2>
          <ul className="doc-list">
            <li>No tool accepts arbitrary code, HTML, URLs, selectors, or file paths.</li>
            <li>No canvas tool uploads, shares, navigates, purchases, or contacts a backend.</li>
            <li>User-authored canvas text is bounded and marked as untrusted content.</li>
            <li>Mutations are visible, revision-guarded, serialized, and undoable.</li>
            <li>Tool registrations are aborted when the owning canvas unmounts.</li>
          </ul>
        </section>

        <section id="auth">
          <p className="doc-step">07 · Auth and hosting</p>
          <h2>Vercel is enough for the core</h2>
          <p>
            DrawMCP’s core is a static client application. It has no account
            database, session service, secret API keys, or remote canonical
            canvas state, so it does not need Render or an authentication
            provider. Vercel supplies HTTPS, which WebMCP requires as a secure
            context.
          </p>
          <div className="callout">
            <strong>If persistence or private team canvases are added later,</strong>
            <span>
              auth and storage become a separate product decision—not a
              prerequisite for this proof.
            </span>
          </div>
        </section>
      </article>
    </div>
  </main>
);
