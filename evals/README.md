# DrawMCP WebMCP evals

These fixtures follow Google Chrome Labs' experimental `webmcp-evals` format.

- `tools.json` is generated from the production tool definitions.
- `webmcp-evals.json` tests natural-language tool selection and arguments.
- `npm run evals:smoke:local` invokes expected calls directly against a running local page without an LLM or API key.
- `excalidraw-mcp-surface-map.md` accounts for every audited official MCP surface.
- `BENCHMARK.md` defines the reproducible side-by-side timing and reliability protocol.
- `benchmark-template.json` is the versioned raw-data shape for measured runs.

Regenerate schemas after any contract change:

```bash
npm run evals:export
npm run evals:check
```

The deterministic smoke command expects the Vite development server at `http://127.0.0.1:5173`.

Current local proof: 11/11 deterministic smoke steps passed across all seven
cases on 2026-09-01. Treat that as local runtime evidence, not deployed-runtime
evidence; the release proof must repeat the suite against the exact Vercel URL.
