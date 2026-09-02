import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import os from "node:os";
import process from "node:process";
import type { SceneExpectation } from "../../evals/oracles/scene-oracle";
import { createSeededRandom } from "../../benchmarks/stats";
import {
  summarizeBenchmark,
  type BenchmarkTrial,
} from "../../benchmarks/summarize";
import { verifyBenchmarkSchema } from "../../benchmarks/verify";
import { OfficialMcpLane } from "./official-mcp-lane";
import { WebMcpLane } from "./webmcp-lane";

type Scenario = {
  name: string;
  webmcp_elements: Array<Record<string, unknown>>;
  official_elements: Array<Record<string, unknown>>;
  expected_scene: SceneExpectation;
};

const args = process.argv.slice(2);
const option = (name: string): string | undefined => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const pairs = Number(option("--pairs") ?? "5");
const seed = Number(option("--seed") ?? "20260902");
const deployedCommit = option("--deployed-commit") ?? "unverified";
const webUrl = option("--web-url") ?? "https://drawmcp.dev/canvas";
const mcpUrl = option("--mcp-url") ?? "https://mcp.excalidraw.com/mcp";
if (!Number.isInteger(pairs) || pairs < 1 || !Number.isInteger(seed)) {
  throw new Error("Live benchmark pairs and seed must be valid integers.");
}

const recordedAt = new Date();
const runId = `live-${recordedAt.toISOString().replace(/[:.]/g, "-")}`;
const outputPath = resolve(
  option("--output") ?? `.benchmarks/${runId}/raw.json`,
);
const scenarioPath = resolve("benchmarks/scenarios/architecture-diagram.json");
const scenario = JSON.parse(readFileSync(scenarioPath, "utf8")) as Scenario;
const random = createSeededRandom(seed);
const trials: BenchmarkTrial[] = [];
const web = new WebMcpLane(webUrl);
const official = new OfficialMcpLane(mcpUrl);

const capture = async (
  lane: BenchmarkTrial["lane"],
  trial: number,
  order: "A" | "B",
  run: () => Promise<Record<string, unknown>>,
) => {
  try {
    const result = await run();
    trials.push({
      stratum: "live-service",
      trial,
      lane,
      order,
      cold_start: false,
      completed: result.completed === true,
      semantic_pass: result.semantic_pass === true,
      task_duration_ms: Number(result.task_duration_ms),
      component_duration_ms: Number(result.component_duration_ms),
      tool_calls: Number(result.tool_calls),
      input_bytes: Number(result.input_bytes),
      output_bytes: Number(result.output_bytes),
      failure: null,
      ...result,
    } as BenchmarkTrial);
  } catch (error) {
    const failure = error instanceof Error ? error.message : String(error);
    trials.push({
      stratum: "live-service",
      trial,
      lane,
      order,
      cold_start: false,
      completed: false,
      semantic_pass: false,
      tool_calls: 0,
      input_bytes: 0,
      output_bytes: 0,
      failure,
    });
    if (failure.includes("HTTP 429")) throw error;
  }
};

const main = async () => {
  await web.start();
  await official.start();
  const inventory = await official.listTools();
  try {
    for (let pair = 1; pair <= pairs; pair += 1) {
      const lanes = random() < 0.5
        ? (["webmcp", "official-mcp"] as const)
        : (["official-mcp", "webmcp"] as const);
      for (const [index, lane] of lanes.entries()) {
        await capture(
          lane,
          pair,
          index === 0 ? "A" : "B",
          lane === "webmcp"
            ? () => web.runWarmTask(scenario)
            : () => official.runTask(scenario as never),
        );
        await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
      }
      console.log(`Live observation pairs: ${pair}/${pairs}`);
    }
    const run = {
      schema_version: 2,
      run_id: runId,
      recorded_at: recordedAt.toISOString(),
      environment: {
        machine: `${os.platform()} ${os.arch()}`,
        os_release: os.release(),
        node: process.version,
        chrome: await web.chromeVersion(),
        drawmcp_commit: deployedCommit,
        drawmcp_dirty: false,
        excalidraw_mcp_commit: "live-service-unverified",
      },
      method: {
        stratum: "live-service",
        random_seed: seed,
        warm_pairs: pairs,
        cold_pairs: 0,
        order: "seeded randomized AB/BA with 500 ms throttle",
        webmcp_task_boundary:
          "Production page add_elements plus fit_to_content completion.",
        official_mcp_task_boundary:
          "Public Streamable HTTP create_view completion; widget render excluded.",
        comparability:
          "Small live observation only. No p95 or protocol ranking is permitted.",
      },
      scenario: {
        path: "benchmarks/scenarios/architecture-diagram.json",
        name: scenario.name,
        required_nodes: scenario.expected_scene.nodes.length,
        required_edges: scenario.expected_scene.edges?.length ?? 0,
        official_registered_tools: inventory.map(({ name }) => name),
        official_model_visible_tools: inventory
          .filter(
            (tool) =>
              !(tool._meta as { ui?: { visibility?: string[] } })?.ui?.visibility,
          )
          .map(({ name }) => name),
      },
      trials,
      summary: summarizeBenchmark(trials, seed),
    };
    const verification = verifyBenchmarkSchema(run);
    if (!verification.ok) {
      throw new Error(`Live observation schema failed: ${verification.errors.join(" ")}`);
    }
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(run, null, 2)}\n`);
    console.log(`Live observation raw data: ${outputPath}`);
  } finally {
    await official.stop();
    await web.stop();
  }
};

main().catch(async (error) => {
  await official.stop().catch(() => undefined);
  await web.stop().catch(() => undefined);
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
