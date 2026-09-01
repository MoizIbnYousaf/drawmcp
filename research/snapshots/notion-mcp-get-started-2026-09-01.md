> ## Documentation Index
>
> Fetch the complete documentation index at: [/llms.txt](https://developers.notion.com/llms.txt)
>
> Use this file to discover all available pages before exploring further.

[Skip to main content](https://developers.notion.com/guides/mcp/get-started-with-mcp#content-area)

Follow the instructions for your MCP client. After you authorize the connection, the client can read and update content that you can access in the selected Notion workspace.

## [​](https://developers.notion.com/guides/mcp/get-started-with-mcp\#codex-chatgpt)  Codex (ChatGPT)

Codex is OpenAI’s coding agent. See the [Codex MCP documentation](https://developers.openai.com/codex/mcp/) for more details.

1

Add the Notion server to your Codex configuration at `~/.codex/config.toml`:

```
[mcp_servers.notion]
url = "https://mcp.notion.com/mcp"
```

2

Authenticate by running:

```
codex mcp login notion
```

Complete the OAuth flow to connect your Notion workspace.

Project-level configuration

To share the Notion MCP configuration with your team, create a `.codex/config.toml` file in your project root with the same server configuration.

## [​](https://developers.notion.com/guides/mcp/get-started-with-mcp\#claude-code)  Claude Code

Claude Code is Anthropic’s agentic coding tool for the terminal. See the [Claude Code MCP documentation](https://docs.anthropic.com/en/docs/claude-code/mcp) for more details.Run this command in your terminal:

```
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

Then authenticate by running `/mcp` in Claude Code and following the OAuth flow.

Using --scope flag for different installation scopes

- `--scope local` (default): Available only to you in the current project
- `--scope project`: Shared with your team via `.mcp.json` file
- `--scope user`: Available to you across all projects

Use the `/mcp` command to list and manage the MCP servers you have installed, and use the `/context` command to understand the context token usage of your current session, including the number of tokens used by each MCP server that’s enabled.

Install the [Notion plugin for Claude Code](https://github.com/makenotion/claude-code-notion-plugin) to add the MCP server, Skills, and slash commands for common Notion workflows.

## [​](https://developers.notion.com/guides/mcp/get-started-with-mcp\#cursor)  Cursor

Cursor is an AI code editor that can connect to MCP servers. See the [Cursor MCP documentation](https://cursor.com/docs/mcp) for more details.

1

Create a `.cursor/mcp.json` file in your project root:

```
{
  "mcpServers": {
    "notion": {
      "url": "https://mcp.notion.com/mcp"
    }
  }
}
```

2

Open **Customize** in Cursor’s sidebar, then enable Notion and complete the OAuth flow to connect your workspace.

Global configuration

To configure Notion across all projects, add the same server configuration to `~/.cursor/mcp.json`:

```
{
  "mcpServers": {
    "notion": {
      "url": "https://mcp.notion.com/mcp"
    }
  }
}
```

## [​](https://developers.notion.com/guides/mcp/get-started-with-mcp\#fx)  fx

fx is an MCP client that makes configured servers available in its interactive shell and agent sessions. See the [fx MCP documentation](https://fx.sh/docs/capabilities/mcp) for more details.

1

Start an interactive fx session:

```
fx
```

2

Add the Notion server:

```
/mcp add --transport http notion https://mcp.notion.com/mcp
```

3

In the same session, run `/mcp auth notion --open` and complete the OAuth flow.

JSON configuration

To configure Notion MCP without the CLI, add it to `~/.fx/mcp.json`:

```
{
  "mcp": {
    "notion": {
      "type": "http",
      "url": "https://mcp.notion.com/mcp"
    }
  }
}
```

If a session is already open, run `/mcp reload` to pick up the change.

## [​](https://developers.notion.com/guides/mcp/get-started-with-mcp\#hermes)  Hermes

Hermes is a coding agent from Nous Research that can be extended with MCP servers. See the [Hermes MCP documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp) for more details.

1

Add the Notion server to `~/.hermes/config.yaml`:

```
mcp_servers:
  notion:
    url: "https://mcp.notion.com/mcp"
    auth: oauth
```

2

Authenticate by running:

```
hermes mcp login notion
```

Complete the OAuth flow to connect your Notion workspace.

Global configuration

The `~/.hermes/config.yaml` configuration above applies to all projects for the current Hermes profile. See the [Hermes configuration documentation](https://hermes-agent.nousresearch.com/docs/user-guide/configuration) for more details.

## [​](https://developers.notion.com/guides/mcp/get-started-with-mcp\#devin)  Devin

Devin is an AI software engineering agent that can connect to custom MCP servers. See the [Devin MCP documentation](https://docs.devin.ai/work-with-devin/mcp) for more details.

1

In Devin, go to **Settings** → **Connections** → **MCP servers**, then select **Add a custom MCP**.

2

Enter **Notion** as the server name, select **HTTP** as the transport, and set the server URL to:

```
https://mcp.notion.com/mcp
```

3

Select **OAuth** as the authentication method. Choose **Personal** access for an individual connection, or **Organization** access to share the connection with your organization.

4

Save the server, then complete the OAuth flow when Devin prompts you.

With **Organization** access, members share one authenticated connection. Use a Notion service account rather than a personal account, and have someone with the **Manage MCP Servers** permission complete the OAuth flow. With **Personal** access, each member authenticates their own Notion account.

## [​](https://developers.notion.com/guides/mcp/get-started-with-mcp\#pi)  Pi

Pi is an open-source, terminal-based coding agent. It uses the third-party [Pi MCP Adapter](https://github.com/nicobailon/pi-mcp-adapter) to connect to MCP servers.

1

Install the adapter and restart Pi:

```
pi install npm:pi-mcp-adapter
```

2

In Pi, run `/mcp setup`, then choose **Notion** to add the server.

3

Authenticate by running `/mcp-auth notion` and completing the OAuth flow to connect your Notion workspace.

Global and team configuration

To use Notion in every Pi project, add this configuration to `~/.config/mcp/mcp.json`. To share it with a team, commit the same configuration in a project-root `.mcp.json`; each teammate then completes the OAuth flow locally.

```
{
  "mcpServers": {
    "notion": {
      "url": "https://mcp.notion.com/mcp",
      "auth": "oauth"
    }
  }
}
```

## [​](https://developers.notion.com/guides/mcp/get-started-with-mcp\#vs-code-github-copilot)  VS Code (GitHub Copilot)

Visual Studio Code supports MCP servers in its agent customization experience. See the [VS Code MCP documentation](https://code.visualstudio.com/docs/agent-customization/mcp-servers) for more details.

1

Create a `.vscode/mcp.json` file in your workspace:

```
{
  "servers": {
    "notion": {
      "type": "http",
      "url": "https://mcp.notion.com/mcp"
    }
  }
}
```

2

Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and run **MCP: List Servers**

3

Start the Notion server and complete the OAuth flow when prompted

User-level configuration

To configure Notion MCP across all workspaces, run **MCP: Open User Configuration** from the Command Palette and add the server configuration there.

## [​](https://developers.notion.com/guides/mcp/get-started-with-mcp\#antigravity)  Antigravity

Antigravity supports MCP servers across its products. See the [Antigravity MCP documentation](https://antigravity.google/docs/mcp) for more details.We recommend connecting to Notion MCP as a custom server rather than using the pre-configured “Notion” connector in the Antigravity MCP gallery, which uses the deprecated [`notion-mcp-server`](https://github.com/makenotion/notion-mcp-server) package.

1

Follow the [Antigravity instructions for connecting custom MCP servers](https://antigravity.google/docs/mcp#connecting-custom-mcp-servers) and add the following to your `mcp_config.json`:

```
{
  "mcpServers": {
    "notion": {
      "serverUrl": "https://mcp.notion.com/mcp"
    }
  }
}
```

2

Save the configuration. Antigravity will prompt you to complete the OAuth flow to connect your Notion workspace.

## [​](https://developers.notion.com/guides/mcp/get-started-with-mcp\#other-mcp-clients)  Other MCP clients

If your MCP client isn’t listed above, add Notion as a remote MCP server:

- **Streamable HTTP (recommended):**`https://mcp.notion.com/mcp`
- **SSE fallback:**`https://mcp.notion.com/sse` — use this only if the client doesn’t support Streamable HTTP.

### [​](https://developers.notion.com/guides/mcp/get-started-with-mcp\#json-configuration)  JSON configuration

If your client accepts a JSON configuration, start with Streamable HTTP:

Streamable HTTP

SSE

STDIO (via mcp-remote)

```
{
  "mcpServers": {
    "notion": {
      "url": "https://mcp.notion.com/mcp"
    }
  }
}
```

```
{
  "mcpServers": {
    "notion": {
      "type": "sse",
      "url": "https://mcp.notion.com/sse"
    }
  }
}
```

```
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.notion.com/mcp"]
    }
  }
}
```

Use the STDIO configuration if your client doesn’t support remote HTTP connections.

## [​](https://developers.notion.com/guides/mcp/get-started-with-mcp\#troubleshooting)  Troubleshooting

My MCP client doesn't support remote MCP servers

Some MCP clients only support local stdio servers. You can still connect to Notion MCP using the [mcp-remote](https://www.npmjs.com/package/mcp-remote) bridge:

```
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.notion.com/mcp"]
    }
  }
}
```

As a last resort, you can run our [open-source MCP server](https://github.com/makenotion/notion-mcp-server) locally, though this package is no longer actively maintained.

Authentication issues

- Complete the OAuth flow when prompted.
- Disconnect and reconnect the client. Look for **Clear authentication** or **Disconnect** in its MCP settings.
- Check your permissions in the Notion workspace that you’re trying to access.

My MCP client isn't listed here

See [Other MCP clients](https://developers.notion.com/guides/mcp/get-started-with-mcp#other-mcp-clients) for the Notion MCP endpoints and JSON configuration examples. If the client doesn’t support MCP, contact its developer.

## [​](https://developers.notion.com/guides/mcp/get-started-with-mcp\#faqs)  FAQs

Can I use Notion MCP without interactive authorization?

Not yet. Notion MCP currently requires you to complete the OAuth authorization flow. We’re working on support for non-interactive authorization for automated workflows.

Does Notion MCP support file uploads?

Yes. Use the [`notion-create-file-upload` tool](https://developers.notion.com/guides/mcp/mcp-supported-tools#create-a-file-upload-url) to upload images and other files up to 20 MiB. Workspace file-size limits still apply.The tool returns a short-lived upload URL and the headers and form field that the MCP client must use to send the file. After the upload succeeds, pass the response’s `suggested_markdown` directly to `notion-create-pages` or `notion-update-page`, or include it on a separate line in `notion-create-comment` markdown to attach the file. For larger files, use the [file upload API](https://developers.notion.com/guides/data-apis/working-with-files-and-media).

What's the difference between Notion MCP and the open-source server?

**Notion MCP** (`https://mcp.notion.com/mcp`) is our hosted, actively maintained server. It supports OAuth authorization and requires no infrastructure setup.The **open-source server** ( [`notion-mcp-server`](https://github.com/makenotion/notion-mcp-server)) is no longer actively maintained. It supports bearer token authentication and the original JSON-based v1 APIs, which may be useful for automated workflows, but requires you to manage your own connection and deployment.For most users, we recommend Notion MCP.

I'm building my own MCP client

If you’re integrating Notion MCP into your own application, see
[Build an MCP client for Notion](https://developers.notion.com/guides/mcp/build-mcp-client) for OAuth
and connection requirements.

Assistant

Responses are generated using AI and may contain mistakes.