import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { verifyLiveBenchmark } from "../../benchmarks/verify";

const requestedPath = process.argv[2];
if (!requestedPath) throw new Error("Pass a live benchmark raw JSON file.");
const sourcePath = resolve(requestedPath);
const result = verifyLiveBenchmark(
  JSON.parse(readFileSync(sourcePath, "utf8")),
);
if (!result.ok) {
  throw new Error(`Live benchmark verification failed: ${result.errors.join(" ")}`);
}
console.log(`Live benchmark verification passed: ${sourcePath}`);
