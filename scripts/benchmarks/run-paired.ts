import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import os from "node:os";
import process from "node:process";
import type { SceneExpectation } from "../../evals/oracles/scene-oracle";
import { createSeededRandom } from "../../benchmarks/stats";
import {
  summarizeBenchmark,
  type BenchmarkTrial,
} from "../../benchmarks/summarize";
import { verifyBenchmark } from "../../benchmarks/verify";
import { OfficialMcpLane } from "./official-mcp-lane";
import { WebMcpLane } from "./webmcp-lane";

type Scenario = {
  schema_version: number;
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
const warmPairs = Number(option("--warm-pairs") ?? "100");
const coldPairs = Number(option("--cold-pairs") ?? "10");
const seed = Number(option("--seed") ?? "20260902");
if (
  !Number.isInteger(warmPairs) ||
  warmPairs < 1 ||
  !Number.isInteger(coldPairs) ||
  coldPairs < 0 ||
  !Number.isInteger(seed)
) {
  throw new Error("Benchmark counts and seed must be valid integers.");
}

const recordedAt = new Date();
const runId = `controlled-${recordedAt.toISOString().replace(/[:.]/g, "-")}`;
const outputPath = resolve(
  option("--output") ?? `.benchmarks/${runId}/raw.json`,
);
const scenarioPath = resolve(
  option("--scenario") ?? "benchmarks/scenarios/architecture-diagram.json",
);
const scenario = JSON.parse(readFileSync(scenarioPath, "utf8")) as Scenario;
const random = createSeededRandom(seed);
const trials: BenchmarkTrial[] = [];

const git = (...gitArgs: string[]) =>
  execFileSync("git", gitArgs, { encoding: "utf8" }).trim();

const capture = async (
  lane: BenchmarkTrial["lane"],
  trial: number,
  order: BenchmarkTrial["order"],
  coldStart: boolean,
  run: () => Promise<Record<string, unknown>>,
): Promise<BenchmarkTrial> => {
  try {
    const result = await run();
    return {
      stratum: "controlled-local",
      trial,
      lane,
      order,
      cold_start: coldStart,
      completed: result.completed === true,
      semantic_pass: result.semantic_pass === true,
      task_duration_ms: Number(result.task_duration_ms),
      component_duration_ms: Number(result.component_duration_ms),
      tool_calls: Number(result.tool_calls),
      input_bytes: Number(result.input_bytes),
      output_bytes: Number(result.output_bytes),
      failure: null,
      ...result,
    } as BenchmarkTrial;
  } catch (error) {
    return {
      stratum: "controlled-local",
      trial,
      lane,
      order,
      cold_start: coldStart,
      completed: false,
      semantic_pass: false,
      tool_calls: 0,
      input_bytes: 0,
      output_bytes: 0,
      failure: error instanceof Error ? error.message : String(error),
    };
  }
};

const runOrderedPair = async (
  trial: number,
  coldStart: boolean,
  web: () => Promise<Record<string, unknown>>,
  official: () => Promise<Record<string, unknown>>,
) => {
  const webFirst = random() < 0.5;
  const sequence = webFirst
    ? ([
        ["webmcp", web],
        ["official-mcp", official],
      ] as const)
    : ([
        ["official-mcp", official],
        ["webmcp", web],
      ] as const);
  for (const [index, [lane, run]] of sequence.entries()) {
    trials.push(
      await capture(lane, trial, index === 0 ? "A" : "B", coldStart, run),
    );
  }
};

const web = new WebMcpLane();
const official = new OfficialMcpLane();

const main = async () => {
  await web.start();
  await official.start();
  const inventory = await official.listTools();
  const modelVisibleTools = inventory
    .filter((tool) => {
      const visibility = (tool._meta as { ui?: { visibility?: string[] } })?.ui
        ?.visibility;
      return !visibility || visibility.includes("model");
    })
    .map(({ name }) => name);

  try {
    await web.runWarmTask(scenario);
    await official.runTask(scenario as never);
    for (let pair = 1; pair <= warmPairs; pair += 1) {
      await runOrderedPair(
        pair,
        false,
        () => web.runWarmTask(scenario),
        () => official.runTask(scenario as never),
      );
      if (pair % 10 === 0 || pair === warmPairs) {
        console.log(`Controlled warm pairs: ${pair}/${warmPairs}`);
      }
    }

    for (let pair = 1; pair <= coldPairs; pair += 1) {
      await runOrderedPair(
        pair,
        true,
        () => web.runColdTask(scenario),
        async () => {
          const coldOfficial = new OfficialMcpLane();
          const started = performance.now();
          await coldOfficial.start();
          try {
            const result = await coldOfficial.runTask(scenario as never);
            return {
              ...result,
              task_duration_ms: performance.now() - started,
            };
          } finally {
            await coldOfficial.stop();
          }
        },
      );
      console.log(`Controlled cold pairs: ${pair}/${coldPairs}`);
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
        drawmcp_commit: git("rev-parse", "HEAD"),
        drawmcp_dirty: git("status", "--porcelain").length > 0,
        excalidraw_mcp_commit: git(
          "-C",
          "vendor/excalidraw-mcp",
          "rev-parse",
          "HEAD",
        ),
      },
      method: {
        stratum: "controlled-local",
        random_seed: seed,
        warm_pairs: warmPairs,
        cold_pairs: coldPairs,
        discarded_warmup_pairs: 1,
        order: "seeded randomized AB/BA",
        webmcp_task_boundary:
          "Puppeteer WebMCP add_elements plus fit_to_content completion on a mounted local page; component time is the sum of page PerformanceMeasure entries.",
        official_mcp_task_boundary:
          "Streamable HTTP create_view completion on the pinned local server; checkpoint read is an untimed semantic oracle and widget render is excluded.",
        comparability:
          "Task semantics and local machine are controlled. Component durations contain different work and are not an end-to-end protocol ranking.",
      },
      scenario: {
        path: scenarioPath.replace(`${process.cwd()}/`, ""),
        name: scenario.name,
        required_nodes: scenario.expected_scene.nodes.length,
        required_edges: scenario.expected_scene.edges?.length ?? 0,
        official_registered_tools: inventory.map(({ name }) => name),
        official_model_visible_tools: modelVisibleTools,
      },
      trials,
      summary: summarizeBenchmark(trials, seed),
    };
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, `${JSON.stringify(run, null, 2)}\n`);
    if (warmPairs === 100 && coldPairs === 10) {
      const verification = verifyBenchmark(run);
      if (!verification.ok) {
        throw new Error(`Benchmark verification failed: ${verification.errors.join(" ")}`);
      }
    }
    console.log(`Benchmark raw data: ${outputPath}`);
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
