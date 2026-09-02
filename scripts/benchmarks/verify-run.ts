import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { verifyBenchmark } from "../../benchmarks/verify";

const requestedPath = process.argv[2];
if (!requestedPath) throw new Error("Pass a benchmark raw JSON file to verify.");
const path = resolve(requestedPath);
const result = verifyBenchmark(JSON.parse(readFileSync(path, "utf8")));
if (!result.ok) {
  console.error(result.errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Benchmark verification passed: ${path}`);
}
