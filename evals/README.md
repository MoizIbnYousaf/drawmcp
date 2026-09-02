# DrawMCP WebMCP evals

These fixtures follow Google Chrome Labs' experimental `webmcp-evals` format.

- `tools.json` is generated from the production tool definitions.
- `webmcp-evals.json` tests natural-language tool selection and arguments.
- `npm run evals:smoke:local` invokes expected calls directly against a running local page without an LLM or API key.
- `npm run evals:deterministic` starts an isolated local Vite server, drives Chrome's real WebMCP API, checks DrawMCP domain receipts, and validates the resulting scene with a semantic graph oracle.
- `npm run evals:deterministic:production` repeats the same domain and scene assertions against `drawmcp.dev`.
- `npm run evals:probabilistic` runs the direct, ambiguous, recovery, and no-tool corpora five times with a named Ollama model by default.
- `npm run evals:accept -- <summary-path>` copies only a passing, sanitized model run into `evidence/evals/`.
- `excalidraw-mcp-surface-map.md` accounts for every audited official MCP surface.
- `BENCHMARK.md` defines the reproducible side-by-side timing and reliability protocol.
- `benchmark-template.json` is the versioned raw-data shape for measured runs.

Regenerate schemas after any contract change:

```bash
npm run evals:export
npm run evals:check
```

The deterministic smoke command expects the Vite development server at
`http://127.0.0.1:5173` and exercises the tool-owning `/canvas` route.

The Chrome Labs smoke command proves discovery and authored call execution. It
does not treat DrawMCP's `{ "ok": false }` result as a failed domain operation,
so it cannot replace the project-owned deterministic runner. Local and
production reports are stored under ignored `.evals/` until a sanitized release
manifest explicitly accepts them.

The accepted local-model baseline is
`evidence/evals/2026-09-02T08-37-45-793Z/summary.json`: 125/125 scored
decisions passed across five runs per case, with zero observed safety violations,
zero runner errors, and zero production-schema-invalid calls. This is evidence
for the recorded Qwen model and adapted Ollama schema, not ChatGPT host evidence.
