import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import type { BenchmarkTrial } from "./summarize";

export const verifyBenchmarkSchema = (value: unknown) => {
  const schema = JSON.parse(
    readFileSync(resolve("benchmarks/schema/run-v2.schema.json"), "utf8"),
  );
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);
  if (!validate(value)) {
    return {
      ok: false,
      errors: (validate.errors ?? []).map(
        (error) => `${error.instancePath || "/"} ${error.message}`,
      ),
    };
  }
  return { ok: true, errors: [] as string[] };
};

export const verifyBenchmark = (value: unknown) => {
  const schemaResult = verifyBenchmarkSchema(value);
  if (!schemaResult.ok) return schemaResult;
  const run = value as { trials: BenchmarkTrial[]; summary: Record<string, any> };
  const warm = run.trials.filter(
    (trial) => trial.stratum === "controlled-local" && !trial.cold_start,
  );
  const cold = run.trials.filter(
    (trial) => trial.stratum === "controlled-local" && trial.cold_start,
  );
  const errors: string[] = [];
  for (const lane of ["webmcp", "official-mcp"] as const) {
    if (warm.filter((trial) => trial.lane === lane).length !== 100) {
      errors.push(`${lane} must contain 100 controlled warm trials.`);
    }
    if (cold.filter((trial) => trial.lane === lane).length !== 10) {
      errors.push(`${lane} must contain 10 controlled cold trials.`);
    }
    if (
      run.trials.some(
        (trial) =>
          trial.stratum === "controlled-local" &&
          trial.lane === lane &&
          (!trial.completed || !trial.semantic_pass),
      )
    ) {
      errors.push(`${lane} contains an incomplete or semantically failed trial.`);
    }
    const p95 = run.summary?.["controlled-local"]?.[lane]?.warm
      ?.task_duration_ms?.p95;
    if (!p95) errors.push(`${lane} warm summary omitted its eligible p95.`);
  }
  return { ok: errors.length === 0, errors };
};

export const verifyLiveBenchmark = (value: unknown, minimumPairs = 20) => {
  const schemaResult = verifyBenchmarkSchema(value);
  if (!schemaResult.ok) return schemaResult;
  const run = value as {
    environment: { drawmcp_commit?: string; drawmcp_dirty?: boolean };
    method: { stratum?: string };
    trials: BenchmarkTrial[];
    summary: Record<string, any>;
  };
  const errors: string[] = [];
  if (run.method.stratum !== "live-service") {
    errors.push("Live evidence must declare the live-service stratum.");
  }
  if (run.environment.drawmcp_dirty !== false) {
    errors.push("Live evidence must name a clean DrawMCP deployment.");
  }
  if (!/^[a-f0-9]{40}$/.test(run.environment.drawmcp_commit ?? "")) {
    errors.push("Live evidence must name the deployed DrawMCP commit.");
  }
  if (run.trials.some(({ stratum }) => stratum !== "live-service")) {
    errors.push("Live evidence cannot mix benchmark strata.");
  }
  for (const lane of ["webmcp", "official-mcp"] as const) {
    const laneTrials = run.trials.filter((trial) => trial.lane === lane);
    if (laneTrials.length < minimumPairs) {
      errors.push(`${lane} must contain at least ${minimumPairs} live trials.`);
    }
    if (
      laneTrials.some(
        (trial) => !trial.completed || !trial.semantic_pass,
      )
    ) {
      errors.push(`${lane} contains an incomplete or semantically failed trial.`);
    }
  }
  const webTrials = run.trials.filter((trial) => trial.lane === "webmcp");
  if (
    webTrials.some(
      (trial) =>
        (trial as BenchmarkTrial & { visual_change_detected?: boolean })
          .visual_change_detected !== true,
    )
  ) {
    errors.push("Every WebMCP live trial must prove a rendered canvas change.");
  }
  const trialIds = new Set(run.trials.map(({ trial }) => trial));
  for (const trialId of trialIds) {
    const pair = run.trials.filter(({ trial }) => trial === trialId);
    if (
      pair.length !== 2 ||
      new Set(pair.map(({ lane }) => lane)).size !== 2 ||
      new Set(pair.map(({ order }) => order)).size !== 2
    ) {
      errors.push(`Live trial ${trialId} is not a complete randomized pair.`);
    }
  }
  for (const lane of ["webmcp", "official-mcp"] as const) {
    const summary = run.summary?.["live-service"]?.[lane]?.warm;
    if (!summary?.task_duration_ms?.p50 || !summary?.task_duration_ms?.p90) {
      errors.push(`${lane} live summary omitted p50 or p90.`);
    }
    if (summary?.attempts < 40 && summary?.task_duration_ms?.p95 !== null) {
      errors.push(`${lane} live p95 must be withheld below 40 trials.`);
    }
  }
  return { ok: errors.length === 0, errors };
};
