# Upstream Excalidraw MCP contribution

Target: <https://github.com/excalidraw/excalidraw-mcp>

Status: paused. There is no active pull request or remote contribution branch.

## Human approval boundary

No upstream issue, pull request, branch, commit push, or deployment may be
published without the user reviewing the exact proposed change and explicitly
approving that public action.

## Locally validated candidate scope

The official MCP server's `create_view` tool saves a checkpoint and produces a
user-visible MCP App result while advertising `readOnlyHint: true` on the pinned
baseline. A future narrow contribution could change that annotation to `false`
and add a focused built-server contract test.

The local proof-of-concept was intentionally limited to:

1. marking `create_view` as state-changing;
2. registering the built tools in a contract test and checking `read_me`,
   `create_view`, and app-only visibility; and
3. running the existing upstream build before the contract assertion.

The contract test was observed failing before the metadata correction with
`true !== false`. After the local correction, the upstream TypeScript check,
Vite MCP App build, Bun server builds, and focused Node contract test passed.

## Contribution boundary

- Keep DrawMCP's page-owned WebMCP tools in this repository.
- Rebase and rerun upstream-native checks immediately before any proposed
  public contribution.
- Present the exact diff and verification receipt to the user before publishing.
- Do not add DrawMCP branding, benchmark data, or promotional content upstream.
- Do not treat local validation as upstream acceptance or endorsement.
