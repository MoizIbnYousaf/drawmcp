import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020.js";
import {
  summarizeEvalReport,
  type EvalReport,
} from "../../evals/oracles/eval-report";
import { writeModelSchemaManifest } from "./export-model-schema";

const args = process.argv.slice(2);
const option = (name: string): string | undefined => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const model =
  option("--model") ?? process.env.DRAWMCP_EVAL_MODEL ?? "qwen3:4b-instruct";
const runs = Number(option("--runs") ?? process.env.DRAWMCP_EVAL_RUNS ?? "5");
if (!Number.isInteger(runs) || runs < 1) {
  throw new Error("Probabilistic eval runs must be a positive integer.");
}

const recordedAt = new Date();
const runId = recordedAt.toISOString().replace(/[:.]/g, "-");
const root = resolve(".evals/probabilistic", runId);
const categories = [
  { name: "direct", threshold: 0.95 },
  { name: "ambiguous", threshold: 0.85 },
  { name: "recovery", threshold: 0.9 },
  { name: "no-tool", threshold: 1 },
] as const;

const ollamaTags = await fetch("http://127.0.0.1:11434/api/tags")
  .then((response) => {
    if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}.`);
    return response.json() as Promise<{
      models: Array<{ name: string; model: string; digest: string }>;
    }>;
  })
  .catch((error) => {
    throw new Error(
      `Ollama is unavailable. Start it before running model evals. ${String(error)}`,
    );
  });
const installedModel = ollamaTags.models.find(
  (candidate) => candidate.name === model || candidate.model === model,
);
if (!installedModel) {
  throw new Error(`Ollama model ${model} is not installed.`);
}

mkdirSync(root, { recursive: true });
const exactTools = JSON.parse(readFileSync(resolve("evals/tools.json"), "utf8")) as {
  tools: Array<{ name: string; inputSchema: Record<string, unknown> }>;
};
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validators = new Map(
  exactTools.tools.map((tool) => [tool.name, ajv.compile(tool.inputSchema)]),
);
const validateCall = (name: string, args: Record<string, unknown>) =>
  validators.get(name)?.(args) === true;
const schemaManifestPath = resolve(root, "schema-manifest.json");
const ollamaSchemaPath = resolve(root, "tools-model-ollama.json");
writeModelSchemaManifest(schemaManifestPath, ollamaSchemaPath);

const summaries: Record<string, ReturnType<typeof summarizeEvalReport>> = {};
const reportPaths: Record<string, string> = {};
for (const category of categories) {
  const outputDirectory = resolve(root, category.name);
  mkdirSync(outputDirectory, { recursive: true });
  execFileSync(
    resolve("node_modules/.bin/webmcp-evals"),
    [
      "local",
      "-b",
      "ollama",
      "-m",
      model,
      "-r",
      String(runs),
      "-t",
      ollamaSchemaPath,
      "-e",
      resolve(`evals/cases/${category.name}.json`),
      "--reporter",
      "json",
      "-o",
      outputDirectory,
    ],
    {
      env: { ...process.env, OLLAMA_HOST: "http://127.0.0.1:11434" },
      stdio: "inherit",
    },
  );
  const reportPath = readdirSync(outputDirectory)
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => resolve(outputDirectory, entry))
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs)[0];
  if (!reportPath) throw new Error(`No JSON report was written for ${category.name}.`);
  const report = JSON.parse(readFileSync(reportPath, "utf8")) as EvalReport;
  summaries[category.name] = summarizeEvalReport(
    report,
    category.threshold,
    validateCall,
  );
  reportPaths[category.name] = reportPath.replace(`${process.cwd()}/`, "");
}

const schemaManifest = JSON.parse(readFileSync(schemaManifestPath, "utf8"));
const passed = Object.values(summaries).every(
  ({ meets_threshold }) => meets_threshold,
);
const summary = {
  schema_version: 1,
  run_id: runId,
  recorded_at: recordedAt.toISOString(),
  runner: "webmcp-evals@0.0.4",
  backend: "ollama",
  model,
  model_digest: installedModel.digest,
  runs_per_case: runs,
  schema: schemaManifest,
  categories: summaries,
  reports: reportPaths,
  passed,
};
const summaryPath = resolve(root, "summary.json");
writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summaries, null, 2));
console.log(`Probabilistic eval summary: ${summaryPath}`);
if (!passed) process.exitCode = 1;
