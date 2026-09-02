import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createServer } from "node:net";
import { resolve } from "node:path";
import {
  evaluateScene,
  type ProjectedSceneElement,
  type SceneExpectation,
} from "../../evals/oracles/scene-oracle";

type Scenario = {
  official_elements: ProjectedSceneElement[];
  expected_scene: SceneExpectation;
};

let requestId = 0;

const availablePort = async () =>
  new Promise<number>((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Could not allocate a benchmark port."));
        return;
      }
      const port = address.port;
      server.close((error) => (error ? reject(error) : resolvePort(port)));
    });
  });

const parseMcpResponse = (text: string) => {
  const dataLine = text
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .at(-1);
  const payload = JSON.parse(dataLine ? dataLine.slice(6) : text) as {
    result?: Record<string, unknown>;
    error?: { message?: string };
  };
  if (payload.error) throw new Error(payload.error.message ?? "MCP request failed.");
  if (!payload.result) throw new Error("MCP response omitted its result.");
  return payload.result;
};

export class OfficialMcpLane {
  private process?: ChildProcessWithoutNullStreams;
  private endpoint?: string;

  constructor(private readonly configuredEndpoint?: string) {}

  async start(): Promise<void> {
    if (this.configuredEndpoint) {
      this.endpoint = this.configuredEndpoint;
      return;
    }
    const port = await availablePort();
    this.endpoint = `http://127.0.0.1:${port}/mcp`;
    this.process = spawn(
      process.execPath,
      [resolve("vendor/excalidraw-mcp/dist/index.js")],
      {
        env: { ...process.env, PORT: String(port) },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    await new Promise<void>((resolveStart, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Official MCP server did not start.")),
        10_000,
      );
      const onData = (chunk: Buffer) => {
        if (!chunk.toString().includes("MCP server listening")) return;
        clearTimeout(timeout);
        this.process?.stdout.off("data", onData);
        resolveStart();
      };
      this.process?.stdout.on("data", onData);
      this.process?.once("exit", (code) => {
        clearTimeout(timeout);
        reject(new Error(`Official MCP server exited during startup (${code}).`));
      });
    });
  }

  async stop(): Promise<void> {
    const child = this.process;
    this.process = undefined;
    this.endpoint = this.configuredEndpoint;
    if (!child || child.exitCode !== null) return;
    child.kill("SIGTERM");
    await new Promise<void>((resolveStop) => {
      const timeout = setTimeout(() => {
        child.kill("SIGKILL");
        resolveStop();
      }, 2_000);
      child.once("exit", () => {
        clearTimeout(timeout);
        resolveStop();
      });
    });
  }

  async listTools(): Promise<Array<{ name: string; _meta?: unknown }>> {
    const result = await this.post("tools/list", {});
    return (result.tools ?? []) as Array<{ name: string; _meta?: unknown }>;
  }

  async runTask(scenario: Scenario) {
    const elements = JSON.stringify(scenario.official_elements);
    const input = { elements };
    const started = performance.now();
    const createResult = await this.callTool("create_view", input);
    const componentDuration = performance.now() - started;
    const checkpointId = (
      createResult.structuredContent as { checkpointId?: string } | undefined
    )?.checkpointId;
    if (!checkpointId) throw new Error("create_view omitted its checkpoint ID.");
    const checkpointResult = await this.callTool("read_checkpoint", {
      id: checkpointId,
    });
    const content = checkpointResult.content as Array<{ text?: string }>;
    const checkpoint = JSON.parse(content[0]?.text ?? "{}") as {
      elements?: ProjectedSceneElement[];
    };
    const evaluation = evaluateScene(
      checkpoint.elements ?? [],
      scenario.expected_scene,
    );
    return {
      completed: true,
      semantic_pass: evaluation.ok,
      task_duration_ms: componentDuration,
      component_duration_ms: componentDuration,
      tool_calls: 1,
      oracle_calls: 1,
      input_bytes: Buffer.byteLength(JSON.stringify(input)),
      output_bytes: Buffer.byteLength(JSON.stringify(createResult)),
      semantic_evaluation: evaluation,
      checkpoint_id: checkpointId,
    };
  }

  private async callTool(name: string, args: Record<string, unknown>) {
    return this.post("tools/call", { name, arguments: args });
  }

  private async post(method: string, params: Record<string, unknown>) {
    if (!this.endpoint) throw new Error("Official MCP lane is not running.");
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        accept: "application/json, text/event-stream",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: ++requestId,
        method,
        params,
      }),
    });
    if (!response.ok) {
      throw new Error(`Official MCP returned HTTP ${response.status}.`);
    }
    return parseMcpResponse(await response.text());
  }
}
