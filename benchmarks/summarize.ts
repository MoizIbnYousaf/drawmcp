import { summarizeDurations, wilsonInterval } from "./stats";

export type BenchmarkTrial = {
  stratum: "controlled-local" | "live-service" | "matched-host";
  trial: number;
  lane: "webmcp" | "official-mcp";
  order: "A" | "B";
  cold_start: boolean;
  completed: boolean;
  semantic_pass: boolean;
  task_duration_ms?: number;
  component_duration_ms?: number;
  tool_calls: number;
  input_bytes: number;
  output_bytes: number;
  failure?: string | null;
};

const summarizeGroup = (trials: BenchmarkTrial[], seed: number) => {
  const successful = trials.filter(
    (trial) => trial.completed && trial.semantic_pass,
  );
  return {
    attempts: trials.length,
    completed: trials.filter(({ completed }) => completed).length,
    semantic_successes: successful.length,
    completion: wilsonInterval(successful.length, trials.length),
    task_duration_ms: summarizeDurations(
      successful.flatMap((trial) =>
        trial.task_duration_ms === undefined ? [] : [trial.task_duration_ms],
      ),
      seed,
    ),
    component_duration_ms: summarizeDurations(
      successful.flatMap((trial) =>
        trial.component_duration_ms === undefined
          ? []
          : [trial.component_duration_ms],
      ),
      seed + 1_000,
    ),
    total_tool_calls: trials.reduce(
      (total, trial) => total + trial.tool_calls,
      0,
    ),
    total_input_bytes: trials.reduce(
      (total, trial) => total + trial.input_bytes,
      0,
    ),
    total_output_bytes: trials.reduce(
      (total, trial) => total + trial.output_bytes,
      0,
    ),
  };
};

export const summarizeBenchmark = (trials: BenchmarkTrial[], seed: number) => {
  const result: Record<string, unknown> = {};
  for (const stratum of [
    "controlled-local",
    "live-service",
    "matched-host",
  ] as const) {
    const stratumTrials = trials.filter((trial) => trial.stratum === stratum);
    if (stratumTrials.length === 0) continue;
    result[stratum] = Object.fromEntries(
      (["webmcp", "official-mcp"] as const).map((lane, index) => [
        lane,
        {
          warm: summarizeGroup(
            stratumTrials.filter(
              (trial) => trial.lane === lane && !trial.cold_start,
            ),
            seed + index * 100,
          ),
          cold: summarizeGroup(
            stratumTrials.filter(
              (trial) => trial.lane === lane && trial.cold_start,
            ),
            seed + index * 100 + 10,
          ),
        },
      ]),
    );
  }
  return result;
};
