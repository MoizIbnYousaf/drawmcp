import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import type { BenchmarkTrial } from "./summarize";

export const verifyBenchmark = (value: unknown) => {
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
