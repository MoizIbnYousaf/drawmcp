import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import { summarizeEvalReport } from "./eval-report";

const readJson = (path: string) => JSON.parse(readFileSync(resolve(path), "utf8"));
const sha256 = (path: string) =>
  createHash("sha256").update(readFileSync(resolve(path))).digest("hex");
const canonicalJsonSha256 = (path: string) =>
  createHash("sha256")
    .update(JSON.stringify(readJson(path)))
    .digest("hex");

describe("accepted probabilistic evidence", () => {
  it("replays hashes, schemas, thresholds, and all recorded attempts", () => {
    const runId = readdirSync(resolve("evidence/evals"), {
      withFileTypes: true,
    })
      .filter((entry) => entry.isDirectory())
      .map(({ name }) => name)
      .sort()
      .at(-1);
    expect(runId).toBeTruthy();

    const summary = readJson(`evidence/evals/${runId}/summary.json`);
    const exactTools = readJson("evals/tools.json");
    const mappedToolsPath = `evidence/evals/${runId}/tools-model-ollama.json`;
    expect(summary).toMatchObject({
      run_id: runId,
      runs_per_case: 5,
      passed: true,
      evidence_class: "local-model-probabilistic",
      judged_host: false,
    });
    expect(summary.model_digest).toMatch(/^[a-f0-9]{64}$/);
    expect(summary.schema.exact.sha256).toBe(sha256("evals/tools.json"));
    expect(summary.schema.ollama_evaluator_mapping.sha256).toBe(
      canonicalJsonSha256(mappedToolsPath),
    );

    const ajv = new Ajv2020({ allErrors: true, strict: true });
    const validators = new Map(
      exactTools.tools.map((tool: any) => [
        tool.name,
        ajv.compile(tool.inputSchema),
      ]),
    );
    const validateCall = (name: string, args: Record<string, unknown>) =>
      validators.get(name)?.(args) === true;

    for (const [category, expected] of Object.entries(
      summary.categories,
    ) as Array<[string, any]>) {
      const reportPath = summary.reports[category];
      expect(existsSync(resolve(reportPath)), reportPath).toBe(true);
      const report = readJson(reportPath);
      const cases = readJson(`evals/cases/${category}.json`);
      expect(report.config).toMatchObject({
        backend: summary.backend,
        model: summary.model,
        runs: summary.runs_per_case,
        toolSchemaFile: mappedToolsPath,
      });
      expect(report.results.results).toHaveLength(
        cases.length * summary.runs_per_case,
      );
      expect(
        summarizeEvalReport(report, expected.threshold, validateCall),
      ).toEqual(expected);
    }
  });
});
