import {
  DrawablyBadge,
  DrawablyCard,
  DrawablyHighlight,
  DrawablyList,
  DrawablyUnderline,
} from "drawably/react";
import { SiteHeader } from "../components/SiteHeader";
import { releaseEvidence } from "../data/release-evidence";
import { TOOL_NAMES, type ToolName } from "../webmcp/tool-names";

const toolDescriptions: Record<ToolName, string> = {
  get_canvas_summary: "Read a bounded scene summary and current revision.",
  get_selection: "Read the elements the person currently has selected.",
  add_elements: "Add validated Excalidraw shapes as one undoable action.",
  update_elements: "Change allowlisted fields on stable element IDs.",
  delete_elements: "Delete live elements and their owned bound text.",
  fit_to_content: "Focus the viewport on the selection or full drawing.",
  organize_diagram: "Arrange supported nodes with deterministic layout.",
};
const tools = TOOL_NAMES.map((name) => [name, toolDescriptions[name]] as const);
const toolStatus = `${releaseEvidence.tools.passed}/${releaseEvidence.tools.total}`;

export const DocsPage = () => (
  <main className="site-page docs-page">
    <SiteHeader current="docs" />
    <div className="docs-layout section-shell">
      <aside className="docs-sidebar">
        <p>Get started</p>
        <a href="#judge-path"><DrawablyUnderline>Verify in 90 seconds</DrawablyUnderline></a>
        <a href="#webmcp"><DrawablyUnderline>Use WebMCP</DrawablyUnderline></a>
        <a href="#official-mcp"><DrawablyUnderline>Connect official MCP</DrawablyUnderline></a>
        <a href="#shortcuts"><DrawablyUnderline>Native shortcuts</DrawablyUnderline></a>
        <a href="#local"><DrawablyUnderline>Run locally</DrawablyUnderline></a>
        <p>Reference</p>
        <a href="#tools"><DrawablyUnderline>Site tools</DrawablyUnderline></a>
        <a href="#revisions"><DrawablyUnderline>Revisions and history</DrawablyUnderline></a>
        <a href="#security"><DrawablyUnderline>Security boundary</DrawablyUnderline></a>
        <a href="#auth"><DrawablyUnderline>Auth and hosting</DrawablyUnderline></a>
        <a href="#ui-system"><DrawablyUnderline>UI system</DrawablyUnderline></a>
      </aside>

      <article className="docs-content">
        <header className="docs-hero">
          <p className="section-kicker">DrawMCP documentation</p>
          <h1>
            One canvas, available to{" "}
            <DrawablyHighlight fill="#dff5e4">people and agents.</DrawablyHighlight>
          </h1>
          <p>
            DrawMCP is an Excalidraw editor whose top-level page registers a
            bounded tool surface through the WebMCP draft API.
          </p>
        </header>

        <section id="judge-path">
          <p className="doc-step">00 · Challenge judge path</p>
          <h2>Verify the shared canvas in 90 seconds</h2>
          <ol className="doc-steps">
            <li>
              Open <a href="/canvas">the live canvas</a> in ChatGPT’s in-app
              browser and wait for <strong>{toolStatus} site tools</strong>.
            </li>
            <li>
              Ask: <em>“Summarize this canvas, add a green rectangle titled
              WebMCP, then fit the view to the drawing.”</em>
            </li>
            <li>Move the new shape by hand in the normal Excalidraw editor.</li>
            <li>
              Ask the agent to summarize the canvas again, then use native Undo
              and Redo to confirm that both actors share one history.
            </li>
          </ol>
          <DrawablyCard className="callout callout-green" roughness={0.65} stroke="#2f9e44">
            <strong>No login, connector, API key, or second canvas.</strong>
            <span>The page owns the tools, live scene, revision, and undo history.</span>
          </DrawablyCard>
        </section>

        <section id="webmcp">
          <p className="doc-step">01 · WebMCP</p>
          <h2>Use DrawMCP in ChatGPT</h2>
          <ol className="doc-steps">
            <li>
              Open <a href="/canvas">the DrawMCP canvas</a> in ChatGPT’s
              in-app browser.
            </li>
            <li>
              Wait for the status pill to show <strong>{toolStatus} site tools</strong>.
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
          <DrawablyCard className="callout callout-green" roughness={0.65} stroke="#2f9e44">
            <strong>No connector setup is required for WebMCP.</strong>
            <span>The tools exist only while the DrawMCP page is open.</span>
          </DrawablyCard>
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

        <section id="shortcuts">
          <p className="doc-step">03 · Native keyboard</p>
          <h2>Every Excalidraw shortcut stays native</h2>
          <p>
            The canvas takes focus on load and uses Excalidraw’s global keyboard
            handler. Tool keys, editing commands, zoom, clipboard operations,
            grouping, history, and the built-in shortcut reference therefore
            come from the installed editor—not a partial DrawMCP reimplementation.
          </p>
          <div className="revision-flow" aria-label="Common Excalidraw shortcuts">
            <DrawablyBadge stroke="#6c5ce7">R · rectangle</DrawablyBadge>
            <DrawablyBadge stroke="#6c5ce7">A · arrow</DrawablyBadge>
            <DrawablyBadge stroke="#6c5ce7">T · text</DrawablyBadge>
            <DrawablyBadge stroke="#2f9e44">⌘/Ctrl Z · undo</DrawablyBadge>
            <DrawablyBadge stroke="#2f9e44">? · all shortcuts</DrawablyBadge>
          </div>
          <DrawablyCard className="callout" roughness={0.65} stroke="#6e675f">
            <strong>Press ? on the canvas for the complete versioned list.</strong>
            <span>
              Excalidraw still suppresses global commands while a text field,
              editor, or modal owns the keystroke.
            </span>
          </DrawablyCard>
        </section>

        <section id="local">
          <p className="doc-step">04 · Local development</p>
          <h2>Run the exact project locally</h2>
          <pre className="code-block"><code>{`git clone --recurse-submodules git@github.com:MoizIbnYousaf/drawmcp.git
cd drawmcp
npm install
npm run dev`}</code></pre>
          <p>Run all deterministic gates before deploying:</p>
          <pre className="code-block"><code>{`npm run lint
npm test
npm run evals:check
npm run video:check
npm run build`}</code></pre>
        </section>

        <section id="tools">
          <p className="doc-step">05 · Tool reference</p>
          <h2>The {TOOL_NAMES.length} site tools</h2>
          <DrawablyCard className="tool-reference" roughness={0.55} stroke="#77736a">
            {tools.map(([name, description]) => (
              <div className="tool-reference-row" key={name}>
                <code>{name}</code>
                <p>{description}</p>
              </div>
            ))}
          </DrawablyCard>
          <p>
            Every input schema is closed with{" "}
            <code className="inline-code">additionalProperties: false</code> and
            includes hard bounds for arrays, text, IDs, coordinates, and
            dimensions. Inputs are validated again inside the execution
            handler.
          </p>
          <p>
            Scene reads return revision-bound pages. Start without a cursor,
            reuse only the returned <code className="inline-code">next_cursor</code>,
            and reread from the beginning if the revision changes. Every
            serialized tool result is capped at 1,536 characters.
          </p>
        </section>

        <section id="revisions">
          <p className="doc-step">06 · Shared history</p>
          <h2>Revisions keep human and agent edits coherent</h2>
          <div
            className="revision-flow"
            aria-label="Revision-aware mutation flow"
          >
            <DrawablyBadge stroke="#6c5ce7">Read rev 5</DrawablyBadge><b>→</b>
            <DrawablyBadge stroke="#6c5ce7">Validate IDs</DrawablyBadge><b>→</b>
            <DrawablyBadge stroke="#2f9e44">Write rev 6</DrawablyBadge><b>→</b>
            <DrawablyBadge stroke="#2f9e44">Undo / Redo</DrawablyBadge>
          </div>
          <p>
            Mutations may include{" "}
            <code className="inline-code">expected_revision</code>. If the
            person changes the canvas after the agent reads it, the stale write
            fails closed and returns the current revision. Agent updates use
            Excalidraw’s own versioning primitive, so native Undo and Redo
            preserve the shared journey. No-op updates return{" "}
            <code className="inline-code">changed: false</code> without adding
            a history entry, and every failure path releases the mutation queue.
          </p>
        </section>

        <section id="security">
          <p className="doc-step">07 · Security</p>
          <h2>A deliberately narrow page boundary</h2>
          <DrawablyList className="doc-list" marker="check" stroke="#2f9e44">
            <li>No tool accepts arbitrary code, HTML, URLs, selectors, or file paths.</li>
            <li>No canvas tool uploads, shares, navigates, purchases, or contacts a backend.</li>
            <li>User-authored canvas text is bounded and marked as untrusted content.</li>
            <li>Mutations are visible, revision-guarded, serialized, and undoable.</li>
            <li>Tool registrations are aborted when the owning canvas unmounts.</li>
            <li>Tool exposure uses the self-only origin policy and production security headers.</li>
          </DrawablyList>
        </section>

        <section id="auth">
          <p className="doc-step">08 · Auth and hosting</p>
          <h2>Vercel is enough for the core</h2>
          <p>
            DrawMCP’s core is a static client application. It has no account
            database, session service, secret API keys, or remote canonical
            canvas state, so it does not need Render or an authentication
            provider. Vercel supplies HTTPS, which WebMCP requires as a secure
            context.
          </p>
          <DrawablyCard className="callout" roughness={0.65} stroke="#6e675f">
            <strong>Reload recovery stays on this device.</strong>
            <span>
              DrawMCP stores a versioned non-file scene under
              <code> drawmcp:scene:v1</code>. Clearing the canvas clears that
              snapshot. Reload does not restore the previous Undo/Redo stack.
            </span>
          </DrawablyCard>
        </section>

        <section id="ui-system">
          <p className="doc-step">09 · UI system</p>
          <h2>Real controls with hand-drawn chrome</h2>
          <p>
            DrawMCP uses{" "}
            <a href="https://github.com/Danilaa1/drawably">Drawably 0.3.10</a>{" "}
            for SVG cards, badges, underlines, highlights, lists, calls to
            action, and the live canvas status. The controls remain semantic
            HTML, and Drawably automatically freezes its stroke animation when
            reduced motion is preferred. Excalidraw remains the canvas editor;
            Drawably styles the surrounding product and documentation.
          </p>
        </section>
      </article>
    </div>
  </main>
);
