import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { verifyBenchmark } from "../../benchmarks/verify";

const requestedPath = process.argv[2];
if (!requestedPath) throw new Error("Pass a benchmark raw JSON file to accept.");
const sourcePath = resolve(requestedPath);
const run = JSON.parse(readFileSync(sourcePath, "utf8")) as Record<string, any>;
const verification = verifyBenchmark(run);
if (!verification.ok) {
  throw new Error(`Cannot accept benchmark: ${verification.errors.join(" ")}`);
}
if (run.environment?.drawmcp_dirty !== false) {
  throw new Error("Cannot accept a benchmark recorded from a dirty DrawMCP tree.");
}

const publicRoot = resolve("public/benchmarks", String(run.run_id));
mkdirSync(publicRoot, { recursive: true });
const sanitized = {
  ...run,
  trials: run.trials.map(
    ({ checkpoint_id: _checkpointId, ...trial }: Record<string, unknown>) =>
      trial,
  ),
};
const rawSource = `${JSON.stringify(sanitized, null, 2)}\n`;
const rawPath = resolve(publicRoot, "raw.json");
writeFileSync(rawPath, rawSource);

const controlled = run.summary["controlled-local"];
const summary = {
  schema_version: 2,
  run_id: run.run_id,
  recorded_at: run.recorded_at,
  evidence_class: "controlled-local-component-boundary",
  comparable_as_end_to_end: false,
  boundary_note: run.method.comparability,
  environment: run.environment,
  scenario: run.scenario,
  counts: {
    total_trials: run.trials.length,
    warm_pairs: run.method.warm_pairs,
    cold_pairs: run.method.cold_pairs,
    semantic_failures: run.trials.filter(
      (trial: Record<string, unknown>) => trial.semantic_pass !== true,
    ).length,
  },
  lanes: controlled,
  raw: {
    path: `/benchmarks/${run.run_id}/raw.json`,
    sha256: createHash("sha256").update(rawSource).digest("hex"),
    bytes: Buffer.byteLength(rawSource),
  },
};
const summarySource = `${JSON.stringify(summary, null, 2)}\n`;
writeFileSync(resolve(publicRoot, "summary.json"), summarySource);
writeFileSync(resolve("public/benchmarks/latest.json"), summarySource);
console.log(`Accepted benchmark evidence: ${publicRoot}`);
